import { createChannel, WebRTCMessageSender, WebRTCMessage } from './socket';
import { Channel, Presence } from 'phoenix';
import { v4 as uuid } from 'uuid';

type WebRTCConfig = {
  localStreamMedia: MediaStream;
  onRemoteJoin: Function;
  onRemoteLeave: Function;
  roomId: string;
  onTrack: (stream: readonly MediaStream[], peerId: string) => void;
};

export const createWebRtcConnection = async (config: WebRTCConfig) => {
  const userId = uuid();

  const { channel, sendMessage } = createChannel(config.roomId, userId);

  const peerMap = new Map<string, RTCPeerConnection>();

  let presences = {};

  let presence = new Presence(channel);

  const onJoin = async (id: string | undefined) => {
    if (id && id !== userId) {
      const { peerConnection } = await createPeerConnection({
        channel,
        onTrack: (stream) => config.onTrack(stream, id),
        localStreamMedia: config.localStreamMedia,
        senderId: userId,
        targetId: id,
        sendMessage,
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
        localStreamMedia: config.localStreamMedia,
        senderId: userId,
        targetId: body.senderId,
        sendMessage,
        starting: false,
      });

      await onVideoOffer(body.content);

      peerMap.set(userId, peerConnection);
    }
  });

  channel.onClose(() => {
    peerMap.forEach((connection) => {
      connection.close();
    });
  });

  return {
    channel,
  };
};

type PeerConnectionArgs = {
  channel: Channel;
  sendMessage: WebRTCMessageSender;
  localStreamMedia: MediaStream;
  senderId: string;
  targetId: string;
  onTrack: (streams: readonly MediaStream[]) => void;
  starting: boolean;
};

const createPeerConnection = async ({
  channel,
  sendMessage,
  localStreamMedia,
  senderId,
  targetId,
  onTrack,
  starting,
}: PeerConnectionArgs) => {
  const peerConnection = new RTCPeerConnection({
    iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
  });

  localStreamMedia
    .getTracks()
    .forEach((track) => peerConnection.addTrack(track, localStreamMedia));

  peerConnection.ontrack = ({ track, streams }) => {
    onTrack(streams);
  };

  if (starting) {
    try {
      const offer = await peerConnection.createOffer();
      await peerConnection.setLocalDescription(offer);
      sendMessage({ type: 'video-offer', content: offer, senderId, targetId });
    } catch (err) {
      console.error('[NEGOTIATION NEEDED] ' + err);
    }
  }

  peerConnection.onicecandidate = ({ candidate }) => {
    if (candidate) {
      sendMessage({
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
    sendMessage({ type: 'video-answer', content: answer, senderId, targetId });
  };

  return {
    peerConnection,
    onVideoOffer,
  };
};
