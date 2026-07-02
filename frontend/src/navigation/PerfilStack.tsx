import React from 'react';
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import Perfil from "../screens/Perfil";
import EditProfileScreen from "../screens/EditProfile";
import Configurations from "../screens/Configurations";
import Insignias from "../screens/Insignias";
import FavoritosScreen from "../screens/Favoritos";
import HistoricoScreen from "../screens/Historico";

const Stack = createNativeStackNavigator();

export default function PerfilStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="PerfilMain" component={Perfil} />
      <Stack.Screen name="Configurations" component={Configurations} />
      <Stack.Screen name="Insignias" component={Insignias} />
      <Stack.Screen name="Historico" component={HistoricoScreen} />
      <Stack.Screen name="Favoritos" component={FavoritosScreen} />
      <Stack.Screen name="EditProfile" component={EditProfileScreen} options={{ headerShown: false }}/>
    </Stack.Navigator>
  );
}
