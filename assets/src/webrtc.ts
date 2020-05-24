import { createChannel, WebRTCMessageSender } from './socket';

type WebRTCConfig = {
  onRemoteJoin: Function;
  onRemoteLeave: Function;
  roomId: string;
  onTrack: (track: RTCTrackEvent) => void;
};

const startLocalStream = async (stream: MediaStream) => {
  const localCamera = document.querySelector(
    '#local-camera'
  ) as HTMLVideoElement;
  localCamera.srcObject = stream;
};

export const createWebRtcConnection = async (config: WebRTCConfig) => {
  const localStreamMedia = await navigator.mediaDevices.getUserMedia({
    audio: true,
    video: true,
  });

  const peerConnection = new RTCPeerConnection();

  startLocalStream(localStreamMedia);

  const onRemoteOffer = async (offer: RTCSessionDescriptionInit) => {
    await peerConnection.setRemoteDescription(offer);
    const answer = await peerConnection.createAnswer();
    await peerConnection.setLocalDescription(answer);
    sendMessage({ type: 'video-answer', content: answer });
  };

  const onRemoteAnswer = async (answer: RTCSessionDescriptionInit) => {
    await peerConnection.setRemoteDescription(answer);
  };

  const onIceCandidate = async (content: RTCIceCandidate) => {
    await peerConnection.addIceCandidate(content);
  };

  const { presence, sendMessage } = createChannel(config.roomId, {
    onIceCandidate,
    onRemoteOffer,
    onRemoteAnswer,
  });

  peerConnection.onicecandidate = ({ candidate }) => {
    if (candidate) {
      sendMessage({ type: 'ice-candidate', content: candidate });
    }
  };

  peerConnection.ontrack = (track) => {
    config.onTrack(track);
  };

  const peerMap = new Map();

  presence.onJoin(async (id, current, newPres) => {
    localStreamMedia
      .getTracks()
      .forEach((track) => peerConnection.addTrack(track, localStreamMedia));

    const offer = await peerConnection.createOffer();
    await peerConnection.setLocalDescription(offer);

    sendMessage({ type: 'video-offer', content: offer });

    if (!current) {
      config.onRemoteJoin(id);
      const peerConnection = await createPeerConnection(
        sendMessage,
        () => {},
        localStreamMedia
      );
      peerMap.set(id, peerConnection);
      peerConnection.setLocalStream(localStreamMedia);
    } else {
      console.log('user additional presence', newPres);
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
  sendMessage: WebRTCMessageSender,
  onTrack: (streams: readonly MediaStream[]) => void,
  localStreamMedia: MediaStream
) => {
  const peerConnection = new RTCPeerConnection({
    iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
  });

  peerConnection.ontrack = ({ streams }) => {
    onTrack(streams);
  };

  // __THE PERFECT__ negotiation
  peerConnection.onicecandidate = ({ candidate }) => {
    if (candidate) {
      sendMessage({ type: 'ice-candidate', content: candidate });
    }
  };

  let makingOffer = false;
  let ignoreOffer = false;
  peerConnection.onnegotiationneeded = async () => {
    try {
      makingOffer = true;
      const offer = await peerConnection.createOffer();

      if (peerConnection.signalingState == 'stable') return;

      await peerConnection.setLocalDescription(offer);

      if (peerConnection.localDescription) {
        sendMessage({
          type: 'video-offer',
          content: peerConnection.localDescription,
        });
      }
    } catch (error) {
      console.error('[NEGOTIATION]: ' + error);
    } finally {
      makingOffer = false;
    }
  };

  return {
    setLocalStream: (localStream: MediaStream) => {
      for (const track of localStream.getTracks()) {
        peerConnection.addTrack(track, localStream);
      }
    },
    close: () => {
      peerConnection.close();
    },
  };
};
