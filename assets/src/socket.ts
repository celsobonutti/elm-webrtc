import { Socket, Presence } from 'phoenix';
import { v4 as uuid } from 'uuid';

//@ts-ignore -- Phoenix userToken
let socket = new Socket('/socket', { params: { user_id: uuid() } });

socket.connect();

export type WebRTCMessageSender = (
  type: string,
  content: RTCIceCandidate | RTCOfferOptions | RTCSessionDescription
) => void;

export const createChannel = (room: string = 'string') => {
  const channel = socket.channel(`videoroom:${room}`, {});
  channel
    .join()
    .receive('ok', (resp) => {
      console.log('Joined successfully', resp);
    })
    .receive('error', (resp) => {
      console.log('Unable to join', resp);
    });

  const sendMessage: WebRTCMessageSender = (type, content) => {
    channel.push('peer-message', {
      body: JSON.stringify({
        type,
        content,
      }),
    });
  };

  const presence = new Presence(channel);

  return {
    channel,
    presence,
    sendMessage,
  };
};
