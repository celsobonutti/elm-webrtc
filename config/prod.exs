use Mix.Config

config :elm_webrtc, ElmWebrtcWeb.Endpoint,
  http: [port: {:system, "PORT"}],
  url: [host: "call.cel.so", port: 80],
  force_ssl: [rewrite_on: [:x_forwarded_proto]],
  secret_key_base: Map.fetch!(System.get_env(), "SECRET_KEY_BASE"),
  server: true

config :elm_webrtc, ElmWebrtcWeb.Repo,
  adapter: Ecto.Adapters.Postgres,
  url: System.get_env("DATABASE_URL"),
  ssl: true,
  pool_size: 2

# Do not print debug messages in production
config :logger, level: :info

import_config "prod.secret.exs"
