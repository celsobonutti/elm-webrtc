import { createChannel, WebRTCMessageSender, WebRTCMessage } from './socket';
import { Channel, Presence } from 'phoenix';
import { v4 as uuid } from 'uuid';

type WebRTCConfig = {
  onRemoteJoin: Function;
  onRemoteLeave: Function;
  roomId: string;
  onTrack: (stream: readonly MediaStream[]) => void;
};

const startLocalStream = async (stream: MediaStream) => {
  const localCamera = document.querySelector(
    '#local-camera'
  ) as HTMLVideoElement;
  localCamera.srcObject = stream;
};

export const createWebRtcConnection = async (config: WebRTCConfig) => {
  const userId = uuid();

  const localStreamMedia = await navigator.mediaDevices.getUserMedia({
    audio: true,
    video: true,
  });

  startLocalStream(localStreamMedia);

  const { channel, sendMessage } = createChannel(config.roomId, userId);

  const peerMap = new Map();

  const presence = new Presence(channel);

  presence.onSync(() => {
    console.info(presence.list())
  })

  presence.onJoin(async (id, current, newPres) => {
    if (id === userId) return;
    if (!current) {
      const peerConnection = await createPeerConnection(
        channel,
        sendMessage,
        config.onTrack,
        localStreamMedia
      );
      peerMap.set(id, peerConnection);
    } else {
    }
  });

  presence.onLeave((id, current) => {
    if (current) {
      const disconnectedPeer = peerMap.get(id);
      disconnectedPeer?.close();
      peerMap.delete(id);

      config.onRemoteLeave(id);
    } else {
      console.log('user left in one of the devices');
    }
  });
};

const createPeerConnection = async (
  channel: Channel,
  sendMessage: WebRTCMessageSender,
  onTrack: (streams: readonly MediaStream[]) => void,
  localStreamMedia: MediaStream
) => {
  const peerConnection = new RTCPeerConnection({
    iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
  });

  const start = async () => {
    try {
      for (const track of localStreamMedia.getTracks()) {
        peerConnection.addTrack(track);
      }
    } catch (err) {
      console.error(err);
    }
  };

  peerConnection.ontrack = ({ track, streams }) => {
    track.onunmute = () => {
      onTrack(streams);
    };
  };

  let makingOffer = false;

  peerConnection.onicecandidate = ({ candidate }) => {
    if (candidate) {
      sendMessage({ type: 'ice-candidate', content: candidate });
    }
  };

  peerConnection.onnegotiationneeded = async () => {
    try {
      makingOffer = true;
      const offer = await peerConnection.createOffer();
      await peerConnection.setLocalDescription(offer);
      sendMessage({ type: 'video-offer', content: offer });
    } catch (err) {
      console.error('[NEGOTIATION NEEDED] ' + err);
    } finally {
      makingOffer = false;
    }
  };

  channel.on('peer-message', async (payload) => {
    const body = JSON.parse(payload.body) as WebRTCMessage;

    try {
      switch (body.type) {
        case 'video-answer':
          await peerConnection.setRemoteDescription(body.content);
          break;
        case 'video-offer':
          if (makingOffer || peerConnection.signalingState !== 'stable') return;
          await peerConnection.setRemoteDescription(body.content);
          const answer = await peerConnection.createAnswer();
          await peerConnection.setLocalDescription(answer);
          sendMessage({ type: 'video-answer', content: answer });
          break;

        case 'ice-candidate':
          console.info(body.content);
          await peerConnection.addIceCandidate(body.content);
          break;
      }
    } catch (err) {
      console.error('[PEER MESSAGE] ' + body.type + err);
    }
  });

  start();
};
