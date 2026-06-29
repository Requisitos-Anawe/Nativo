import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createStaticNavigation } from "@react-navigation/native";
import Login from "../screens/Login";
import UserCreate from "../screens/UserCreate";
import RecuperarSenha from "../screens/RecuperarSenha";

export type RootStackParamList = {
  Cadastro: undefined;
  Login: undefined;
  RecuperarSenha: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>({
    screens: {
        Login: {
            screen: Login,
            options: { headerShown: false },
        },
        Cadastro: {
            screen: UserCreate,
            options: { headerShown: false },
        },
        RecuperarSenha: {
            screen: RecuperarSenha,
            options: { headerShown: false },
        },
    },
});

export const Navigation = createStaticNavigation(Stack);