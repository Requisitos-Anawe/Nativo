import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useAuth } from "../contexts/AuthContext";
import AppStack from "./AppStack";
import { Navigation as AuthNavigation } from "./AuthStack";
import Informations from "../screens/Informations";
import Configurations from "../screens/Configurations";

const Stack = createNativeStackNavigator();

function MainNavigator({ perfil }: { perfil: string }) {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="AppStack">
        {props => <AppStack {...props} perfil={perfil} />}
      </Stack.Screen>
      <Stack.Screen name="Informations" component={Informations} />
      <Stack.Screen name="Configurations" component={Configurations} />
    </Stack.Navigator>
  );
}

export function RootNavigator() {
  const { user } = useAuth();
  return user ? <NavigationContainer><MainNavigator perfil={user.perfil} /></NavigationContainer> : <AuthNavigation />;
}