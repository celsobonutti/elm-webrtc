port module Main exposing (main)

import Browser
import Html exposing (..)
import Html.Attributes as Attrs
import Html.Events exposing (onInput, onSubmit)
import Html.Keyed exposing (node)
import Json.Encode as Encode exposing (Value)
import OrderedSet exposing (OrderedSet)


main : Program () Model Msg
main =
    Browser.element
        { init = init
        , view = view
        , update = update
        , subscriptions = subscriptions
        }


port enterRoom : String -> Cmd msg


port leaveRoom : Bool -> Cmd msg


port remotePeerJoined : ({ id : String, stream : Value } -> msg) -> Sub msg


port remotePeerReadyToStream : { id : String, stream : Value } -> Cmd msg


port remotePeerLeft : (String -> msg) -> Sub msg


type alias Model =
    { textInput : String
    , currentRoom : Maybe String
    , peers : OrderedSet String
    }


init : () -> ( Model, Cmd Msg )
init _ =
    ( { textInput = "", currentRoom = Nothing, peers = OrderedSet.empty }
    , Cmd.none
    )


type Msg
    = TextChange String
    | Connect
    | PeerJoined { id : String, stream : Value }
    | PeerLeft String


update : Msg -> Model -> ( Model, Cmd Msg )
update msg model =
    case msg of
        TextChange newValue ->
            ( { model | textInput = newValue }
            , Cmd.none
            )

        Connect ->
            ( { model | currentRoom = Just model.textInput, peers = OrderedSet.empty }
            , case model.currentRoom of
                Nothing ->
                    enterRoom model.textInput

                Just _ ->
                    Cmd.batch
                        [ leaveRoom True
                        , enterRoom model.textInput
                        ]
            )

        PeerJoined { id, stream } ->
            ( { model | peers = OrderedSet.insert id model.peers }
            , remotePeerReadyToStream { id = id, stream = stream }
            )

        PeerLeft peerId ->
            ( { model | peers = OrderedSet.remove peerId model.peers }
            , Cmd.none
            )


subscriptions : Model -> Sub Msg
subscriptions _ =
    Sub.batch
        [ remotePeerJoined PeerJoined
        , remotePeerLeft PeerLeft
        ]


view : Model -> Html Msg
view model =
    case model.currentRoom of
        Nothing ->
            roomForm model

        Just _ ->
            videoRoom model


roomForm : Model -> Html Msg
roomForm model =
    div [ Attrs.class "search" ]
        [ Html.form [ onSubmit Connect ]
            [ label
                [ Attrs.class "search__label", Attrs.for "room" ]
                [ text "Enter the name of your room:" ]
            , div [ Attrs.class "search__form" ]
                [ input
                    [ Attrs.value model.textInput
                    , onInput TextChange
                    , Attrs.class "search__input"
                    , Attrs.name "room"
                    ]
                    []
                , formButton model
                ]
            ]
        ]


formButton : Model -> Html Msg
formButton model =
    button
        [ Attrs.class "search__button"
        , Attrs.disabled (String.length model.textInput == 0)
        ]
        [ text "Enter" ]


userVideo : String -> Bool -> String -> String -> Html Msg
userVideo userId muted uuid class =
    video
        [ Attrs.id userId
        , Attrs.autoplay True
        , Attrs.loop True
        , Attrs.attribute "playsinline" "playsinline"
        , Attrs.property "muted" (Encode.bool muted)
        , Attrs.attribute "data-UUID" uuid
        , Attrs.autoplay True
        , Attrs.class class
        ]
        [ source
            [ Attrs.src ""
            , Attrs.type_ "video/mp4"
            ]
            []
        ]


videoRoom : Model -> Html Msg
videoRoom model =
    div
        [ Attrs.class "room"
        ]
        [ if OrderedSet.isEmpty model.peers then
            div [ Attrs.class "empty" ] [ p [ Attrs.class "empty__message" ] [ text "There are no users in this room right now." ] ]

          else
            Html.Keyed.node "div" [ Attrs.class "peers" ] (peerVideos model.peers)
        , div [ Attrs.class "user" ]
            [ userVideo "local-camera"
                True
                ""
                "user__video"
            , div [ Attrs.class "chat" ]
                []
            ]
        ]


generateRemoteUserId : Int -> String
generateRemoteUserId index =
    "remote-peer" ++ String.fromInt index


peerClass : Int -> String
peerClass numberOfPeers =
    if numberOfPeers == 1 then
        "peers__video--xl"

    else if numberOfPeers == 2 then
        "peers__video--lg"

    else if numberOfPeers <= 4 then
        "peers__video--md"

    else if numberOfPeers <= 9 then
        "peers__video--sm"

    else
        "peers__video--xs"


peerVideos : OrderedSet String -> List ( String, Html Msg )
peerVideos peers =
    let
        class =
            OrderedSet.size peers |> peerClass
    in
    peers
        |> OrderedSet.toList
        |> List.indexedMap (\index -> \peer -> ( peer, userVideo (generateRemoteUserId index) False peer ("peers__video " ++ class) ))
