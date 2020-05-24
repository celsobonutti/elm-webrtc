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


subscriptions : Model -> Sub Msg
subscriptions model =
    Sub.none


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
        , userVideo "local-camera" True
        , userVideo "remote-camera" False
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


userVideo : String -> Bool -> Html Msg
userVideo userId muted =
    video
        [ HA.id userId
        , HA.autoplay True
        , HA.property "muted" (Encode.bool muted)
        ]
        [ source
            [ HA.src ""
            , HA.type_ "video/mp4"
            , HA.id userId
            ]
            []
        ]
