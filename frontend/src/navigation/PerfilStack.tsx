import React from 'react';
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import Perfil from "../screens/Perfil";
import Configurations from "../screens/Configurations";

const Stack = createNativeStackNavigator();

export default function PerfilStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="PerfilMain" component={Perfil} />
      <Stack.Screen name="Configurations" component={Configurations} />
    </Stack.Navigator>
  );
}
