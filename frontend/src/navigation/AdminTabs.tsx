import React from 'react';
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import Icon from "react-native-vector-icons/Ionicons";
import HomeStack from "./HomeStack";
import AtividadesUsuarioScreen from "../screens/Atividades/AtividadesUsuarioScreen";
import PerfilStack from "./PerfilStack";
import AdminScreen from '../screens/Administracao/index';
import CustomTabBar from './CustomTabBar';

const Tab = createBottomTabNavigator();

export default function AdminTabs() {
  return (
    <Tab.Navigator
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarShowLabel: false,
        tabBarIcon: ({ color, size }) => {
          let iconName = 'home-outline';

          if (route.name === 'Tradutor') iconName = 'language-outline';
          else if (route.name === 'Atividades') iconName = 'school-outline';
          else if (route.name === 'Admin') iconName = 'shield-checkmark-outline';
          else if (route.name === 'Perfil') iconName = 'person-outline';
          return <Icon name={iconName} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Tradutor" component={HomeStack} />
      <Tab.Screen name="Atividades" component={AtividadesUsuarioScreen} />
      <Tab.Screen name="Admin" component={AdminScreen} />
      <Tab.Screen name="Perfil" component={PerfilStack} />
    </Tab.Navigator>
  );
}