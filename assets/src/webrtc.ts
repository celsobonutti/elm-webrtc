import {
  createChannel,
  WebRTCMessageSender,
  WebRTCMessage,
  TextMessage,
} from './socket';
import { Channel, Presence } from 'phoenix';
import { v4 as uuid } from 'uuid';

type WebRTCConfig = {
  localMediaStream: MediaStream;
  onRemoteJoin: Function;
  onRemoteLeave: Function;
  onMessageReceived: Function;
  roomId: string;
  onTrack: (stream: readonly MediaStream[], peerId: string) => void;
};

export const createConnection = async (config: WebRTCConfig) => {
  const userId = uuid();

  const { channel, sendWebRtcMessage, sendTextMessage } = createChannel(
    config.roomId,
    userId
  );

  const peerMap = new Map<string, RTCPeerConnection>();

  let presences = {};

  let presence = new Presence(channel);

  const onJoin = async (id: string | undefined) => {
    if (id && id !== userId) {
      const { peerConnection } = await createPeerConnection({
        channel,
        onTrack: (stream) => config.onTrack(stream, id),
        localMediaStream: config.localMediaStream,
        senderId: userId,
        targetId: id,
        sendWebRtcMessage,
        starting: true,
      });

      peerMap.set(id, peerConnection);

      config.onRemoteJoin(id);
    }
  };

  presence.onLeave(async (id: string | undefined) => {
    if (!id) return;
    const disconnectedPeer = peerMap.get(id);
    disconnectedPeer?.close();
    peerMap.delete(id);

    config.onRemoteLeave(id);
  });

  channel.on('presence_diff', (diff) => {
    presences = Presence.syncDiff(presences, diff, onJoin);
  });

  channel.on('peer-message', async (payload) => {
    const body = JSON.parse(payload.body) as WebRTCMessage;

    if (body.targetId !== userId) return;

    if (body.type === 'video-offer') {
      const { peerConnection, onVideoOffer } = await createPeerConnection({
        channel,
        onTrack: (stream) => config.onTrack(stream, body.senderId),
        localMediaStream: config.localMediaStream,
        senderId: userId,
        targetId: body.senderId,
        sendWebRtcMessage,
        starting: false,
      });

      await onVideoOffer(body.content);

      peerMap.set(userId, peerConnection);
    }
  });

  channel.on('text-message', async (payload) => {
    const message = {
      sender: payload.sender,
      content: JSON.parse(payload.body).content,
    };
    config.onMessageReceived(message);
  });

  channel.onClose(() => {
    peerMap.forEach((connection) => {
      connection.close();
    });
  });

  return {
    channel,
    sendTextMessage,
  };
};

type PeerConnectionArgs = {
  channel: Channel;
  sendWebRtcMessage: WebRTCMessageSender;
  localMediaStream: MediaStream;
  senderId: string;
  targetId: string;
  onTrack: (streams: readonly MediaStream[]) => void;
  starting: boolean;
};

const createPeerConnection = async ({
  channel,
  sendWebRtcMessage,
  localMediaStream,
  senderId,
  targetId,
  onTrack,
  starting,
}: PeerConnectionArgs) => {
  const peerConnection = new RTCPeerConnection({
    iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
  });

  localMediaStream
    .getTracks()
    .forEach((track) => peerConnection.addTrack(track, localMediaStream));

  peerConnection.ontrack = ({ streams }) => {
    onTrack(streams);
  };

  if (starting) {
    try {
      const offer = await peerConnection.createOffer();
      await peerConnection.setLocalDescription(offer);
      sendWebRtcMessage({
        type: 'video-offer',
        content: offer,
        senderId,
        targetId,
      });
    } catch (err) {
      console.error('[NEGOTIATION NEEDED] ' + err);
    }
  }

  peerConnection.onicecandidate = ({ candidate }) => {
    if (candidate) {
      sendWebRtcMessage({
        type: 'ice-candidate',
        content: candidate,
        senderId,
        targetId,
      });
    }
  };

  channel.on('peer-message', async (payload) => {
    const body = JSON.parse(payload.body) as WebRTCMessage;

    if (body.targetId !== senderId || body.senderId !== targetId) return;

    try {
      switch (body.type) {
        case 'video-answer':
          if (peerConnection.signalingState === 'stable') return;
          await peerConnection.setRemoteDescription(body.content);
          break;

        case 'ice-candidate':
          await peerConnection.addIceCandidate(body.content);
          break;
      }
    } catch (err) {
      console.error(`[PEER MESSAGE] ${body.type} ${JSON.stringify(err)}`);
    }
  });

  const onVideoOffer = async (offer: RTCSessionDescriptionInit) => {
    await peerConnection.setRemoteDescription(offer);
    const answer = await peerConnection.createAnswer();
    await peerConnection.setLocalDescription(answer);
    sendWebRtcMessage({
      type: 'video-answer',
      content: answer,
      senderId,
      targetId,
    });
  };

  return {
    peerConnection,
    onVideoOffer,
  };
};
