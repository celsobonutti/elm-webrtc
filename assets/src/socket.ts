import { Socket, Presence } from 'phoenix';

//@ts-ignore -- Phoenix userToken
let socket = new Socket('/socket', { params: { token: window.userToken } });

socket.connect();

export type WebRTCMessageSender = (
  type: string,
  content: RTCIceCandidate | RTCOfferOptions
) => void;

export const createChannel = (room = 'video:peer2peer') => {
  const channel = socket.channel(room, {});
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
