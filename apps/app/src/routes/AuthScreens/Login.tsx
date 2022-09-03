import { StackNavigationProp, StackScreenProps } from "@react-navigation/stack";
import React from "react";
import { Dimensions, StyleSheet, Text, TextInput, View } from "react-native";
import { TouchableOpacity } from "react-native-gesture-handler";
import { SafeAreaView } from "react-native-safe-area-context";
import Kurabu from "../../../assets/pinklogin.svg";
import Auth from "#api/Authenticate";
import { Colors } from "#config/Colors";
import { AuthStackParamList } from "../AuthStack";
import { RootSwitchContext } from "../../contexts/rootSwitch";
import { AuthBackground } from "#comps/AuthBackgrounds";

type Props = StackScreenProps<AuthStackParamList, "Login">;

type LoginState = {
	navigator: StackNavigationProp<AuthStackParamList, "Login">;
	email: string;
	pass: string;
};

class Login extends React.Component<Props, LoginState> {
	static contextType = RootSwitchContext

	constructor(props: Props) {
		super(props);
		this.state = {
			navigator: props.navigation,
			email: "",
			pass: "",
		};
	}

	private changeEmail(newstr: string) {
		this.setState((prevState) => ({
			...prevState,
			email: newstr,
		}));
	}

	private changePass(newstr: string) {
		this.setState((prevState) => ({
			...prevState,
			pass: newstr,
		}));
	}

	private async DoLogin(rootSwitch: (a: "Auth" | "Drawer") => void) {
		const auth = await Auth.getInstance()
		const loginRes = await auth.Trylogin(this.state.email, this.state.pass)
		if (loginRes === true) {
			rootSwitch("Drawer");
		}
	}

	private DoSignup() {
		this.state.navigator.navigate("Register");
	}

	render() {
		const rootSwitchContext = this.context as (a: "Auth" | "Drawer") => void;

		return (
			<View style={styles.appContainer}>
				<AuthBackground inverted={false} />
				<SafeAreaView style={styles.safeContainer} />
				<View style={styles.content}>
					<View
						style={styles.extraSpacing}
					></View>
                    <TextInput
						onChangeText={this.changeEmail.bind(this)}
						autoComplete="email"
                        placeholder="Email"
                        style={styles.Input}
                        value={this.state.email}
                    />
                    <TextInput
                        onChangeText={this.changePass.bind(this)}
                        placeholder="Password"
                        autoComplete="password"
                        secureTextEntry
                        style={styles.Input}
                        value={this.state.pass}
                    />
					<TouchableOpacity
						style={styles.LoginButton}
						activeOpacity={0.6}
						onPress={() => {
							void this.DoLogin(rootSwitchContext);
						}}
					>
						<Text style={styles.LoginButtonText}>Login</Text>
					</TouchableOpacity>
					<Text
						style={styles.noAccountText}
					>
						No Account?
					</Text>
					<TouchableOpacity
						style={styles.SignupButton}
						activeOpacity={0.6}
						onPress={this.DoSignup.bind(this)}
					>
						<Text style={styles.SignupButtonText}>Sign up</Text>
					</TouchableOpacity>
				</View>
			</View>
		);
	}
}

const fontSize = Dimensions.get("window").width / 36;
const sizer = Dimensions.get("window").width / 400;

const styles = StyleSheet.create({
	extraSpacing: {
		width: 10,
		height: `${30 * sizer}%`,
	},
	noAccountText: {
		color: Colors.TEXT,
	},
	appContainer: {
		// backgroundColor: Colors.BLUE
	},
	safeContainer: {
		// backgroundColor: Colors.BLUE
	},
	content: {
		height: Dimensions.get("window").height,
		alignItems: "center",
		justifyContent: "center",
	},
	Input: {
		opacity: 1,
		width: sizer * 250,
		height: sizer * 50,
		borderBottomColor: "#868686",
		borderBottomWidth: 1,
		color: Colors.TEXT,
		fontSize: fontSize * 2,
	},
	LoginButton: {
		borderRadius: 4,
		backgroundColor: Colors.CYAN,
		paddingHorizontal: sizer * 97,
		paddingVertical: sizer * 10,
		marginTop: sizer * 90,
		marginBottom: sizer * 40,
		color: Colors.TEXT,
	},
	LoginButtonText: {
		color: Colors.TEXT,
		fontSize: fontSize * 1.5,
		fontWeight: "bold",
	},
	SignupButton: {
		borderRadius: 4,
		backgroundColor: Colors.CYAN,
		paddingHorizontal: sizer * 60,
		paddingVertical: sizer * 6,
		marginTop: sizer * 5,
		color: Colors.TEXT,
	},
	SignupButtonText: {
		color: Colors.TEXT,
		fontSize: fontSize * 1.5,
		fontWeight: "bold",
	},
});

export default Login;
