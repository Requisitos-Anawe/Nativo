<<<<<<< HEAD
import React, { useEffect } from 'react';
import { View, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { BottomTabBarProps, createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from "react-native-vector-icons/Ionicons";
=======
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import Icon from 'react-native-vector-icons/Ionicons';

import Home from '../screens/Home';
import Informations from '../screens/Informations';
import AtividadesUsuarioScreen from '../screens/Atividades/AtividadesUsuarioScreen';
>>>>>>> origin/develop

import HomeStack from "./HomeStack";
import PerfilStack from "./PerfilStack";

import CustomTabBar from './CustomTabBar';

const Tab = createBottomTabNavigator();

export default function UserTabs() {
  return (
    <Tab.Navigator
<<<<<<< HEAD
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarShowLabel: false,
        tabBarIcon: ({ color, size }) => {
          let iconName = 'home-outline';
          if (route.name === 'Tradutor') iconName = 'language-outline';
          else if (route.name === 'Perfil') iconName = 'person-outline';
          return <Icon name={iconName} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Tradutor" component={HomeStack} />
      <Tab.Screen name="Perfil" component={PerfilStack} />
=======
      screenOptions={({route}) => ({
        headerShown: false,
        tabBarActiveTintColor: '#fff',
        tabBarInactiveTintColor: 'gray',
        tabBarShowLabel: true,
        tabBarIcon: ({color, size}) => {
          let iconName = 'home-outline';

          if (route.name === 'Tradutor') {
            iconName = 'language-outline';
          } else if (route.name === 'Atividades') {
            iconName = 'school-outline';
          } else if (route.name === 'Informations') {
            iconName = 'information-circle-outline';
          }

          return <Icon name={iconName} size={size} color={color} />;
        },
        tabBarStyle: {
          backgroundColor: '#114A1B',
          height: 75,
          paddingBottom: 8,
          paddingTop: 6,
        },
        tabBarLabelStyle: {
          fontSize: 11,
        },
        tabBarItemStyle: {
          justifyContent: 'center',
          alignItems: 'center',
          paddingVertical: 8,
        },
      })}>
      <Tab.Screen name="Tradutor" component={Home} options={{title: 'Tradutor'}} />
      <Tab.Screen
        name="Atividades"
        component={AtividadesUsuarioScreen}
        options={{title: 'Atividades'}}
      />
      <Tab.Screen
        name="Informations"
        component={Informations}
        options={{title: 'Info'}}
      />
>>>>>>> origin/develop
    </Tab.Navigator>
  );
}
