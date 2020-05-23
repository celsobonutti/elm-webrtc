# This file is responsible for configuring your application
# and its dependencies with the aid of the Mix.Config module.
#
# This configuration file is loaded before any dependency and
# is restricted to this project.

# General application configuration
use Mix.Config

config :elm_webrtc,
  ecto_repos: [ElmWebrtc.Repo]

# Configures the endpoint
config :elm_webrtc, ElmWebrtcWeb.Endpoint,
  url: [host: "localhost"],
  secret_key_base: "/AlFJk5IrYJw7HgBxdXCjn0PZK1KyS2CyAcqxNrQ5yUP+sAomqwhVE8WfD8U+1Ho",
  render_errors: [view: ElmWebrtcWeb.ErrorView, accepts: ~w(html json), layout: false],
  pubsub_server: ElmWebrtc.PubSub,
  live_view: [signing_salt: "AHfnDnjo"]

# Configures Elixir's Logger
config :logger, :console,
  format: "$time $metadata[$level] $message\n",
  metadata: [:request_id]

# Use Jason for JSON parsing in Phoenix
config :phoenix, :json_library, Jason

# Import environment specific config. This must remain at the bottom
# of this file so it overrides the configuration defined above.
import_config "#{Mix.env()}.exs"
