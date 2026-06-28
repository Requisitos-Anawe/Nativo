import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import Home from "../screens/Home";
import Icon from "react-native-vector-icons/Ionicons";
import Informations from "../screens/Informations";
import ModTranslationList from "../screens/ModTranslationList";
import AtividadesScreen from "../screens/Atividades/AtividadesScreen";
import AdminScreen from '../screens/Administracao/index';

import CustomTabBar from './CustomTabBar';

const Tab = createBottomTabNavigator();

export default function ModeradorTabs() {
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
          else if (route.name === 'Informations') iconName = 'information-circle-outline';
          else if (route.name === 'ListTraducao') iconName = 'text-outline';
          // COMENTADO PARA OCULTAR O ÍCONE DO ADMIN:
          // else if (route.name === 'Admin') iconName = 'shield-checkmark-outline';
          return <Icon name={iconName} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Tradutor" component={Home} />
      <Tab.Screen name="Atividades" component={AtividadesScreen} />
      <Tab.Screen name="ListTraducao" component={ModTranslationList} />
      <Tab.Screen name="Informations" component={Informations} />
      {/* COMENTADO PARA OCULTAR A TELA DO ADMIN: */}
      {/* <Tab.Screen name="Admin" component={AdminScreen} /> */}
    </Tab.Navigator>
  );
}