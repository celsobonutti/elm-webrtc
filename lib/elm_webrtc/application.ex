defmodule ElmWebrtc.Application do
  # See https://hexdocs.pm/elixir/Application.html
  # for more information on OTP Applications
  @moduledoc false

  use Application

  def start(_type, _args) do
    children = [
      # Start the Ecto repository
      # ElmWebrtc.Repo,
      # Start the Telemetry supervisor
      ElmWebrtcWeb.Telemetry,
      # Start the PubSub system
      {Phoenix.PubSub, name: ElmWebrtc.PubSub},
      # Start the Endpoint (http/https)
      ElmWebrtcWeb.Endpoint,
      # Start a worker by calling: ElmWebrtc.Worker.start_link(arg)
      # {ElmWebrtc.Worker, arg}
      ElmWebrtcWeb.Presence
    ]

    # See https://hexdocs.pm/elixir/Supervisor.html
    # for other strategies and supported options
    opts = [strategy: :one_for_one, name: ElmWebrtc.Supervisor]
    Supervisor.start_link(children, opts)
  end

  # Tell Phoenix to update the endpoint configuration
  # whenever the application is updated.
  def config_change(changed, _new, removed) do
    ElmWebrtcWeb.Endpoint.config_change(changed, removed)
    :ok
  end
end
