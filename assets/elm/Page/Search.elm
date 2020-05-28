module Page.Search exposing (Model, Msg, init, update, view)

import Html exposing (..)
import Html.Attributes as Attrs
import Html.Events exposing (onClick, onInput, onSubmit)


type alias Model =
    { textInput : String
    }


type Msg
    = TextChange String
    | EnterRoom


init : ( Model, Cmd Msg )
init =
    ( { textInput = "" }, Cmd.none )


update : Msg -> Model -> ( Model, Cmd Msg )
update msg model =
    case msg of
        TextChange newValue ->
            ( { model | textInput = newValue }
            , Cmd.none
            )

        EnterRoom ->
            ( { model | textInput = "" }
            , Cmd.none
            )


view : Model -> Html Msg
view model =
    div [ Attrs.class "search" ]
        [ Html.form [ onSubmit EnterRoom ]
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
                , button
                    [ Attrs.class "search__button"
                    , Attrs.disabled (String.length model.textInput == 0)
                    ]
                    [ text "Enter" ]
                ]
            ]
        ]
