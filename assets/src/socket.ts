import { Socket, Presence } from 'phoenix';
import { v4 as uuid } from 'uuid';

let socket = new Socket('/socket', { params: { user_id: uuid() } });

socket.connect();

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

type WebRTCMessage = IceCandidateMessage | RTCOfferMessage | RTCAnswerMessage;

export type WebRTCMessageSender = (message: WebRTCMessage) => void;

type Callbacks = {
  onRemoteOffer: (offer: RTCSessionDescriptionInit) => void;
  onIceCandidate: (candidate: RTCIceCandidate) => void;
  onRemoteAnswer: (answer: RTCSessionDescriptionInit) => void;
};

export const createChannel = (
  room: string = 'string',
  { onRemoteOffer, onIceCandidate, onRemoteAnswer }: Callbacks
) => {
  const channel = socket.channel(`videoroom:${room}`, {});
  channel
    .join()
    .receive('ok', (resp) => {
      console.log('Joined successfully', resp);
    })
    .receive('error', (resp) => {
      console.log('Unable to join', resp);
    });

  const sendMessage: WebRTCMessageSender = ({ type, content }) => {
    channel.push('peer-message', {
      body: JSON.stringify({
        type,
        content,
      }),
    });
  };

  const presence = new Presence(channel);

  channel.on('peer-message', (payload) => {
    const body = JSON.parse(payload.body) as WebRTCMessage;

    switch (body.type) {
      case 'ice-candidate':
        onIceCandidate(body.content);
        break;
      case 'video-offer':
        onRemoteOffer(body.content);
        break;
      case 'video-answer':
        onRemoteAnswer(body.content);
        break;
    }
  });

  return {
    channel,
    presence,
    sendMessage,
  };
};
