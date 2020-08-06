open ReasonMediaDevices;

let peerConnection =
  WebRTC.PeerConnection.make({
    iceServers: Some({urls: [|"stun:stun.l.google.com:19302"|]}),
  });

let localMediaStream =
  MediaDevices.getUserMedia(Bool, Bool, {audio: true, video: true})
  |> Js.Promise.then_(mediaStream => {
       let _ =
         MediaStream.getTracks(mediaStream)
         ->Belt.Array.forEach(track => {
             WebRTC.PeerConnection.addTrack(
               peerConnection,
               track,
               mediaStream,
             )
           });

       Js.Promise.resolve();
     });
