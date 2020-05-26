import { Socket, Presence } from 'phoenix';

type IceCandidateMessage = {
  type: 'ice-candidate';
  content: RTCIceCandidate;
};

type RTCOfferMessage = {
  type: 'video-offer';
  content: RTCSessionDescriptionInit;
};

type RTCAnswerMessage = {
  type: 'video-answer';
  content: RTCSessionDescriptionInit;
};

export type WebRTCMessage = (
  | IceCandidateMessage
  | RTCOfferMessage
  | RTCAnswerMessage
) & { senderId: string; targetId: string };

export type WebRTCMessageSender = (message: WebRTCMessage) => void;

export const createChannel = (room: string = 'string', userId: string) => {
  let socket = new Socket('/socket', { params: { user_id: userId } });

  socket.connect();

  const channel = socket.channel(`videoroom:${room}`, {});
  channel.join();

  const sendMessage: WebRTCMessageSender = ({
    type,
    content,
    senderId,
    targetId,
  }) => {
    channel.push('peer-message', {
      body: JSON.stringify({
        type,
        content,
        senderId,
        targetId
      }),
    });
  };

  return {
    channel,
    sendMessage,
  };
};
