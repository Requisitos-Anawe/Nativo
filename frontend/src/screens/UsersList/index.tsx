import { ActivityIndicator, ScrollView, Text, TextStyle, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import styles from "./styles";
import Icon from "react-native-vector-icons/Ionicons";
import { useEffect, useState } from "react";
import api from "../../services/api";

export default function UsersList() {
    const [users, setUsers] = useState<User[]|null>(null);
    const [carregando, setCarregando] = useState(true);
    const [erro, setErro] = useState('');
    
    type Perfil = 'admin' | 'professor' | 'moderador';
    const perfilStyles: Record<Perfil, TextStyle> = {
        admin: styles.admin,
        professor: styles.professor,
        moderador: styles.moderador,
    };

    useEffect(() => {
        try{
            setCarregando(true);
            setErro('');

            const GetUsers = async () => {
                const response = await api.get('/usuarios');
                setUsers(response.data);
            }

            GetUsers();

        }catch(error){
            var err = error as any;
            setErro(err.response?.data?.erro || "Aconteceu um erro desconhecido, tente mais tarde.");
        }finally{
            setCarregando(false);
        }

    }, []);

    return(
        <ScrollView>
            <SafeAreaView style={styles.container}>

                {carregando ? (
                    <ActivityIndicator />
                ) : (
                    <>
                        { !users || users.length === 0 ? (
                            <View style={styles.caixaAviso}>
                                <Text style={styles.textoAviso}>Nenhum usuário foi encontrado</Text>
                            </View>
                        ) : (
                            users.map((item) => (
                                <View style={styles.input} key={item.id}>
                                    <View >
                                        <Text style={styles.name}>{item.nome}</Text>
                                        <Text style={perfilStyles[item.perfil as keyof typeof perfilStyles] || styles.default}>
                                            {item.perfil} 
                                        </Text>
                                    </View>
                                    <TouchableOpacity>
                                        <Icon name="create-outline" size={24} />
                                    </TouchableOpacity>
                                </View>
                            ))
                        )}

                    </>
                )}

            </SafeAreaView>
        </ScrollView>
    )
}