import { NavigationContainer } from "@react-navigation/native";
import { useAuth } from "../contexts/AuthContext";
import AppStack from "./AppStack";
import { Navigation as AuthNavigation } from "./AuthStack";

export function RootNavigator() {
  const { user } = useAuth();
  return user ? <NavigationContainer><AppStack perfil={user.perfil} /></NavigationContainer> : <AuthNavigation />;
}