open ReasonMediaDevices;

module R = Belt.Result;

type streamPortMessage = {
  id: string,
  stream: MediaStream.t,
};

type textPortMessage = {
  sender: string,
  content: string,
};

type ports = {
  enterRoom: Elm.elmToReasonPort(string),
  toggleCam: Elm.elmToReasonPort(bool),
  toggleMic: Elm.elmToReasonPort(bool),
  remotePeerReadyToStream: Elm.elmToReasonPort(streamPortMessage),
  sendMessage: Elm.elmToReasonPort(string),
  leaveRoom: Elm.elmToReasonPort(unit),
  remotePeerLeft: Elm.reasonToElmPort(string),
  remotePeerJoined: Elm.reasonToElmPort(streamPortMessage),
  messageReceived: Elm.reasonToElmPort(textPortMessage),
};

[@bs.module]
external elmProgram: Elm.elmProgramWithPorts(ports) = "../elm/Main.elm";

let resultRuntime = Elm.mount(elmProgram);

switch (resultRuntime) {
| R.Ok(runtime) =>
  runtime.ports.enterRoom.subscribe(message => {
    let _ =
      MediaDevices.getUserMedia(Bool, Bool, {audio: true, video: true})
      |> Js.Promise.then_(localMediaStream => {
        
         });
    ();
  })

| R.Error(message) => Js.log(message)
};
