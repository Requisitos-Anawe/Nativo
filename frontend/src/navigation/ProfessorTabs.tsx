import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import Icon from 'react-native-vector-icons/Ionicons';

import Home from '../screens/Home';
import AtividadesScreen from '../screens/Atividades/AtividadesScreen';

const Tab = createBottomTabNavigator();

export default function ProfessorTabs() {
  console.log('ProfessorTabs COM ATIVIDADES carregado');

  return (
    <Tab.Navigator
      screenOptions={({route}) => ({
        headerShown: false,
        tabBarActiveTintColor: '#fff',
        tabBarInactiveTintColor: 'gray',
        tabBarShowLabel: true,
        tabBarStyle: {
          backgroundColor: '#114A1B',
          height: 75,
          paddingBottom: 8,
          paddingTop: 6,
        },
        tabBarLabelStyle: {
          fontSize: 12,
        },
        tabBarIcon: ({color, size}) => {
          const iconName =
            route.name === 'Atividades' ? 'school-outline' : 'home-outline';

          return <Icon name={iconName} size={size} color={color} />;
        },
      })}>
      <Tab.Screen
        name="Tradutor"
        component={Home}
        options={{title: 'Tradutor'}}
      />

      <Tab.Screen
        name="Atividades"
        component={AtividadesScreen}
        options={{
          title: 'Atividades',
          tabBarBadge: '!',
        }}
      />
    </Tab.Navigator>
  );
}