import { createNativeStackNavigator } from "@react-navigation/native-stack";
import Login from "../screens/Login";
import UserCreate from "../screens/UserCreate";

const Stack = createNativeStackNavigator();

export default function AuthStack() {
    
    return (
        <Stack.Navigator screenOptions={{ headerShown: false }} >
            <Stack.Screen name="Login" component={Login} />
            <Stack.Screen name="Cadastro" component={UserCreate} />
        </Stack.Navigator>
    );
}