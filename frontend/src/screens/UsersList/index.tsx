import { ActivityIndicator, Alert, Animated, Dimensions, Modal, ScrollView, Text, TextStyle, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import styles from "./styles";
import Icon from "react-native-vector-icons/Ionicons";
import { useEffect, useRef, useState } from "react";
import api from "../../services/api";
import { Picker } from "@react-native-picker/picker";
import Erro from "../../components/Erro";

// TODO: adicionar paginação 
export default function UsersList() {
    const [users, setUsers] = useState<UserInterface[]|null>(null);
    const [userEditando, setUserEditando] = useState<UserInterface|null>(null);
    const [carregando, setCarregando] = useState(true);
    const [visible, setVisible] = useState(false);
    const [erro, setErro] = useState('');
    const [perfilSelecionado, setPerfilSelecionado] = useState('');
    const [perfis, setPerfis] = useState<PerfilInterface[]|null>(null);

    const [limit] = useState(10);
    const [pageCursors, setPageCursors] = useState<Array<string | null>>([null]);
    const [currentPage, setCurrentPage] = useState(1);
    const [nextCursor, setNextCursor] = useState<string | null>(null);

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

    const fetchUsers = async (page = 1) => {
        try {
            setCarregando(true);
            setErro('');

            const cursor = pageCursors[page - 1];
            const params: Record<string, any> = { limit };
            if (cursor) {
                params.start_after = cursor;
            }

            const response = await api.get('/usuarios', { params });
            setUsers(response.data.data);
            setNextCursor(response.data.start_after || null);

            if (page === pageCursors.length && response.data.start_after) {
                setPageCursors((prev) => [...prev, response.data.start_after]);
            }
            setCurrentPage(page);
        } catch (error) {
            var err = error as any;
            setErro(err.response?.data?.erro || 'Não foi possível carregar os usuários.');
        } finally {
            setCarregando(false);
        }
    }

    const handleNextPage = () => {
        if (nextCursor) {
            fetchUsers(currentPage + 1);
        }
    }

    const handlePreviousPage = () => {
        if (currentPage > 1) {
            fetchUsers(currentPage - 1);
        }
    }

    const handleEdit = async (usuario_id: string) => {
        try {
            setCarregando(true);

            const UpdatePerfil = async () => {
                const response = await api.put(`usuarios/${usuario_id}/perfil`,{ perfil: perfilSelecionado});
                await fetchUsers(currentPage);
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
            toValue: screenHeight * 0.6,
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
        const initialize = async () => {
            try {
                setCarregando(true);
                await GetPerfis();
                await fetchUsers(1);
            } catch (error) {
                var err = error as any;
                setErro(err.response?.data?.erro || "Aconteceu um erro desconhecido, tente mais tarde.");
            } finally {
                setCarregando(false);
            }
        };

        initialize();
    }, []);

    return(
        <ScrollView>
            <SafeAreaView style={styles.container}>

                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 16, paddingHorizontal: 8 }}>
                    <TouchableOpacity
                        onPress={handlePreviousPage}
                        disabled={currentPage === 1 || carregando}
                        style={[styles.minorButton, (currentPage === 1 || carregando) && { opacity: 0.5 }]}
                    >
                        <Text style={{ color: '#fff' }}> <Icon name="arrow-back" size={24} /> </Text>
                    </TouchableOpacity>

                    <Text style={{ color: '#333', fontWeight: 'bold' }}>Página {currentPage}</Text>

                    <TouchableOpacity
                        onPress={handleNextPage}
                        disabled={carregando || !nextCursor || (users?.length ?? 0) < limit}
                        style={[styles.minorButton, (carregando || !nextCursor || (users?.length ?? 0) < limit) && { opacity: 0.5 }]}
                    >
                        <Text style={{ color: '#fff' }}> <Icon name="arrow-forward" size={24} /> </Text>
                    </TouchableOpacity>
                </View>

                {carregando ? (
                    <ActivityIndicator />
                ) : (
                    <>
                        {erro && <Erro texto={erro} />}

                        { !users || users.length === 0 ? (
                            <View style={styles.caixaAviso}>
                                <Text style={styles.textoAviso}>Nenhum usuário foi encontrado</Text>
                            </View>
                        ) : (
                            <>
                                {users.map((item) => (
                                    <View style={styles.input} key={item.id}>
                                        <View >
                                            <Text style={styles.name}>{item.nome}</Text>
                                            <Text style={perfilStyles[item.perfil as keyof typeof perfilStyles] || styles.default}>
                                                {item.perfil} 
                                            </Text>
                                        </View>
                                        <TouchableOpacity onPress={() => openModal(item)} >
                                            <Icon name="create-outline" size={24} />
                                        </TouchableOpacity>
                                    </View>
                                ))}
                            </>
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
                                            selectedValue={userEditando.perfil}
                                            onValueChange={(item) => {setPerfilSelecionado(item);}} 
                                        >
                                            {perfis?.map((item) => (
                                                <Picker.Item key={item.id} label={item.descricao} value={item.descricao} />
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