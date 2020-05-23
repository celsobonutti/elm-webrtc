module Main exposing (..)

import Browser
import Html exposing (..)
import Html.Attributes exposing (..)
import Html.Events exposing (..)


main : Program () Model Msg
main =
    Browser.element
        { init = init
        , view = view
        , update = update
        , subscriptions = subscriptions
        }


type alias Model =
    { textInput : String
    }


init : () -> ( Model, Cmd Msg )
init _ =
    ( { textInput = "" }
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
            ( model, Cmd.none )


subscriptions : Model -> Sub Msg
subscriptions model =
    Sub.none


view : Model -> Html Msg
view model =
    div
        [ class "roomSelection" ]
        [ div [ class "roomSelection__form" ]
            [ input
                [ value model.textInput
                , onInput TextChange
                , class "roomSelection__input"
                ]
                []
            , button [ class "roomSelection__button" ] [ text "Enter" ]
            ]
        ]
