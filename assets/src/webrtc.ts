import { createChannel, WebRTCMessageSender } from './socket';

type WebRTCConfig = {
  onRemoteJoin: Function;
  onRemoteLeave: Function;
};

export const startLocalStream = async () => {
  const localStreamMedia = await navigator.mediaDevices.getUserMedia({
    audio: true,
    video: true,
  });

  const localCamera = document.querySelector('#local-camera') as HTMLVideoElement;
  localCamera.srcObject = localStreamMedia;
};

export const createWebRtcConnection = async (config: WebRTCConfig) => {
  const { channel, presence, sendMessage } = createChannel();

  const peerConnections = new Map();

  const onTrack = (stream: readonly MediaStream[]) => {};

  presence.onJoin((id, current, newPres) => {
    if (!current) {
      config.onRemoteJoin(id);

      const peerConnection = createPeerConnection(sendMessage, onTrack);
    } else {
      console.log('user additional presence', newPres);
    }
  });

  presence.onLeave((id, current) => {
    if (!current) {
      config.onRemoteLeave(id);
    } else {
      console.log('user leaved in one of the devices');
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

  peerConnection.onicecandidate = ({ candidate }) => {
    if (candidate) {
      sendMessage('ice-candidate', candidate);
    }
  };

  peerConnection.ontrack = ({ streams }) => {
    onTrack(streams);
  };
};
