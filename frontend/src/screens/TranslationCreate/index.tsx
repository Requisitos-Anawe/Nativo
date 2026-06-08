import { ActivityIndicator, Alert, ScrollView, Text, TextInput, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import styles from "./styles";
import { Picker } from '@react-native-picker/picker';
import { useCallback, useEffect, useState } from "react";
import api from "../../services/api";
import { RouteProp, useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import Erro from "../../components/Erro";
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

export default function TraslationCreate() {
    const route = useRoute<RouteProp<RootStackParamList, 'TraslationCreate'>>();
    const traducao_id = route.params?.traducao_id ?? null;
    const [traducao, setTraducao] = useState<TraducaoInterface>();
    const [categorias, setCategorias] = useState<CategoriaInterface[]>([]);
    const [idiomas, setIdiomas] = useState<IdiomaInterface[]>([]);
    const [categoriaSelecionada, setCategoriaSelecionada] = useState<CategoriaInterface | null>(null);
    const [idiomaTraducao, setIdiomaTraducao] = useState<IdiomaInterface | null>(null);
    const [idiomaDiscurso, setIdiomaDiscurso] = useState<IdiomaInterface | null>(null);
    const [textoDiscurso, setTextoDiscurso] = useState('');
    const [textoTraducao, setTextoTraducao] = useState('');
    const [carregando, setCarregando] = useState(true);
    const [erro, setErro] = useState('');
    const navigation = useNavigation();

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
                    setCategoriaSelecionada(catRes.data[0]);

                    setIdiomas(idiRes.data);
                    setIdiomaTraducao(idiRes.data[0]);
                    setIdiomaDiscurso(idiRes.data[1]);

                    if (traducao_id) {
                        const traducaoRes = await api.get(`/traducao/${traducao_id}`);
                        if (!isActive) return;

                        setTraducao(traducaoRes.data);

                        // Preencher os estados com os dados da tradução carregada
                        setCategoriaSelecionada(traducaoRes.data.discurso.discurso_categoria);
                        setIdiomaDiscurso(traducaoRes.data.discurso.idioma);
                        setTextoDiscurso(traducaoRes.data.discurso.texto);
                        setIdiomaTraducao(traducaoRes.data.idioma);
                        setTextoTraducao(traducaoRes.data.texto);
                    } else {
                        // Se for adicionar nova, limpa os estados (útil para resetar caso tenha vindo de edição)
                        setTraducao(undefined);
                        setCategoriaSelecionada(catRes.data[0]);
                        setIdiomaDiscurso(idiRes.data[1]);
                        setTextoDiscurso('');
                        setIdiomaTraducao(idiRes.data[0]);
                        setTextoTraducao('');
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
                // Limpa o param quando sair da tela
                (navigation as any).setParams({ traducao_id: undefined });
            };
        }, [traducao_id])
    );
    const selecionarFoto = async () => {
        const result = await launchImageLibrary({
            mediaType: 'photo',
            quality: 1,
        });

        if (result.assets && result.assets.length > 0) {
            setFoto(result.assets[0]);
        }
    };

    // Seleção de Vídeo da Galeria Pura
    const selecionarVideo = async () => {
        const result = await launchImageLibrary({
            mediaType: 'video',
            quality: 1,
        });

        if (result.assets && result.assets.length > 0) {
            setVideo(result.assets[0]);
        }
    };

    const selecionarAudio = async () => {
        try {
            const [res] = await pick({
                type: ['audio/*'],
            });
            setAudio(res);
        } catch (err) {
            console.log(err);
        }
    };
    const handleEvent = async () => {
        try {
            setCarregando(true);
            const formData = new FormData();

            formData.append("traducao_texto", textoTraducao.trim());
            formData.append("discurso_texto", textoDiscurso.trim());
            formData.append("idioma_discurso_id", idiomaDiscurso?.id ?? "");
            formData.append("idioma_traducao_id", idiomaTraducao?.id ?? "");
            formData.append("discurso_categoria_id", categoriaSelecionada?.id ?? "");

            // Inserindo os arquivos
            if (foto) {
                formData.append("foto", {
                    uri: foto.uri,
                    type: foto.type,
                    name: foto.name || "foto.jpg"
                } as any);
            }
            if (audio) {
                formData.append("audio", {
                    uri: audio.uri,
                    type: audio.type,
                    name: audio.name || "audio.mp3"
                } as any);
            }
            if (video) {
                formData.append("video", {
                    uri: video.uri,
                    type: video.type,
                    name: video.name || "video.mp4"
                } as any);
            }

            const config = {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            };

            if (!traducao) {
                const response = await api.post('/traducao/cadastrar', formData, config);
                if (response) Alert.alert('Tradução cadastrada com sucesso');
                setTextoDiscurso('');
                setTextoTraducao('');
                setFoto(null);
                setAudio(null);
                setVideo(null);
                setErro('');
            } else {
                await api.put(`/traducao/discurso/edit-completo/${traducao_id}`, formData, config);
                Alert.alert('Tradução e discurso atualizados com sucesso');
            }

        } catch (error) {
            const err = error as any;
            console.log("ERRO DETALHADO DO AXIOS:", err.response?.data);
            const mensagemErro = err.response?.data?.erro ||
                `Não foi possível ${traducao ? "atualizar" : "adicionar"} a tradução.`;
            setErro(mensagemErro);
            Alert.alert('Não foi possível realizar o cadastro.');
        } finally {
            setCarregando(false);
        }
    };

    if (carregando) {
        return <ActivityIndicator />;
    } else {
        return (
            <ScrollView>
                <SafeAreaView style={styles.container} >

                    <Text style={styles.title}>
                        {traducao ? 'Editar Tradução' : 'Nova Tradução'}
                    </Text>

                    {erro && <Erro texto={erro} />}

                    <View style={styles.divisor} />
                    <Text style={styles.subtitle} >Categoria do discurso</Text>
                    <View style={styles.input} >
                        <Picker
                            selectedValue={categoriaSelecionada?.id}
                            onValueChange={(item) => {
                                setCategoriaSelecionada(categorias.find((i) => i.id === item) || null);
                            }}
                        >
                            {categorias.map((item) => (
                                <Picker.Item key={item.id} label={item.descricao} value={item.id} />
                            ))}
                        </Picker>
                    </View>
                    <View style={styles.divisor} />

                    <Text style={styles.subtitle} >Discurso</Text>
                    <View style={styles.input} >
                        <Picker
                            selectedValue={idiomaDiscurso?.id}
                            onValueChange={(itemValue) =>
                                setIdiomaDiscurso(idiomas.find((i) => i.id === itemValue) || null)}
                        >
                            {idiomas.map((item) => (
                                <Picker.Item key={item.id} label={item.nome} value={item.id} />
                            ))}
                        </Picker>
                    </View>
                    <View style={styles.input} >
                        <TextInput
                            value={textoDiscurso}
                            placeholder="Digite o discurso"
                            multiline
                            style={{ height: 120, textAlign: 'left', textAlignVertical: 'top' }}
                            onChangeText={setTextoDiscurso}
                        ></TextInput>
                    </View>

                    <View style={styles.divisor} />

                    <Text style={styles.subtitle} >Tradução</Text>
                    <View style={styles.input} >
                        <Picker
                            selectedValue={idiomaTraducao?.id}
                            onValueChange={(itemValue) =>
                                setIdiomaTraducao(idiomas.find((i) => i.id === itemValue) || null)}
                        >
                            {idiomas.map((item) => (
                                <Picker.Item key={item.id} label={item.nome} value={item.id} />
                            ))}
                        </Picker>
                    </View>
                    <View style={styles.input} >
                        <TextInput
                            value={textoTraducao}
                            placeholder="Digite o discurso"
                            multiline
                            style={{ height: 120, textAlign: 'left', textAlignVertical: 'top' }}
                            onChangeText={setTextoTraducao}
                        ></TextInput>
                    </View>

                    <View style={styles.divisor} />
                    <Text style={styles.subtitle}>Arquivos de Mídia</Text>

                    {/* Botão para Foto */}
                    <TouchableOpacity style={styles.input} onPress={selecionarFoto}>
                        <Text style={{ color: '#333' }}>{foto ? `Alterar Foto` : "Selecionar Foto (Imagem)"}</Text>
                    </TouchableOpacity>
                    {foto && (
                        <FotoPlayer
                            uri={foto.uri}
                            onExcluir={() => setFoto(null)}
                        />
                    )}

                    {/* Botão e Preview de ÁUDIO */}
                    <TouchableOpacity style={styles.input} onPress={selecionarAudio}>
                        <Text style={{ color: '#333' }}>{audio ? `Alterar Áudio` : "Selecionar Áudio"}</Text>
                    </TouchableOpacity>
                    {audio && (
                        <AudioPlayer
                            uri={audio.uri}
                            name={audio.name || "Áudio da Tradução"}
                            onExcluir={() => setAudio(null)}
                        />
                    )}

                    {/* Botão e Preview de VÍDEO */}
                    <TouchableOpacity style={styles.input} onPress={selecionarVideo}>
                        <Text style={{ color: '#333' }}>{video ? `Alterar Vídeo` : "Selecionar Vídeo"}</Text>
                    </TouchableOpacity>
                    {video && (
                        <VideoPlayer
                            uri={video.uri}
                            onExcluir={() => setVideo(null)}
                        />
                    )}
                    <View style={styles.divisor} />

                    <TouchableOpacity
                        onPress={handleEvent}
                        disabled={carregando}
                        style={styles.button}
                    >
                        <Text style={{ color: '#fff' }}>{carregando ? "Aguarde..." : traducao ? "Atualizar" : "Adicionar"}</Text>
                    </TouchableOpacity>

                </SafeAreaView>
            </ScrollView>
        )
    }

}