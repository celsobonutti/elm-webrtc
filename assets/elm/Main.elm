module Main exposing (main)

import Browser exposing (Document, UrlRequest)
import Browser.Navigation as Nav
import Html exposing (..)
import Page.Search as SearchPage
import Page.Video as VideoPage
import Route exposing (Route)
import Url exposing (Url)


main : Program () Model Msg
main =
    Browser.application
        { init = init
        , view = view
        , update = update
        , subscriptions = subscriptions
        , onUrlRequest = LinkClicked
        , onUrlChange = UrlChanged
        }


type alias Model =
    { route : Route
    , page : Page
    , navKey : Nav.Key
    }


type Page
    = NotFoundPage
    | SearchPage SearchPage.Model
    | VideoPage VideoPage.Model


type Msg
    = SearchPageMsg SearchPage.Msg
    | VideoPageMsg VideoPage.Msg
    | LinkClicked UrlRequest
    | UrlChanged Url


init : () -> Url -> Nav.Key -> ( Model, Cmd Msg )
init _ url navKey =
    let
        model =
            { route = Route.parseUrl url
            , page = NotFoundPage
            , navKey = navKey
            }
    in
    initCurrentPage ( model, Cmd.none )


initCurrentPage : ( Model, Cmd Msg ) -> ( Model, Cmd Msg )
initCurrentPage ( model, existingCmds ) =
    let
        ( currentPage, mappedPageCmds ) =
            case model.route of
                Route.NotFound ->
                    ( NotFoundPage, Cmd.none )

                Route.Search ->
                    let
                        ( pageModel, pageCmds ) =
                            SearchPage.init model.navKey
                    in
                    ( SearchPage pageModel, Cmd.map SearchPageMsg pageCmds )

                Route.VideoRoom roomId ->
                    let
                        ( pageModel, pageCmds ) =
                            VideoPage.init roomId model.navKey
                    in
                    ( VideoPage pageModel, Cmd.map VideoPageMsg pageCmds )
    in
    ( { model | page = currentPage }
    , Cmd.batch [ existingCmds, mappedPageCmds ]
    )


update : Msg -> Model -> ( Model, Cmd Msg )
update msg model =
    case ( msg, model.page ) of
        ( SearchPageMsg subMsg, SearchPage pageModel ) ->
            let
                ( updatedPageModel, updatedCmd ) =
                    SearchPage.update subMsg pageModel
            in
            ( { model | page = SearchPage updatedPageModel }
            , Cmd.map SearchPageMsg updatedCmd
            )

        ( VideoPageMsg subMsg, VideoPage pageModel ) ->
            let 
                ( updatedPageModel, updatedCmd ) =
                    VideoPage.update subMsg pageModel
            in
            ( {model | page = VideoPage updatedPageModel }
            , Cmd.map VideoPageMsg updatedCmd
            )

        ( LinkClicked urlRequest, _ ) ->
            case urlRequest of
                Browser.Internal url ->
                    ( model
                    , Nav.pushUrl model.navKey (Url.toString url)
                    )

                Browser.External url ->
                    ( model
                    , Nav.load url
                    )

        ( UrlChanged url, _ ) ->
            let
                newRoute =
                    Route.parseUrl url
            in
            ( { model | route = newRoute }, Cmd.none )
                |> initCurrentPage

        ( _, _ ) ->
            ( model, Cmd.none )


subscriptions : Model -> Sub Msg
subscriptions model =
    case model.page of
        VideoPage _ ->
            Sub.map VideoPageMsg VideoPage.subscriptions

        _ ->
            Sub.none


view : Model -> Document Msg
view model =
    { title = "ICBSMS"
    , body = [ currentView model ]
    }


currentView : Model -> Html Msg
currentView model =
    case model.page of
        NotFoundPage ->
            div [] [ text "Not found" ]

        SearchPage searchModel ->
            SearchPage.view searchModel
                |> Html.map SearchPageMsg

        VideoPage videoModel ->
            VideoPage.view videoModel
                |> Html.map VideoPageMsg
