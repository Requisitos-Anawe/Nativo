import { useAuth } from "../contexts/AuthContext";
import AppStack from "./AppStack";
import AuthStack from "./AuthStack";

export function RootNavigator() {
  const { user } = useAuth();
  return user ? <AppStack perfil={user.perfil} /> : <AuthStack />;
}