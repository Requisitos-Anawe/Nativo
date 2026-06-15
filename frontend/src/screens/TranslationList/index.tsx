import { ActivityIndicator, ScrollView, Text, TextInput, TouchableOpacity, View } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import styles from "./styles"
import { Picker } from "@react-native-picker/picker"
import { useCallback, useEffect, useState } from "react"
import api from "../../services/api"
import AsyncStorage from "@react-native-async-storage/async-storage"
import Icon from "react-native-vector-icons/Ionicons"
import { useFocusEffect, useNavigation } from "@react-navigation/native"
import { NativeStackNavigationProp } from "@react-navigation/native-stack"
import Erro from "../../components/Erro"
import type {BottomTabNavigationProp} from '@react-navigation/bottom-tabs';
import type {ProfessorTabParamList} from '../../navigation/NavigationTypes';

export default function TraslationList(){
    const navigation =
        useNavigation<BottomTabNavigationProp<ProfessorTabParamList>>();
import { VideoPlayer } from "../../components/VideoPlayer"
import { AudioPlayer } from "../../components/AudioPlayer"
import { FotoPlayer } from "../../components/FotoPlayer"

type RootStackParamList = {
    AddTraducao: { traducao_id: string };
    [key: string]: undefined | object;
};

export default function TraslationList() {
    const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

    const [idiomaTraducao, setIdiomaTraducao] = useState<string>('');
    const [textoTraducao, setTextoTraducao] = useState('');
    const [idiomas, setIdiomas] = useState<IdiomaInterface[]>([]);
    const [traducoes, setTraducoes] = useState<TraducaoResponse[]>([]);

    const [carregando, setCarregando] = useState(true);
    const [erro, setErro] = useState('');
    
    const [pagina, setPagina] = useState(1);
    const [limite] = useState(5);
    const [totalPaginas, setTotalPaginas] = useState(1);
    const [totalRegistros, setTotalRegistros] = useState(0);

    const handleSearch = async () => {
        try {
            setErro('');
            setCarregando(true);
            setPagina(1);  

            const userString = await AsyncStorage.getItem('user');
            if (userString) {
                const user = JSON.parse(userString);
                const payload = {
                    textoTraducao: textoTraducao.trim(),
                    idiomaTraducao: idiomaTraducao.toLowerCase(),
                    limite: limite,
                    pagina: 1, 
                };
                const response = await api.post(`/traducao/usuario/${user.id}`, payload);
                setTraducoes(response.data.traducoes);
                setTotalPaginas(response.data.total_paginas);
                setTotalRegistros(response.data.total_registros);
            } else {
                setErro('Não foi possível buscar as traduções.');
            }
        } catch (error) {
            var err = error as any;
            setErro(err.response?.data?.erro || "Aconteceu um erro desconhecido, tente mais tarde.");
        } finally {
            setCarregando(false);
        }
    }

    const irProximaPagina = async () => {
        if (pagina < totalPaginas) {
            setPagina(pagina + 1);
        }
    }

    const irPaginaAnterior = async () => {
        if (pagina > 1) {
            setPagina(pagina - 1);
        }
    }

    const buscarPaginaAtual = async () => {
        try {
            setErro('');
            setCarregando(true);

            const userString = await AsyncStorage.getItem('user');
            if (userString) {
                const user = JSON.parse(userString);
                const payload = {
                    textoTraducao: textoTraducao.trim(),
                    idiomaTraducao: idiomaTraducao,
                    limite: limite,
                    pagina: pagina,
                };
                const response = await api.post(`/traducao/usuario/${user.id}`, payload);
                setTraducoes(response.data.traducoes);
                setTotalPaginas(response.data.total_paginas);
                setTotalRegistros(response.data.total_registros);
            } else {
                setErro('Não foi possível buscar as traduções.'); 
            }
        } catch (error) {
            var err = error as any;
            setErro(err.response?.data?.erro || "Aconteceu um erro desconhecido, tente mais tarde.");
        } finally {
            setCarregando(false);
        }
    }

    useFocusEffect(
        useCallback(() => {
            buscarPaginaAtual();
        }, [pagina])
    );

    useEffect(() => {
        const getIdiomas = async () => {
            try {
                const response = await api.get(`/idiomas`);
                setIdiomas(response.data);
            } catch (error) {
                var err = error as any;
                setErro(err.response?.data?.erro || "Aconteceu um erro, tente mais tarde.");
            }
        };
        getIdiomas();
    }, []);

    return (
        <ScrollView>
            <SafeAreaView style={styles.container} >

                <Text style={styles.subtitle} >Filtros</Text>
                <View style={styles.input} >
                    <Picker 
                        selectedValue={idiomaTraducao ?? ''} 
                        onValueChange={(itemValue) => setIdiomaTraducao(itemValue)}
                    >
                        <Picker.Item label="Selecione um idioma" value="" />
                        {idiomas.map((item) => (
                            <Picker.Item key={item.id} label={item.descricao} value={item.descricao} />
                        ))}
                    </Picker>
                </View>
                <View style={styles.input} >
                    <TextInput 
                        value={textoTraducao} 
                        placeholder="Digite a tradução desejada" 
                        multiline 
                        style={{height: 55}} 
                        onChangeText={setTextoTraducao}
                    ></TextInput>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                    <TouchableOpacity
                        onPress={handleSearch}
                        disabled={carregando}
                        style={styles.button}
                    >
                        <Text style={{ color: '#fff' }}>{carregando ? "Aguarde..." : "Buscar"}</Text>
                    </TouchableOpacity>
                </View>

                {erro && <Erro texto={erro} />}

                <View style={styles.divisor} />

                {carregando ? (
                    <ActivityIndicator />
                ) : (
                    <>
                        {traducoes.length === 0 ? (
                            <View style={styles.caixaAviso}>
                                <Text style={styles.textoAviso}>Nenhuma tradução foi encontrada.</Text>
                            </View>
                        ) : (
                            <>
                                {/* Controles de paginação */}
                                <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginVertical: 20, paddingHorizontal: 10}}>
                                    <TouchableOpacity 
                                        onPress={irPaginaAnterior} 
                                        disabled={pagina === 1 || carregando}
                                        style={[styles.minorButton, pagina === 1 && {opacity: 0.5}]}
                                    >
                                        <Text style={{color:'#fff'}}> <Icon name={"arrow-back"} size={18} color="#fff"/> </Text>
                                    </TouchableOpacity>

                                    <View style={{alignItems: 'center'}}>
                                        <Text style={{fontSize: 14, fontWeight: 'bold'}}>
                                            Página {pagina} de {totalPaginas}
                                        </Text>
                                        <Text style={{fontSize: 12, color: '#666', marginTop: 4}}>
                                            {totalRegistros} {totalRegistros === 1 ? 'registro' : 'registros'}
                                        </Text>
                                    </View>

                                    <TouchableOpacity 
                                        onPress={irProximaPagina} 
                                        disabled={pagina === totalPaginas || carregando}
                                        style={[styles.minorButton, pagina === totalPaginas && {opacity: 0.5}]}
                                    >
                                        <Text style={{color:'#fff'}}> <Icon name={"arrow-forward"} size={18} color="#fff"/> </Text>
                                    </TouchableOpacity>
                                </View>

                                {traducoes.map((item) => (
                                    <View key={item.id} style={styles.traducaoBox}>
                                        <View style={{alignItems: "flex-end"}}>
                                            <TouchableOpacity onPress={() => navigation.navigate('AddTraducao', { traducao_id: item.id })}>
                                                <Icon name={"create-outline"} size={18} color="#000"/>
                                            </TouchableOpacity>
                                        </View>
                                        <Text style={styles.boxTitle} >Discurso: <Text style={styles.discursoText} >{item.discurso}</Text> </Text>
                                        <View style={styles.divisor}/>
                                        <Text style={styles.boxTitle} >Tradução: <Text style={styles.discursoText} >{item.texto}</Text> </Text>
                                        <View style={styles.boxHour} ><Text style={styles.traducaoHour}>{item.data_criacao}</Text></View>
                                        
                                        {(item.imagem_url || item.video_url || item.audio_url) && (
                                            <View style={{ marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#eee' }}>
                                                {item.imagem_url && (
                                                    <FotoPlayer uri={item.imagem_url} height={150} />
                                                )}
                                                {item.audio_url && (
                                                    <AudioPlayer uri={item.audio_url} name="Áudio do Discurso" />
                                                )}
                                                {item.video_url && (
                                                    <VideoPlayer uri={item.video_url} height={180} />
                                                )}
                                            </View>
                                        )}
                                    </View>
                                ))}
                            </>
                        )}
                    </>
                )}

            </SafeAreaView>
        </ScrollView>
    )
}