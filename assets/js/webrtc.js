import { createChannel } from './socket';

const iceServers = [{ urls: "stun:stun.l.google.com:19302" }];

export const createWebRtcConnection = (config) => {
  const { channel, presence, sendMessage } = createChannel();

  const peerConnections = new Map();

  presence.onJoin((id, current, newPres) => {
    if(!current){
      
    } else {
      console.log("user additional presence", newPres)
    }
  })
};
