import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import Home from "../screens/Home";
import Icon from "react-native-vector-icons/Ionicons";
import Informations from "../screens/Informations";
import UsersList from "../screens/UsersList";
import AtividadesScreen from "../screens/Atividades/AtividadesScreen";

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
          else if (route.name === 'Informations') iconName = 'information-circle-outline';
          else if (route.name === 'ListUsers') iconName = 'people-outline';
          return <Icon name={iconName} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Tradutor" component={Home} />
      <Tab.Screen name="Atividades" component={AtividadesScreen} />
      <Tab.Screen name="ListUsers" component={UsersList} />
      <Tab.Screen name="Informations" component={Informations} />
    </Tab.Navigator>
  );
}