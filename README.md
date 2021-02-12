# Elm WebRTC

A simple Elixir + Elm + TypeScript webRTC project for multi-room video calls, which can be used live [here](https://elm-webrtc.gigalixirapp.com/).
There may be some problems if two peers are not able to connect through a STUN server, since the project was done with the intention of learning more about webRTC and TURN servers are quite expensive to host just for fun.

There are no environment variables since all of the credentials utilized are public.

## Starting in your computer

  * Setup the project with `mix setup`
  * Start Phoenix endpoint with `mix phx.server`

Now you can visit [`localhost:4000`](http://localhost:4000) from your browser.
