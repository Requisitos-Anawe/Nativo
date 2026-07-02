import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import Home from "../screens/Home";
import Icon from "react-native-vector-icons/Ionicons";
import ModTranslationList from "../screens/ModTranslationList";
import PerfilStack from "./PerfilStack";
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
          else if (route.name === 'ListTraducao') iconName = 'text-outline';
          else if (route.name === 'Perfil') iconName = 'person-outline';
          return <Icon name={iconName} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Tradutor" component={Home} />
      <Tab.Screen name="ListTraducao" component={ModTranslationList} />
      <Tab.Screen name="Perfil" component={PerfilStack} options={{ headerShown: false }} />
    </Tab.Navigator>
  );
}
