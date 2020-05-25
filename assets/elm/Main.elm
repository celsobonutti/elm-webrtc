port module Main exposing (main)

import Browser
import Html exposing (..)
import Html.Attributes as HA
import Html.Events exposing (onInput, onSubmit)
import Json.Encode as Encode
import Set exposing (Set)


main : Program () Model Msg
main =
    Browser.element
        { init = init
        , view = view
        , update = update
        , subscriptions = subscriptions
        }


port enterRoom : String -> Cmd msg
port remotePeerJoined : (String -> msg) -> Sub msg
port remotePeerLeft : (String -> msg) -> Sub msg


type alias Model =
    { textInput : String
    , currentRoom : Maybe String
    , peers : Set String
    }


init : () -> ( Model, Cmd Msg )
init _ =
    ( { textInput = "", currentRoom = Nothing, peers = Set.empty }
    , Cmd.none
    )


type Msg
    = TextChange String
    | Connect
    | PeerJoined String
    | PeerLeft String


update : Msg -> Model -> ( Model, Cmd Msg )
update msg model =
    case msg of
        TextChange newValue ->
            ( { model | textInput = newValue }
            , Cmd.none
            )

        Connect ->
            ( { model | currentRoom = Just model.textInput }
            , enterRoom model.textInput
            )


        PeerJoined peerId ->
            ( { model | peers = Set.insert peerId model.peers}
            , Cmd.none
            )

        
        PeerLeft peerId ->
            ( { model | peers = Set.remove peerId model.peers }
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
        [ HA.class "room" ]
        [ Html.form [ HA.class "search__form", onSubmit Connect ]
            [ label
                [ HA.class "search__label", HA.for "room" ]
                [ text
                    (case model.currentRoom of
                        Nothing ->
                            "Select a room"

                        Just roomId ->
                            "Your room is: " ++ roomId
                    )
                ]
            , input
                [ HA.value model.textInput
                , onInput TextChange
                , HA.class "search__input"
                , HA.name "room"
                ]
                []
            , formButton model
            ]
        , div [ HA.class "videos"] (userVideo "local-camera" True "" :: peerVideos model.peers)
        ]


formButton : Model -> Html Msg
formButton model =
    case model.currentRoom of
        Nothing ->
            button
                [ HA.class "search__button"
                , HA.disabled (String.length model.textInput == 0)
                ]
                [ text "Enter" ]

        Just currentRoom ->
            button
                [ HA.class "search__button search__button--success"
                , HA.disabled
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
        [ HA.id userId
        , HA.autoplay True
        , HA.property "muted" (Encode.bool muted)
        , HA.attribute "data-UUID" uuid
        , HA.height 240
        , HA.width 420
        ]
        [ source
            [ HA.src ""
            , HA.type_ "video/mp4"
            , HA.id userId
            ]
            []
        ]

generateRemoteUserId : Int -> String
generateRemoteUserId index =
    "remote-peer" ++ String.fromInt index


peerVideos : Set String -> List (Html Msg)
peerVideos peers =
    let peerList = Set.toList peers in
    List.indexedMap(\index -> \peer -> userVideo (generateRemoteUserId index) False peer) peerList
