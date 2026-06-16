import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import Home from "../screens/Home";
import Icon from "react-native-vector-icons/Ionicons";
import TranslationCreate from "../screens/TranslationCreate";
import Informations from "../screens/Informations";
import TraslationList from "../screens/TranslationList";

import CustomTabBar from './CustomTabBar';

const Tab = createBottomTabNavigator();

export default function ProfessorTabs() {
  return (
    <Tab.Navigator
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarShowLabel: false,
        tabBarIcon: ({ color, size }) => {
          let iconName = 'home-outline';
          if (route.name === 'Tradutor') iconName = 'language-outline';
          else if (route.name === 'Informations') iconName = 'information-circle-outline';
          else if (route.name === 'AddTraducao') iconName = 'add-circle-outline';
          else if (route.name === 'ListTraducao') iconName = 'document-text-outline';
          return <Icon name={iconName} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Tradutor" component={Home} />
      <Tab.Screen name="AddTraducao" component={TranslationCreate} />
      <Tab.Screen name="ListTraducao" component={TraslationList} />
      <Tab.Screen name="Informations" component={Informations} />
    </Tab.Navigator>
  );
}