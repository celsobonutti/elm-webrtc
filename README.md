# Elm WebRTC
## `Infigo could be so much simpler`

A simple Elixir + Elm + TypeScript webRTC project for multi-room video calls, used to be live at https://call.cel.so, but Gigalixir took it down.
There may be some problems if two peers are not able to connect through a STUN server, since the project was done with the intention of learning more about webRTC and TURN servers are quite expensive to host just for fun.

There are no environment variables since all of the credentials utilized are public.

## Starting in your computer

  * Setup the project with `mix setup`
  * Start Phoenix endpoint with `mix phx.server`

Now you can visit [`localhost:4000`](http://localhost:4000) from your browser.
