open ReasonPhoenix;

type socketParams = {user_id: string};

type message = [ | `iceCandidate | `videoOffer | `videoAnswer];

type webRtcMessage('a) = {
  [@bs.as "type"]
  type_: string,
  content: 'a,
  senderId: string,
  targetId: string,
};

type payload = {body: string};

let sendWebRtcMessage = (~channel, ~content: webRtcMessage('a)) => {
  Js.log(content);
  switch (Js.Json.stringifyAny(content)) {
  | Some(content) =>
    let _ =
      Channel.push(
        channel,
        ~event="peer-message",
        ~payload={body: content},
        (),
      );
    ();
  | None => Js.log("Ooooops, something went wrong :/")
  };
};

type t = {
  socket: ReasonPhoenix.Socket.t,
  channel: ReasonPhoenix.Channel.t,
};

[@genType]
let createChannel = (~room: string, ~userId: string) => {
  let socket =
    ReasonPhoenix.Socket.make(
      "/socket",
      Some(ReasonPhoenix.Socket.options(~params={user_id: userId}, ())),
    );

  let _ = ReasonPhoenix.Socket.connect(socket);

  let channel = socket |> Channel.make({j|videoroom:$room|j}, Js.Obj.empty());

  let _ = Channel.join(channel, ~timeout=1000, ());

  {socket, channel};
};
