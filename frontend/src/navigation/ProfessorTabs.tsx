import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Icon from 'react-native-vector-icons/Ionicons';

import Home from '../screens/Home';

import CustomTabBar from './CustomTabBar';
import TranslationCreate from '../screens/TranslationCreate';
import TraslationList from '../screens/TranslationList';
import Informations from '../screens/Informations';
import AtividadesScreen from '../screens/Atividades/AtividadesScreen';

const Tab = createBottomTabNavigator();

export default function ProfessorTabs() {
  console.log('ProfessorTabs COM ATIVIDADES carregado');

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
          else if (route.name === 'AddTraducao') iconName = 'add-circle-outline';
          else if (route.name === 'ListTraducao') iconName = 'document-text-outline';
          return <Icon name={iconName} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Tradutor" component={Home} />
      <Tab.Screen name="AddTraducao" component={TranslationCreate} />
      <Tab.Screen name="Atividades" component={AtividadesScreen} />
      <Tab.Screen name="ListTraducao" component={TraslationList} />
    </Tab.Navigator>
  );
}