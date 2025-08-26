import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import Home from "../screens/Home";
import Icon from "react-native-vector-icons/Ionicons";
import Informations from "../screens/Informations";
import ModTranslationList from "../screens/ModTranslationList";

const Tab = createBottomTabNavigator();

export default function ModeradorTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: '#fff',
        tabBarInactiveTintColor: 'gray',
        tabBarShowLabel: false,
        tabBarLabel: () => null,
        tabBarIcon: ({ color, size }) => {
          let iconName = 'home-outline';
          if (route.name === 'Tradutor') iconName = 'language-outline';
          else if (route.name === 'Informations') iconName = 'information-circle-outline';
          else if (route.name === 'ListTraducao') iconName = 'text-outline';
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
      <Tab.Screen name="ListTraducao" component={ModTranslationList} />
      <Tab.Screen name="Informations" component={Informations} />
    </Tab.Navigator>
  );
}