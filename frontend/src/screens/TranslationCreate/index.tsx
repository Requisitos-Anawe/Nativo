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
                            selectedValue={categorias.filter(cat => cat.descricao.toLowerCase() === categoriaSelecionada.toLowerCase())[0]?.descricao || categoriaSelecionada}
                            onValueChange={(item) => { setCategoriaSelecionada(item) }}
                        >
                            {categorias.map((item) => (
                                <Picker.Item key={item.id} label={item.descricao} value={item.descricao} />
                            ))}
                        </Picker>
                    </View>
                    <View style={styles.divisor} />

                    <Text style={styles.subtitle} >Discurso</Text>
                    <View style={styles.input} >
                        <Picker
                            selectedValue={idiomas.filter(idi => idi.descricao === idiomaDiscurso)[0]?.descricao || idiomaDiscurso}
                            onValueChange={(itemValue) => setIdiomaDiscurso(itemValue)}
                        >
                            {idiomas.map((item) => (
                                <Picker.Item key={item.id} label={item.descricao} value={item.descricao} />
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
                            selectedValue={idiomas.filter(idi => idi.descricao === idiomaTraducao)[0]?.descricao || idiomaTraducao}
                            onValueChange={(itemValue) => setIdiomaTraducao(itemValue)}
                        >
                            {idiomas.map((item) => (
                                <Picker.Item key={item.id} label={item.descricao} value={item.descricao} />
                            ))}
                        </Picker>
                    </View>
                    <View style={styles.input} >
                        <TextInput
                            value={textoTraducao}
                            placeholder="Digite a tradução"
                            multiline
                            style={{ height: 120, textAlign: 'left', textAlignVertical: 'top' }}
                            onChangeText={setTextoTraducao}
                        ></TextInput>
                    </View>

                    <View style={styles.divisor} />
                    <Text style={styles.subtitle}>Arquivos de Mídia</Text>

                    <TouchableOpacity style={styles.input} onPress={selecionarFoto}>
                        <Text style={{ color: '#333' }}>{foto ? `Alterar Foto` : "Selecionar Foto (Imagem)"}</Text>
                    </TouchableOpacity>
                    {foto && (
                        <FotoPlayer
                            uri={foto.uri}
                            onExcluir={() => setFoto(null)}
                        />
                    )}

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