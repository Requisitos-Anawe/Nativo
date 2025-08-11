import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Home from '../screens/Home';
import Informations from '../screens/Informations';
import Icon from 'react-native-vector-icons/Ionicons';
import Perfil from '../screens/Perfil';
import { TouchableOpacity } from 'react-native';


const Tab = createBottomTabNavigator();

const BottomTabs = ({ onMenuPress }: { onMenuPress: () => void }) => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerStyle: { backgroundColor: '#003066' },
        headerTintColor: '#fff',
        tabBarActiveTintColor: '#fff',
        tabBarInactiveTintColor: 'gray',
        tabBarShowLabel: false,
        headerRight: () => (
          <TouchableOpacity onPress={onMenuPress} style={{ marginRight: 15 }}>
            <Icon name="menu-outline" size={28} color="#fff" />
          </TouchableOpacity>
        ),
        tabBarLabel: () => null,
        tabBarIcon: ({ color, size }) => {
          let iconName = 'home-outline';
          if (route.name === 'Tradutor') iconName = 'text-outline';
          else if (route.name === 'Informations') iconName = 'information-circle-outline';
          return <Icon name={iconName} size={size} color={color} />;
        },
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
      })}
    >
      <Tab.Screen name="Tradutor" component={Home} />
      <Tab.Screen name="Informations" component={Informations} />
    </Tab.Navigator>
  );
};

export default BottomTabs;
