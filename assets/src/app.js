import '../css/app.scss';

import 'phoenix_html';

import { createWebRtcConnection } from './webrtc.ts';

let client;

import { Elm } from '../elm/Main.elm';

const app = Elm.Main.init({
  node: document.querySelector('main'),
});

app.ports.enterRoom.subscribe((message) => {
  let client = createWebRtcConnection({
    onRemoteJoin: (e) => console.info(e),
    onRemoteLeave: (e) => console.info(e),
    roomId: message
  });
});
