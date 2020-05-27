import '../css/app.scss';
import 'normalize.css';

import 'phoenix_html';

import { createWebRtcConnection } from './webrtc.ts';
import { getMediaStream } from './media.ts';

let client;

import { Elm } from '../elm/Main.elm';

const app = Elm.Main.init({
  node: document.querySelector('main'),
});

app.ports.enterRoom.subscribe(async (message) => {
  const localMediaStream = await getMediaStream();

  const localCamera = document.querySelector('#local-camera');

  localCamera.srcObject = localMediaStream;

  createWebRtcConnection({
    localStreamMedia: localMediaStream,
    onRemoteJoin: (id) => {},
    onRemoteLeave: (id) => {
      app.ports.remotePeerLeft.send(id);
    },
    roomId: message,
    onTrack: (streams, id) => {
      app.ports.remotePeerJoined.send({ id: id, stream: streams[0] });
    },
  }).then(({ channel }) => {
    app.ports.leaveRoom.subscribe(() => {
      channel.leave();
    });

    app.ports.remotePeerReadyToStream.subscribe(({ id, stream }) => {
      requestAnimationFrame(() => {
        const remoteVideo = document.querySelector(`[data-uuid="${id}"]`);
        if (remoteVideo.srcObject) return;
        remoteVideo.srcObject = stream;
      });
    });
  });
});
