import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import Icon from 'react-native-vector-icons/Ionicons';

import Home from '../screens/Home';
import Informations from '../screens/Informations';
import AtividadesUsuarioScreen from '../screens/Atividades/AtividadesUsuarioScreen';

const Tab = createBottomTabNavigator();

export default function UserTabs() {
  return (
    <Tab.Navigator
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
    </Tab.Navigator>
  );
}