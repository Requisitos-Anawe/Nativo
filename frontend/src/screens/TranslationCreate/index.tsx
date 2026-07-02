import { ActivityIndicator, Alert, ScrollView, Text, TextInput, TouchableOpacity, View, Modal } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import Icon from 'react-native-vector-icons/Ionicons';
import styles from "./styles";
import { useCallback, useEffect, useState } from "react";
import api from "../../services/api";
import { RouteProp, useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import Erro from "../../components/Erro";
import type {BottomTabNavigationProp} from '@react-navigation/bottom-tabs';
import type {ProfessorTabParamList} from '../../navigation/NavigationTypes';
import { launchImageLibrary } from 'react-native-image-picker';
import { pick } from '@react-native-documents/picker';
import { VideoPlayer } from "../../components/VideoPlayer";
import { AudioPlayer } from "../../components/AudioPlayer";
import { FotoPlayer } from "../../components/FotoPlayer";

type RootStackParamList = {
    TraslationCreate: {
        traducao_id?: string;
    };
};

interface CustomDropdownProps {
    selectedValue: string;
    options: string[];
    onSelect: (value: string) => void;
    label: string;
}

function CustomDropdown({ selectedValue, options, onSelect, label }: CustomDropdownProps) {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <View style={{ marginBottom: 15 }}>
            <TouchableOpacity
                style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    backgroundColor: '#ffffff',
                    borderRadius: 12,
                    paddingHorizontal: 15,
                    paddingVertical: 14,
                    borderWidth: 1.5,
                    borderColor: '#e0e0e0',
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 1 },
                    shadowOpacity: 0.05,
                    shadowRadius: 3,
                    elevation: 1,
                }}
                activeOpacity={0.85}
                onPress={() => setIsOpen(true)}
            >
                <Text style={{ color: '#000000', fontSize: 15 }}>{selectedValue || "Selecione..."}</Text>
                <Icon name="chevron-down" size={18} color="#093624" />
            </TouchableOpacity>

            <Modal
                visible={isOpen}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setIsOpen(false)}
            >
                <TouchableOpacity 
                    style={{
                        flex: 1,
                        backgroundColor: 'rgba(0, 0, 0, 0.5)',
                        justifyContent: 'center',
                        alignItems: 'center',
                        padding: 20
                    }}
                    activeOpacity={1}
                    onPress={() => setIsOpen(false)}
                >
                    <View 
                        style={{
                            width: '100%',
                            backgroundColor: '#ffffff',
                            borderRadius: 16,
                            padding: 20,
                            maxHeight: '65%',
                            borderWidth: 2,
                            borderColor: '#093624',
                            shadowColor: '#000',
                            shadowOffset: { width: 0, height: 4 },
                            shadowOpacity: 0.2,
                            shadowRadius: 6,
                            elevation: 5,
                            overflow: 'hidden',
                        }}
                        onStartShouldSetResponder={() => true}
                    >
                        <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#093624', marginBottom: 15, textAlign: 'center' }}>
                            {label}
                        </Text>
                        <ScrollView showsVerticalScrollIndicator={true} persistentScrollbar={true}>
                            {options.map((option, idx) => (
                                <TouchableOpacity
                                    key={idx}
                                    style={{
                                        paddingVertical: 14,
                                        paddingHorizontal: 15,
                                        backgroundColor: option === selectedValue ? '#e8f0fe' : '#ffffff',
                                        borderBottomWidth: idx === options.length - 1 ? 0 : 1,
                                        borderBottomColor: '#f0f0f0',
                                        borderRadius: 8,
                                        marginBottom: 4,
                                    }}
                                    onPress={() => {
                                        onSelect(option);
                                        setIsOpen(false);
                                    }}
                                >
                                    <Text
                                        style={{
                                            color: option === selectedValue ? '#093624' : '#000000',
                                            fontWeight: option === selectedValue ? 'bold' : 'normal',
                                            fontSize: 16,
                                        }}
                                    >
                                        {option}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </View>
                </TouchableOpacity>
            </Modal>
        </View>
    );
}

export default function TraslationCreate() {
    const insets = useSafeAreaInsets();
    const route = useRoute<RouteProp<RootStackParamList, 'TraslationCreate'>>();
    const traducao_id = route.params?.traducao_id ?? null;
    const [traducao, setTraducao] = useState<any>(); // any temporário para suportar a nova estrutura da develop
    const [categorias, setCategorias] = useState<CategoriaInterface[]>([]);
    const [idiomas, setIdiomas] = useState<IdiomaInterface[]>([]);

    // Estados unificados usando as strings da develop
    const [categoriaSelecionada, setCategoriaSelecionada] = useState('');
    const [idiomaTraducao, setIdiomaTraducao] = useState('');
    const [idiomaDiscurso, setIdiomaDiscurso] = useState('');
    const [textoDiscurso, setTextoDiscurso] = useState('');
    const [textoTraducao, setTextoTraducao] = useState('');
    const [carregando, setCarregando] = useState(true);
    const [erro, setErro] = useState('');
    const navigation =
        useNavigation<BottomTabNavigationProp<ProfessorTabParamList, 'AddTraducao'>>();

    const [foto, setFoto] = useState<any | null>(null);
    const [audio, setAudio] = useState<any | null>(null);
    const [video, setVideo] = useState<any | null>(null);

    useFocusEffect(
        useCallback(() => {
            let isActive = true;

            const loadData = async () => {
                try {
                    setCarregando(true);
                    setErro('');

                    const [catRes, idiRes] = await Promise.all([
                        api.get(`/categorias`),
                        api.get(`/idiomas`),
                    ]);

                    if (!isActive) return;

                    setCategorias(catRes.data);
                    setCategoriaSelecionada(catRes.data[0].descricao);
                    setIdiomas(idiRes.data);

                    if (traducao_id) {
                        const traducaoRes = await api.get(`/traducao/${traducao_id}`);
                        if (!isActive) return;

                        setTraducao(traducaoRes.data);

                        // Dados carregados com a nova estrutura da develop
                        setCategoriaSelecionada(traducaoRes.data.discurso_categoria);
                        setIdiomaDiscurso(traducaoRes.data.idiomaDiscurso);
                        setTextoDiscurso(traducaoRes.data.discurso);
                        setIdiomaTraducao(traducaoRes.data.idioma);
                        setTextoTraducao(traducaoRes.data.texto);
                    } else {
                        // Limpa os estados usando strings
                        setTraducao(undefined);
                        setCategoriaSelecionada(catRes.data[0].descricao);
                        setIdiomaDiscurso(idiRes.data[0].descricao);
                        setTextoDiscurso('');
                        setIdiomaTraducao(idiRes.data[1].descricao);
                        setTextoTraducao('');
                        setFoto(null);
                        setAudio(null);
                        setVideo(null);
                    }
                } catch (error) {
                    const err = error as any;
                    setErro(err.response?.data?.erro || "Aconteceu um erro desconhecido, tente mais tarde.");
                } finally {
                    if (isActive) setCarregando(false);
                }
            };

            loadData();

            return () => {
                isActive = false;
                (navigation as any).setParams({ traducao_id: undefined });
            };
        }, [traducao_id])
    );

    const selecionarFoto = async () => {
        const result = await launchImageLibrary({ mediaType: 'photo', quality: 1 });
        if (result.assets && result.assets.length > 0) {
            setFoto(result.assets[0]);
        }
    };

    const selecionarVideo = async () => {
        const result = await launchImageLibrary({ mediaType: 'video', quality: 1 });
        if (result.assets && result.assets.length > 0) {
            setVideo(result.assets[0]);
        }
    };

    const selecionarAudio = async () => {
        try {
            const [res] = await pick({ type: ['audio/*'] });
            setAudio(res);
        } catch (err) {
            console.log(err);
        }
    };

    const handleEvent = async () => {
        try {
            setCarregando(true);
            setErro('');

            // MANTEMOS O FORMDATA PARA O UPLOAD DE ARQUIVOS FUNCIONAR
            const formData = new FormData();

            // Usamos as chaves que a equipe configurou na develop
            formData.append("categoria", categoriaSelecionada);
            formData.append("discurso", textoDiscurso.trim());
            formData.append("idioma_discurso", idiomaDiscurso.toLowerCase());
            formData.append("traducao", textoTraducao.trim());
            formData.append("idioma_traducao", idiomaTraducao.toLowerCase());

            // Tratamento das Mídias
            if (foto) {
                formData.append("foto", {
                    uri: foto.uri,
                    type: foto.type || 'image/jpeg',
                    name: foto.fileName || foto.name || "foto.jpg"
                } as any);
            }
            if (audio) {
                formData.append("audio", {
                    uri: audio.uri,
                    type: audio.type || 'audio/mpeg',
                    name: audio.name || "audio.mp3"
                } as any);
            }
            if (video) {
                formData.append("video", {
                    uri: video.uri,
                    type: video.type || 'video/mp4',
                    name: video.fileName || video.name || "video.mp4"
                } as any);
            }

            const config = {
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'multipart/form-data'
                },
                transformRequest: (data: FormData) => {
                    return data;
                },
            };

            if (!traducao) {
                const response = await api.post('/traducao/cadastrar', formData, config);
                if (response) Alert.alert('Sucesso', 'Tradução cadastrada com sucesso');
                setTextoDiscurso('');
                setTextoTraducao('');
                setFoto(null);
                setAudio(null);
                setVideo(null);
            } else {
                // Endpoint de edição alterado para o padrão da develop
                await api.put(`/traducao/${traducao_id}/com-discurso`, formData, config);
                Alert.alert('Sucesso', 'Tradução e discurso atualizados com sucesso');
            }

        } catch (error) {
            const err = error as any;
            console.log("ERRO DETALHADO DO AXIOS:", err.response?.data);
            const mensagemErro = err.response?.data?.erro || `Não foi possível ${traducao ? "atualizar" : "adicionar"} a tradução.`;
            setErro(mensagemErro);
            Alert.alert('Erro', 'Não foi possível realizar o cadastro.');
        } finally {
            setCarregando(false);
        }
    };

    if (carregando) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f4f5f4' }}>
                <ActivityIndicator size="large" color="#093624" />
            </View>
        );
    } else {
        return (
            <View style={styles.container}>
                {/* Header Fixo no Topo */}
                <View style={[styles.header, { paddingTop: insets.top + 20 }]}>
                    {navigation.canGoBack() && traducao && (
                        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                            <Icon name="arrow-back" size={24} color="#fff" />
                        </TouchableOpacity>
                    )}
                    <Text style={styles.headerTitle}>{traducao ? 'Editar Tradução' : 'Nova Tradução'}</Text>
                </View>

                <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                    {erro ? <Erro texto={erro} /> : null}

                    <Text style={styles.label}>Categoria do discurso</Text>
                    <CustomDropdown
                        selectedValue={categorias.filter(cat => cat.descricao.toLowerCase() === categoriaSelecionada.toLowerCase())[0]?.descricao || categoriaSelecionada}
                        options={categorias.map((item) => item.descricao)}
                        onSelect={(item) => setCategoriaSelecionada(item)}
                        label="Categoria do Discurso"
                    />

                    <Text style={styles.label}>Idioma do Discurso</Text>
                    <CustomDropdown
                        selectedValue={idiomas.filter(idi => idi.descricao === idiomaDiscurso)[0]?.descricao || idiomaDiscurso}
                        options={idiomas.map((item) => item.descricao)}
                        onSelect={(itemValue) => setIdiomaDiscurso(itemValue)}
                        label="Idioma do Discurso"
                    />

                    <Text style={styles.label}>Texto do Discurso</Text>
                    <TextInput
                        value={textoDiscurso}
                        placeholder="Digite o discurso original..."
                        placeholderTextColor="#999"
                        multiline
                        style={[styles.inputField, { height: 100, textAlignVertical: 'top' }]}
                        onChangeText={setTextoDiscurso}
                    />

                    <Text style={styles.label}>Idioma da Tradução</Text>
                    <CustomDropdown
                        selectedValue={idiomas.filter(idi => idi.descricao === idiomaTraducao)[0]?.descricao || idiomaTraducao}
                        options={idiomas.map((item) => item.descricao)}
                        onSelect={(itemValue) => setIdiomaTraducao(itemValue)}
                        label="Idioma da Tradução"
                    />

                    <Text style={styles.label}>Texto da Tradução</Text>
                    <TextInput
                        value={textoTraducao}
                        placeholder="Digite a tradução correspondente..."
                        placeholderTextColor="#999"
                        multiline
                        style={[styles.inputField, { height: 100, textAlignVertical: 'top' }]}
                        onChangeText={setTextoTraducao}
                    />

                    <Text style={styles.sectionTitle}>Arquivos de Mídia (Opcional)</Text>

                    {/* Selecionar Foto */}
                    <TouchableOpacity style={styles.mediaButton} onPress={selecionarFoto}>
                        <Icon name="image-outline" size={22} color="#093624" style={{ marginRight: 2 }} />
                        <Text style={styles.mediaButtonText}>{foto ? `Alterar Foto` : "Selecionar Imagem"}</Text>
                    </TouchableOpacity>
                    {foto && (
                        <View style={styles.mediaPlayerContainer}>
                            <FotoPlayer uri={foto.uri} onExcluir={() => setFoto(null)} />
                        </View>
                    )}

                    {/* Selecionar Audio */}
                    <TouchableOpacity style={styles.mediaButton} onPress={selecionarAudio}>
                        <Icon name="mic-outline" size={22} color="#093624" style={{ marginRight: 2 }} />
                        <Text style={styles.mediaButtonText}>{audio ? `Alterar Áudio` : "Selecionar Áudio"}</Text>
                    </TouchableOpacity>
                    {audio && (
                        <View style={styles.mediaPlayerContainer}>
                            <AudioPlayer uri={audio.uri} name={audio.name || "Áudio da Tradução"} onExcluir={() => setAudio(null)} />
                        </View>
                    )}

                    {/* Selecionar Video */}
                    <TouchableOpacity style={styles.mediaButton} onPress={selecionarVideo}>
                        <Icon name="videocam-outline" size={22} color="#093624" style={{ marginRight: 2 }} />
                        <Text style={styles.mediaButtonText}>{video ? `Alterar Vídeo` : "Selecionar Vídeo"}</Text>
                    </TouchableOpacity>
                    {video && (
                        <View style={styles.mediaPlayerContainer}>
                            <VideoPlayer uri={video.uri} onExcluir={() => setVideo(null)} />
                        </View>
                    )}

                    <TouchableOpacity
                        onPress={handleEvent}
                        disabled={carregando}
                        style={styles.submitButton}
                    >
                        <Text style={styles.submitButtonText}>{carregando ? "Aguarde..." : traducao ? "Atualizar Tradução" : "Adicionar Tradução"}</Text>
                    </TouchableOpacity>

                </ScrollView>
            </View>
        );
    }
}