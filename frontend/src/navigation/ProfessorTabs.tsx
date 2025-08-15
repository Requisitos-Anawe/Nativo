import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import Home from "../screens/Home";
import { TouchableOpacity } from "react-native";
import Icon from "react-native-vector-icons/Ionicons";
import TranslationCreate from "../screens/TranslationCreate";
import Informations from "../screens/Informations";

const Tab = createBottomTabNavigator();

export default function ProfessorTabs() {
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
          if (route.name === 'Tradutor') iconName = 'text-outline';
          else if (route.name === 'Informations') iconName = 'information-circle-outline';
          else if (route.name === 'AddTraducao') iconName = 'add-circle-outline';
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
      <Tab.Screen name="AddTraducao" component={TranslationCreate} />
      <Tab.Screen name="Informations" component={Informations} />
    </Tab.Navigator>
  );
}