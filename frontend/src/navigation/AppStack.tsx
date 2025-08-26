import { createNativeStackNavigator } from "@react-navigation/native-stack";
import ProfessorTabs from "./ProfessorTabs";
import UserTabs from "./UserTabs";
import Perfil from "../screens/Perfil";
import { LogOut } from "../components/Logout";
import AdminTabs from "./AdminTabs";
import ModeradorTabs from "./ModeradorTabs";
import Configurations from "../screens/Configurations";
import Icon from "react-native-vector-icons/Ionicons";

const Stack = createNativeStackNavigator();

export default function AppStack({perfil}: {perfil: string}) {

  let TabsComponent;

  switch (perfil) {
    case 'professor':
      TabsComponent = ProfessorTabs;
      break;
    case 'admin':
      TabsComponent = AdminTabs;
      break;
    case 'moderador':
      TabsComponent = ModeradorTabs;
      break;
    default:
      TabsComponent = UserTabs;
  }

  return (
    <Stack.Navigator>
      <Stack.Screen
        name="Main"
        component={TabsComponent}
        options={({ navigation }) => ({
          headerTitle: '',
          headerRight: () => <LogOut />,
          headerLeft: () => (
            <Icon
              name="settings-outline"
              size={24}
              color="#FFF"
              style={{ marginLeft: 15 }}
              onPress={() => navigation.navigate('Configurations')}
            />
          ),
          headerStyle: { backgroundColor: '#003066' },
          headerTintColor: '#fff',
        })}
      />
      <Stack.Screen
        name="Configurations"
        component={Configurations}  
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
}