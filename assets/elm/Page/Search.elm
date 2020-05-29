module Page.Search exposing (Model, Msg, init, update, view)

import Browser.Navigation as Nav
import Html exposing (..)
import Html.Attributes as Attrs
import Html.Events exposing (onInput, onSubmit)
import Route


type alias Model =
    { textInput : String
    , navKey : Nav.Key
    }


type Msg
    = ChangeText String
    | EnterRoom


init : Nav.Key -> ( Model, Cmd Msg )
init navKey =
    ( { textInput = "", navKey = navKey }, Cmd.none )


update : Msg -> Model -> ( Model, Cmd Msg )
update msg model =
    case msg of
        ChangeText newValue ->
            ( { model | textInput = newValue }
            , Cmd.none
            )

        EnterRoom ->
            ( { model | textInput = "" }
            , Route.pushUrl (Route.VideoRoom model.textInput) model.navKey
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
                    , onInput ChangeText
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
