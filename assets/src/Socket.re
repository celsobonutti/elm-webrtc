open Phx;
open WebRTC;

type webRTCMessage = {
  messageType: [
    | `iceCandidateMessage(RTCIceCandidate.t) 
    | `rtcOfferMessage(RTCSessionDescription.t) 
    | `rtcAnswerMessage(RTCSessionDescription.t)
  ],
  senderId: string,
  targetId: string
}

let createChannel = (~room: string, ~userId: string) => {
  let params = [%obj {
    params: {
      user_id: userId
    }
  }];

  let socket = initSocket("/socket", ~opts=params)
    -> connectSocket;

  let channel = socket
    |> initChannel({j|videoroom:$room|j}, _)
    |> joinChannel(_);
}