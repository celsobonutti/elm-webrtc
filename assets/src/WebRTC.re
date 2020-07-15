// Taken from https://github.com/jhrdina/bs-webapi-extra and fixed some parts
// Slightly improved version of https://github.com/bsansouci/ReWebRTC

module RTCIceCandidate = {
  type t;
  [@bs.new] external create: unit => t = "RTCIceCandidate";
};

module RTCPeerConnectionIceEvent = {
  type t;
  [@bs.get] external getCandidate: t => RTCIceCandidate.t = "candidate";
};

module RTCIceConnectionStateChangeEvent = {
  type t;
  [@bs.get] external getIceConnectionState: t => string = "iceConnectionState";
};

module RTCErrorEvent = {
  type t;
  [@bs.get] external getMessage: t => string = "message";
};

module RTCMessageEvent = {
  type t;
  type data =
    | String(string)
    | ArrayBuffer(Js.Typed_array.ArrayBuffer.t);

  [@bs.get] external getData: t => 'a = "data";
  let getData: t => option(data) =
    t => {
      let data = t |> getData;
      let isArrayBuffer: 'a => bool = [%raw
        "a => a instanceof ArrayBuffer"
      ];
      if (Js.typeof(data) == "string") {
        Some(String(data));
      } else if (data |> isArrayBuffer) {
        Some(ArrayBuffer(data));
      } else {
        None;
      };
    };

  [@bs.get] external getMessage: t => string = "message";
};

module RTCDataChannel = {
  type t;
  type optionsT;
  type binaryType =
    | Blob
    | ArrayBuffer
    | Unknown;

  exception UnknownBinaryType;

  let encodeBinaryType =
    fun
    | Blob => "blob"
    | ArrayBuffer => "arraybuffer"
    | Unknown => "";

  let decodeBinaryType =
    fun
    | "blob" => Blob
    | "arraybuffer" => ArrayBuffer
    | _ => Unknown;

  [@bs.set]
  external setOnError: (t, option(RTCErrorEvent.t => unit)) => unit =
    "onerror";
  [@bs.set] external setOnOpen: (t, option(unit => unit)) => unit = "onopen";
  [@bs.set]
  external setOnClose: (t, option(unit => unit)) => unit = "onclose";
  [@bs.set]
  external setOnMessage: (t, option(RTCMessageEvent.t => unit)) => unit =
    "onmessage";
  [@bs.send] external sendString: (t, string) => unit = "send";
  [@bs.send]
  external sendArrayBuffer: (t, Js.Typed_array.array_buffer) => unit = "send";
  [@bs.send] external close: t => unit = "close";
  [@bs.obj]
  external makeOptions:
    (~ordered: bool, ~maxPacketLifeTime: int=?, unit) => optionsT =
    "";

  [@bs.set] external setBinaryType: (t, string) => unit = "binaryType";
  let setBinaryType = (t, binaryType) =>
    setBinaryType(t, binaryType |> encodeBinaryType);

  [@bs.get] external getBinaryType: t => string = "binaryType";
  let getBinaryType = t => t |> getBinaryType |> decodeBinaryType;
};

module RTCDataChannelEvent = {
  type t;
  [@bs.get] external getChannel: t => RTCDataChannel.t = "channel";
};

module RTCOffer = {
  type t;
  type optionsT;
  [@bs.obj]
  external makeOptions:
    (~offerToReceiveAudio: bool, ~offerToReceiveVideo: bool) => optionsT =
    "";
};

module RTCSdpType = {
  type t =
    | Offer
    | Pranswer
    | Answer
    | Rollback
    | Unknown;

  let encode =
    fun
    | Offer => "offer"
    | Pranswer => "pranswer"
    | Answer => "answer"
    | Rollback => "rollback"
    | Unknown => "";

  let decode =
    fun
    | "offer" => Offer
    | "pranswer" => Pranswer
    | "answer" => Answer
    | "rollback" => Rollback
    | _ => Unknown;
};

module RTCIceConnectionState = {
  type t =
    | New
    | Checking
    | Connected
    | Completed
    | Disconnected
    | Failed
    | Closed
    | Unknown;

  let encode =
    fun
    | New => "new"
    | Checking => "checking"
    | Connected => "connected"
    | Completed => "completed"
    | Disconnected => "disconnected"
    | Failed => "failed"
    | Closed => "closed"
    | Unknown => "";

  let decode =
    fun
    | "new" => New
    | "checking" => Checking
    | "connected" => Connected
    | "completed" => Completed
    | "disconnected" => Disconnected
    | "failed" => Failed
    | "closed" => Closed
    | _ => Unknown;
};

module RTCSessionDescription = {
  type t;
  [@bs.get] external getType: t => string = "type";
  let getType = t => RTCSdpType.decode(getType(t));
  [@bs.get] external sdp: t => string = "sdp";
};

module RTCIceServer = {
  type t;
  [@bs.obj]
  external make:
    (~urls: string, ~username: string=?, ~credential: string=?, unit) => t =
    "";
};

module RTCConfiguration = {
  type t;
  [@bs.obj]
  external make: (~iceServers: array(RTCIceServer.t)=?, unit) => t = "";
};

module RTCPeerConnection = {
  type t;
  [@bs.new] external create: unit => t = "RTCPeerConnection";
  [@bs.new]
  external createWithConfig: RTCConfiguration.t => t = "RTCPeerConnection";
  [@bs.set]
  external setOnIceCandidate:
    (t, option(RTCPeerConnectionIceEvent.t => unit)) => unit =
    "onicecandidate";
  [@bs.set]
  external setOnIceConnectionStateChange:
    (t, option(RTCIceConnectionStateChangeEvent.t => unit)) => unit =
    "oniceconnectionstatechange";
  [@bs.set]
  external setOnDataChannel:
    (t, option(RTCDataChannelEvent.t => unit)) => unit =
    "ondatachannel";
  [@bs.send]
  external addIceCandidate:
    (t, RTCIceCandidate.t) => Js_promise.t(unit) /*string*/ =
    "addIceCandidate";
  [@bs.send]
  external createDataChannel:
    (t, ~channelName: string, ~options: RTCDataChannel.optionsT) =>
    RTCDataChannel.t =
    "createDataChannel";
  [@bs.send]
  external createOffer:
    (t, ~options: RTCOffer.optionsT) => Js_promise.t(RTCSessionDescription.t) /*string*/ =
    "createOffer";
  [@bs.send]
  external createDefaultOffer: t => Js_promise.t(RTCOffer.t) /*string*/ =
    "createOffer";
  [@bs.send]
  external createAnswer: t => Js_promise.t(RTCSessionDescription.t) /*string*/ =
    "createAnswer";
  [@bs.send]
  external setLocalDescription:
    (t, RTCSessionDescription.t) => Js_promise.t(unit) /*string*/ =
    "setLocalDescription";
  [@bs.get] external localDescription: t => RTCSessionDescription.t = "localDescription";
  [@bs.send]
  external setRemoteDescription:
    (t, RTCSessionDescription.t) => Js_promise.t(unit) /*string*/ =
    "setRemoteDescription";
  [@bs.get] external remoteDescription: t => RTCSessionDescription.t = "remoteDescription";
  [@bs.get] external iceConnectionState: t => string = "iceConnectionState";
  let iceConnectionState = t =>
    iceConnectionState(t) |> RTCIceConnectionState.decode;
  [@bs.send] external close: t => unit = "close";
};