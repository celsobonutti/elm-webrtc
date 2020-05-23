// We need to import the CSS so that webpack will load it.
// The MiniCssExtractPlugin is used to separate it out into
// its own CSS file.
import "../css/app.scss";

// webpack automatically bundles all modules in your
// entry points. Those entry points can be configured
// in "webpack.config.js".
//
// Import deps with the dep name or local files with a relative path, for example:
//
//     import {Socket} from "phoenix"
//     import socket from "./socket"
//
import "phoenix_html";
import { startLocalCamera } from "./webrtc";

import { Elm } from "../elm/Main.elm";
import { Socket } from "phoenix";

let socket = new Socket("/socket", { params: { token: window.userToken } });

const app = Elm.Main.init({
  node: document.querySelector("main"),
});

app.ports.localStream.subscribe(function (message) {
  if (message === "start") {
    const localStream = new MediaStream();
    startLocalCamera();
  } else {
  }
});

// socket.addEventListener("message", function (event) {
//   app.ports.messageReceiver.send(event.data);
// });
