import React, { useEffect } from 'react';
import { View, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { BottomTabBarProps, createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from "react-native-vector-icons/Ionicons";

import HomeStack from "./HomeStack";
import PerfilStack from "./PerfilStack";
import AtividadesUsuarioScreen from "../screens/Atividades/AtividadesUsuarioScreen";

import CustomTabBar from './CustomTabBar';

const Tab = createBottomTabNavigator();

export default function UserTabs() {
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
          else if (route.name === 'Perfil') iconName = 'person-outline';
          return <Icon name={iconName} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Tradutor" component={HomeStack} />
      <Tab.Screen name="Atividades" component={AtividadesUsuarioScreen} />
      <Tab.Screen name="Perfil" component={PerfilStack} options={{ headerShown: false }}/>
    </Tab.Navigator>
  );
}