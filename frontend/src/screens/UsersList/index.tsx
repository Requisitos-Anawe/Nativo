import { ActivityIndicator, Alert, Animated, Dimensions, Modal, ScrollView, Text, TextStyle, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import styles from "./styles";
import Icon from "react-native-vector-icons/Ionicons";
import { useEffect, useRef, useState } from "react";
import api from "../../services/api";
import { Picker } from "@react-native-picker/picker";

export default function UsersList() {
    const [users, setUsers] = useState<UserInterface[]|null>(null);
    const [userEditando, setUserEditando] = useState<UserInterface|null>(null);
    const [carregando, setCarregando] = useState(true);
    const [visible, setVisible] = useState(false);
    const [erro, setErro] = useState('');
    const [perfilSelecionado, setPerfilSelecionado] = useState<PerfilInterface|null>(null);
    const [perfis, setPerfis] = useState<PerfilInterface[]|null>(null);
    
    type Perfil = 'admin' | 'professor' | 'moderador';
    const perfilStyles: Record<Perfil, TextStyle> = {
        admin: styles.admin,
        professor: styles.professor,
        moderador: styles.moderador,
    };

    const GetPerfis = async () => {
        const response = await api.get('/perfis');
        setPerfis(response.data);
    }

    const GetUsers = async () => {
        const response = await api.get('/usuarios');
        setUsers(response.data);
    }

    const handleEdit = async (usuario_id: string) => {
        try {
            setCarregando(true);

            const UpdatePerfil = async () => {
                const response = await api.put(`usuario/${usuario_id}/perfil`,{ perfil_id: perfilSelecionado?.id});
                GetUsers(); 
                closeModal();
                Alert.alert(response.data.mensagem);
            }

            await UpdatePerfil();

        } catch (error) {
            var err = error as any;
            closeModal();
            Alert.alert('Não foi possível atualizar o perfil: ', err.response?.data?.erro || "Aconteceu um erro desconhecido, tente mais tarde.");
        } finally {
            setCarregando(false);
        }
    }

    const screenHeight = Dimensions.get('window').height;
    const slideAnim = useRef(new Animated.Value(screenHeight)).current;
    const openModal = (user: UserInterface) => {
        setUserEditando(user);
        setVisible(true);
            Animated.timing(slideAnim, {
            toValue: screenHeight * 0.6, // altura final (modal vai até 40% da tela)
            duration: 300,
            useNativeDriver: false,
        }).start();
    };

    const closeModal = () => {
        Animated.timing(slideAnim, {
            toValue: screenHeight,
            duration: 300,
            useNativeDriver: false,
        }).start(() => {
            setVisible(false);
        });
    };

    useEffect(() => {
        try{
            setCarregando(true);
            GetUsers();
            GetPerfis();

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
                        {erro && (
                            <View style={styles.erro} >
                                <Text style={styles.erro_text} >{erro}</Text>
                            </View>
                        )}

                        { !users || users.length === 0 ? (
                            <View style={styles.caixaAviso}>
                                <Text style={styles.textoAviso}>Nenhum usuário foi encontrado</Text>
                            </View>
                        ) : (
                            users.map((item) => (
                                <View style={styles.input} key={item.id}>
                                    <View >
                                        <Text style={styles.name}>{item.nome}</Text>
                                        <Text style={perfilStyles[item.perfil.descricao as keyof typeof perfilStyles] || styles.default}>
                                            {item.perfil.descricao} 
                                        </Text>
                                    </View>
                                    <TouchableOpacity onPress={() => openModal(item)} >
                                        <Icon name="create-outline" size={24} />
                                    </TouchableOpacity>
                                </View>
                            ))
                        )}
                        
                        {userEditando && visible && (
                            <Modal transparent animationType="none">
                                <TouchableOpacity style={styles.background} onPress={closeModal} activeOpacity={1} />
                                <Animated.View style={[styles.modal, { top: slideAnim }]}>

                                    <View style={{flexDirection: 'row', justifyContent: 'space-between'}}>
                                        <Text style={{ fontSize: 18, marginBottom: 20 }}>Editando: {userEditando?.nome}</Text>
                                        <TouchableOpacity onPress={closeModal}>
                                            <Icon name="close-circle-outline" size={24} />
                                        </TouchableOpacity>
                                    </View> 

                                    <Text>Nível</Text>
                                    <View style={styles.pickerInput} >
                                        <Picker 
                                            selectedValue={userEditando.perfil.id}
                                            onValueChange={(item) => {
                                                setPerfilSelecionado(perfis?.find((i) => i.id === item) || null);
                                            }} 
                                        >
                                            {perfis?.map((item) => (
                                                <Picker.Item key={item.id} label={item.descricao} value={item.id} />
                                            ))}
                                        </Picker>
                                    </View>

                                    <TouchableOpacity 
                                        onPress={() => handleEdit(userEditando.id)} 
                                        disabled={carregando}
                                        style={styles.button}
                                    >
                                        <Text style={{color:'#fff'}}>{carregando ? "Aguarde..." : "Atualizar"}</Text>
                                    </TouchableOpacity>
                                    
                                </Animated.View>
                            </Modal>
                        )}
                    </>
                )}
                
            </SafeAreaView>
        </ScrollView>
    )
}