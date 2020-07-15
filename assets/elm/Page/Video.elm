port module Page.Video exposing (Model, Msg, init, subscriptions, update, view)

import Browser.Navigation as Nav
import Html exposing (..)
import Html.Attributes as Attrs
import Html.Events exposing (onClick, onInput, onSubmit)
import Html.Keyed exposing (node)
import Html.Lazy exposing (lazy)
import Json.Encode as Encode exposing (Value)
import OrderedSet exposing (OrderedSet)
import Svg exposing (svg, use)
import Svg.Attributes as SvgAttrs
import Route


port enterRoom : String -> Cmd msg


port leaveRoom : Bool -> Cmd msg


port remotePeerReadyToStream : { id : String, stream : Value } -> Cmd msg


port remotePeerJoined : ({ id : String, stream : Value } -> msg) -> Sub msg


port remotePeerLeft : (String -> msg) -> Sub msg


port sendMessage : String -> Cmd msg


port messageReceived : (Message -> msg) -> Sub msg


port toggleMic : Bool -> Cmd msg


port toggleCam : Bool -> Cmd msg


type alias Message =
    { sender : Maybe String
    , content : String
    }


type alias Model =
    { peers : OrderedSet String
    , messages : List Message
    , textInput : String
    , mic : Bool
    , cam : Bool
    , navKey : Nav.Key
    }


init : String -> Nav.Key -> ( Model, Cmd Msg )
init room navKey =
    ( { peers = OrderedSet.empty
      , messages = []
      , textInput = ""
      , mic = True
      , cam = True
      , navKey = navKey
      }
    , enterRoom room
    )


type Msg
    = Disconnect
    | PeerJoined { id : String, stream : Value }
    | PeerLeft String
    | ChangeText String
    | SendMessage
    | MessageReceived Message
    | ToggleMic
    | ToggleCam


update : Msg -> Model -> ( Model, Cmd Msg )
update msg model =
    case msg of
        Disconnect ->
            ( { model
                | peers = OrderedSet.empty
              }
            , Cmd.batch [ leaveRoom True, Route.pushUrl Route.Search model.navKey ]
            )

        PeerJoined { id, stream } ->
            ( { model
                | peers = OrderedSet.insert id model.peers
              }
            , remotePeerReadyToStream { id = id, stream = stream }
            )

        PeerLeft peerId ->
            ( { model
                | peers = OrderedSet.remove peerId model.peers
              }
            , Cmd.none
            )

        ChangeText newValue ->
            ( { model | textInput = newValue }
            , Cmd.none
            )

        SendMessage ->
            ( { model
                | messages =
                    { sender = Nothing
                    , content = model.textInput
                    }
                        :: model.messages
                , textInput = ""
              }
            , sendMessage model.textInput
            )

        MessageReceived message ->
            ( { model
                | messages = message :: model.messages
              }
            , Cmd.none
            )

        ToggleMic ->
            let
                micState =
                    not model.mic
            in
            ( { model | mic = micState }
            , toggleMic micState
            )

        ToggleCam ->
            let
                camState =
                    not model.cam
            in
            ( { model | cam = camState }
            , toggleCam camState
            )


subscriptions : Sub Msg
subscriptions =
    Sub.batch
        [ remotePeerJoined PeerJoined
        , remotePeerLeft PeerLeft
        , messageReceived MessageReceived
        ]


view : Model -> Html Msg
view model =
    div
        [ Attrs.class "room"
        ]
        [ viewPeers model
        , div [ Attrs.class "user" ]
            [ lazy viewUser model
            , lazy viewMessages model.messages
            , lazy viewChatInput model
            ]
        , button
            [ Attrs.class "room__disconnect"
            , onClick Disconnect
            ]
            [ text "Disconnect" ]
        ]


viewPeers : Model -> Html Msg
viewPeers model =
    if OrderedSet.isEmpty model.peers then
        div [ Attrs.class "empty" ]
            [ p
                [ Attrs.class "empty__message" ]
                [ text "There are no users in this room right now." ]
            ]

    else
        Html.Keyed.node "div" [ Attrs.class "peers" ] (peerVideos model.peers)


viewUser : Model -> Html Msg
viewUser model =
    div [ Attrs.class "user__container" ]
        [ userVideo "local-camera"
            True
            ""
            "user__video"
            []
        , svg [ onClick ToggleCam, SvgAttrs.class "feather" ] [ use [ SvgAttrs.xlinkHref "/css/feather-sprite.svg#circle" ] [] ]
        , svg [ onClick ToggleMic, SvgAttrs.class "user__button user__button--right" ] [ text "Mic" ]
        ]


viewMessages : List Message -> Html Msg
viewMessages messages =
    div [ Attrs.class "chat" ] (List.map viewMessage messages)


viewMessage : Message -> Html Msg
viewMessage message =
    case message.sender of
        Nothing ->
            div [ Attrs.class "message message--user" ]
                [ p [ Attrs.class "message__sender message__sender--user" ] [ text "You" ]
                , p [ Attrs.class "message__text" ] [ text message.content ]
                ]

        Just senderId ->
            div [ Attrs.class "message" ]
                [ p [ Attrs.class "message__sender" ] [ text senderId ]
                , p [ Attrs.class "message__text" ] [ text message.content ]
                ]


viewChatInput : Model -> Html Msg
viewChatInput model =
    form [ Attrs.class "chat__form", onSubmit SendMessage ]
        [ input
            [ Attrs.value model.textInput
            , onInput ChangeText
            , Attrs.class "chat__input"
            ]
            []
        , button
            [ Attrs.class "chat__button"
            , Attrs.disabled (String.length model.textInput == 0)
            ]
            [ text "Send" ]
        ]


userVideo : String -> Bool -> String -> String -> List (Attribute Msg) -> Html Msg
userVideo userId muted uuid class styles =
    video
        ([ Attrs.id userId
         , Attrs.autoplay True
         , Attrs.loop True
         , Attrs.attribute "playsinline" "playsinline"
         , Attrs.property "muted" (Encode.bool muted)
         , Attrs.attribute "data-UUID" uuid
         , Attrs.autoplay True
         , Attrs.class class
         , Attrs.style "inline-size" "1/2%"
         , Attrs.style "block-size" "1/2%"
         ]
            ++ styles
        )
        [ source
            [ Attrs.src ""
            , Attrs.type_ "video/mp4"
            ]
            []
        ]


peerVideos : OrderedSet String -> List ( String, Html Msg )
peerVideos peers =
    let
        styles =
            OrderedSet.size peers |> videoDimensions
    in
    peers
        |> OrderedSet.toList
        |> List.indexedMap
            (\index ->
                \peer ->
                    ( peer
                    , userVideo
                        (generateRemoteUserId index)
                        False
                        peer
                        "peers__video"
                        styles
                    )
            )


closestPower : Int -> Int -> Int
closestPower number index =
    if number <= index ^ 2 then
        index

    else
        closestPower number (index + 1)


videoDimensions : Int -> List (Attribute Msg)
videoDimensions numberOfPeers =
    let
        mainAxisCount =
            closestPower numberOfPeers 1

        crossAxisCount =
            (toFloat numberOfPeers / toFloat mainAxisCount) |> ceiling

        mainAxisPortion =
            100 / toFloat mainAxisCount

        crossAxisPortion =
            100 / toFloat crossAxisCount
    in
    [ Attrs.style "inline-size" (String.fromFloat mainAxisPortion ++ "%")
    , Attrs.style "block-size" (String.fromFloat crossAxisPortion ++ "%")
    ]


generateRemoteUserId : Int -> String
generateRemoteUserId index =
    "remote-peer-" ++ String.fromInt index
