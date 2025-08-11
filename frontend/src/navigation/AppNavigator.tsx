import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import BottomTabs from './BottomTabs';
import Perfil from '../screens/Perfil';

export type RootStackParamList = {
  MainTabs: undefined;
  Perfil: undefined;
  Configuracoes: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function AppNavigator({ onMenuPress }: { onMenuPress: () => void }) {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="MainTabs">
        {(props) => <BottomTabs {...props} onMenuPress={onMenuPress} />}
      </Stack.Screen>
      <Stack.Screen name="Perfil" component={Perfil} />
    </Stack.Navigator>
  );
}
