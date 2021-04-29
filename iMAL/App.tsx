import "react-native-gesture-handler";
import * as Font from "expo-font";
import React from "react";
import AppLoading from "expo-app-loading";
import * as Linking from "expo-linking";
import { AppState, AppStateStatus } from "react-native";
import Authentication from "./src/APIManager/Authenticate";
import { Config } from "./src/Configuration/Config";
import { NavigationContainer } from "@react-navigation/native";
import Drawer from "./src/routes/MainDrawer";
import Auth from "./src/routes/AuthStack";
import { navigationRef, navigationRefReady } from "./src/routes/RootNavigator";

const prefix = Linking.makeUrl("/");

type StateType = {
    fonts: boolean;
    appstate: AppStateStatus;
    RootSwitch: "Auth" | "Drawer";
};

var application: Application | undefined;

export function SetRootSwitch(sw: "Auth" | "Drawer") {
    application?.setState((old) => {
        return { ...old, RootSwitch: sw };
    });
}

export default class Application extends React.Component<any, StateType> {
    constructor(props: any) {
        super(props);
        application = this;

        Config.GetInstance().then((config) => {
            console.log("Config loaded");
        });

        this.state = {
            fonts: false,
            appstate: AppState.currentState,
            RootSwitch: "Auth",
        };
    }

    componentDidMount() {
        this._checkInitialUrl();

        AppState.addEventListener("change", this._handleAppStateChange);
        Linking.addEventListener("url", (ss) => {
            this._handleUrl(ss.url);
        });
    }

    componentWillUnmount() {
        AppState.removeEventListener("change", this._handleAppStateChange);
    }

    private _handleAppStateChange = async (nextAppState: AppStateStatus) => {
        if (
            this.state.appstate.match(/inactive|background/) &&
            nextAppState === "active"
        ) {
            this._checkInitialUrl();
        }
        this.setState({ ...this.state, appstate: nextAppState });
    };

    private _checkInitialUrl = async () => {
        const url = await Linking.getInitialURL();
        if (url?.includes("auth")) {
            this._handleUrl(url);
        }
    };

    private _handleUrl = (url: string | null) => {
        if (url != null) {
            if (url.includes("auth")) {
                let uuid = url.split("auth/")[1];
                console.log(uuid);
                Authentication.getInstance()
                    .then((auth) => {
                        auth.setCode(uuid);
                        try {
                            SetRootSwitch("Drawer");
                        } catch (e) {
                            console.log(e);
                        }
                    })
                    .catch((e) => {});
            }
        }
    };

    render() {
        const setFontsLoaded = (yes: boolean) => {
            this.setState({ ...this.state, fonts: yes });
        };
        if (this.state.fonts == true) {
            return (
                <NavigationContainer
                    ref={navigationRef}
                    onReady={navigationRefReady}>
                    {this.state.RootSwitch == "Auth" ? <Auth /> : <Drawer />}
                </NavigationContainer>
            );
        } else {
            return (
                <AppLoading
                    startAsync={getFonts}
                    onFinish={() => {
                        setFontsLoaded(true);
                    }}
                    onError={console.warn}
                />
            );
        }
    }
}

const getFonts = async () => {
    await Font.loadAsync({
        AGRevueCyr: require("./assets/fonts/AGRevueCyr.ttf"),
    });
};
