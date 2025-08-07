import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Home from '../screens/Home';
import Informations from '../screens/Informations';
import Icon from 'react-native-vector-icons/Ionicons';


const Tab = createBottomTabNavigator();

const BottomTabs = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarShowLabel: false, // oculta o texto
        tabBarStyle: {
          backgroundColor: '#114A1B',
          height: 60, 
          paddingBottom: 0,
          paddingTop: 0,
        },
        tabBarItemStyle: {
          justifyContent: 'center',
          alignItems: 'center',
          paddingVertical: 10
        },
        tabBarLabel: () => null,
        tabBarIcon: ({ color, size }) => {
          let iconName = 'home-outline';
          if (route.name === 'Home') iconName = 'text-outline';
          else if (route.name === 'Informations') iconName = 'information-circle-outline';
          return <Icon name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#fff',
        tabBarInactiveTintColor: 'gray',
      })}
    >
      <Tab.Screen name="Home" component={Home} />
      <Tab.Screen name="Informations" component={Informations} />
    </Tab.Navigator>
  );
};

export default BottomTabs;
