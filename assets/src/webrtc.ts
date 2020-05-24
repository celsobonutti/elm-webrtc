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

  let presences = {};

  const onJoin = async (id: string | undefined) => {
    if (id && id !== userId) {
      const { peerConnection } = await createPeerConnection({
        channel,
        localStreamMedia,
        onTrack: config.onTrack,
        peerId: userId,
        sendMessage,
      });

      peerMap.set(id, peerConnection);

      config.onRemoteJoin(id);
    }
  };

  const onLeave = async (id: string | undefined) => {
    const disconnectedPeer = peerMap.get(id);
    disconnectedPeer?.close();
    peerMap.delete(id);

    config.onRemoteLeave(id);
  };

  channel.on('presence_diff', (diff) => {
    presences = Presence.syncDiff(presences, diff, onJoin, onLeave);
  });

  channel.on('peer-message', async (payload) => {
    const body = JSON.parse(payload.body) as WebRTCMessage;

    if (body.type === 'video-offer') {
      const { peerConnection } = await createPeerConnection({
        channel,
        localStreamMedia,
        onTrack: config.onTrack,
        peerId: userId,
        sendMessage,
      });

      await peerConnection.setRemoteDescription(body.content);
      const answer = await peerConnection.createAnswer();
      await peerConnection.setLocalDescription(answer);
      sendMessage({ type: 'video-answer', content: answer, peerId: userId });

      peerMap.set(userId, peerConnection);
    }
  });
};

type PeerConnectionArgs = {
  channel: Channel;
  sendMessage: WebRTCMessageSender;
  peerId: string;
  onTrack: (streams: readonly MediaStream[]) => void;
  localStreamMedia: MediaStream;
};

const createPeerConnection = async ({
  channel,
  sendMessage,
  peerId,
  onTrack,
}: PeerConnectionArgs) => {
  const peerConnection = new RTCPeerConnection({
    iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
  });

  const stream = await navigator.mediaDevices.getUserMedia({
    audio: true,
    video: true,
  });

  stream.getTracks().forEach((track) => peerConnection.addTrack(track, stream));

  peerConnection.ontrack = ({ track, streams }) => {
    track.onunmute = () => {
      onTrack(streams);
    };
  };

  let makingOffer = false;

  peerConnection.onicecandidate = ({ candidate }) => {
    if (candidate) {
      sendMessage({ type: 'ice-candidate', content: candidate, peerId });
    }
  };

  peerConnection.onnegotiationneeded = async () => {
    try {
      makingOffer = true;
      const offer = await peerConnection.createOffer();
      await peerConnection.setLocalDescription(offer);
      sendMessage({ type: 'video-offer', content: offer, peerId });
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

        case 'ice-candidate':
          await peerConnection.addIceCandidate(body.content);
          break;
      }
    } catch (err) {
      console.error('[PEER MESSAGE] ' + body.type + err);
    }
  });

  return {
    peerConnection,
  };
};
