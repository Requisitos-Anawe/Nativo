import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation } from "@react-navigation/native";
import { Text, TouchableOpacity } from "react-native";
import { useAuth } from "../contexts/AuthContext";

export function LogOut()
{
    const { setUser } = useAuth();

    const handleLogout = async () => {
        try {
            await AsyncStorage.removeItem('token'); 
            await AsyncStorage.removeItem('user'); 
            setUser(null);
        } catch (error) {
            console.log('Erro ao fazer logout:', error);
        }
    };

    return (
      <TouchableOpacity onPress={handleLogout} style={{ marginRight: 15 }}>
        <Text style={{ color: '#fff', fontWeight: 'bold' }}>Sair</Text>
      </TouchableOpacity>
    );
}