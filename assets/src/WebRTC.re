open ReasonMediaDevices;

module PeerConnection = {
  type t;

  type iceServers = {urls: array(string)};

  type arguments = {iceServers: option(iceServers)};

  type rtcTrackEvent = {
    track: MediaStream.Track.t,
    streams: array(MediaStream.t),
  };

  [@bs.new] external make: arguments => t = "RTCPeerConnection";

  [@bs.set] external ontrack: (t, rtcTrackEvent => unit) => unit = "ontrack";
  [@bs.send]
  external addTrack: (t, MediaStream.Track.t, MediaStream.t) => unit =
    "addTrack";
};
