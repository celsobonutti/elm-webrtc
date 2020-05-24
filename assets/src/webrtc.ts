import { createChannel, WebRTCMessageSender } from './socket';

type WebRTCConfig = {
  onRemoteJoin: Function;
  onRemoteLeave: Function;
  roomId: string;
};

const startLocalStream = async (stream: MediaStream) => {
  const localCamera = document.querySelector(
    '#local-camera'
  ) as HTMLVideoElement;
  localCamera.srcObject = stream;
};

export const createWebRtcConnection = async (config: WebRTCConfig) => {
  const { presence, sendMessage } = createChannel(config.roomId);

  const localStreamMedia = await navigator.mediaDevices.getUserMedia({
    audio: true,
    video: true,
  });

  startLocalStream(localStreamMedia);

  const peerMap = new Map();

  const onTrack = (stream: readonly MediaStream[]) => {
    console.log(stream);
  };

  presence.onJoin((id, current, newPres) => {
    if (!current) {
      config.onRemoteJoin(id);

      const peerConnection = createPeerConnection(sendMessage, onTrack);

      peerMap.set(id, peerConnection);

      peerConnection.setLocalStream(localStreamMedia);
    } else {
      console.log('user additional presence', newPres);
    }
  });

  presence.onLeave((id, current) => {
    if (!current) {
      const disconnectedPeer = peerMap.get(id);
      disconnectedPeer?.close();
      peerMap.delete(id);

      config.onRemoteLeave(id);
    } else {
      console.log('user left in one of the devices');
    }
  });
};

const createPeerConnection = (
  sendMessage: WebRTCMessageSender,
  onTrack: (streams: readonly MediaStream[]) => void
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
      sendMessage('ice-candidate', candidate);
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
        sendMessage('video-offer', peerConnection.localDescription);
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
    // Close the connection with the peer.
    close: () => {
      peerConnection.close();
    },
  };
};
