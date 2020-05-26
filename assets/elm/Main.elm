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
    div
        [ Attrs.class "room" ]
        [ Html.form [ Attrs.class "search__form", onSubmit Connect ]
            [ label
                [ Attrs.class "search__label", Attrs.for "room" ]
                [ text
                    (case model.currentRoom of
                        Nothing ->
                            "Select a room"

                        Just roomId ->
                            "Your room is: " ++ roomId
                    )
                ]
            , input
                [ Attrs.value model.textInput
                , onInput TextChange
                , Attrs.class "search__input"
                , Attrs.name "room"
                ]
                []
            , formButton model
            ]
        , userVideo "local-camera" True ""
        , Html.Keyed.node "div" [ Attrs.class "videos" ] (peerVideos model.peers)
        ]


formButton : Model -> Html Msg
formButton model =
    case model.currentRoom of
        Nothing ->
            button
                [ Attrs.class "search__button"
                , Attrs.disabled (String.length model.textInput == 0)
                ]
                [ text "Enter" ]

        Just currentRoom ->
            button
                [ Attrs.class "search__button search__button--success"
                , Attrs.disabled
                    (currentRoom
                        == model.textInput
                        || String.length model.textInput
                        == 0
                    )
                ]
                [ text "Change" ]


userVideo : String -> Bool -> String -> Html Msg
userVideo userId muted uuid =
    video
        [ Attrs.id userId
        , Attrs.autoplay True
        , Attrs.property "muted" (Encode.bool muted)
        , Attrs.attribute "data-UUID" uuid
        , Attrs.height 240
        , Attrs.width 420
        ]
        [ source
            [ Attrs.src ""
            , Attrs.type_ "video/mp4"
            ]
            []
        ]


generateRemoteUserId : Int -> String
generateRemoteUserId index =
    "remote-peer" ++ String.fromInt index


peerVideos : OrderedSet String -> List ( String, Html Msg )
peerVideos peers =
    let
        peerList =
            OrderedSet.toList peers
    in
    List.indexedMap (\index -> \peer -> ( peer, userVideo (generateRemoteUserId index) False peer )) peerList
