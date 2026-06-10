import { Text, View, TextInput, TouchableOpacity, Alert, ScrollView } from "react-native";
import styles from "./styles";
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState } from "react";
import api from '../../services/api';
import AppText from '../../components/AppText';
import Clipboard from '@react-native-clipboard/clipboard';
import { FotoPlayer } from '../../components/FotoPlayer';
import { AudioPlayer } from '../../components/AudioPlayer';
import { VideoPlayer } from '../../components/VideoPlayer';

type Traducao = {
  texto: string;
  imagem_url?: string;
  audio_url?: string;
  video_url?: string;
};


function Home(){
    const [texto, setTexto] = useState('');
    const [categoria, setCategoria] = useState('');
    const [traducao, setTraducao] = useState<Traducao[]>([]);
    const [carregando, setCarregando] = useState(false);

    const copiarParaClipboard = (texto: string) => {
        Clipboard.setString(texto);
    };


    const handleTraduzir = async () => {
        try {
            setCarregando(true);
            setTraducao([])
            const response = await api.post(`/discurso/buscar`, {
                texto: texto.trim(),
            });
            setTraducao(response.data.traducao);
            setCategoria(response.data.categoria);
        } catch (error) {
            const err = error as any;
            const mensagemErro = err.response?.data?.erro || "Não foi possível traduzir, erro desconhecido.";
            Alert.alert(mensagemErro);
        } finally {
            setCarregando(false);
        }
    };

    
    return(
        <SafeAreaView style={styles.container}>
            <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
            
            <View>
               {/* Digitar discurso */}
               <TextInput
                    style={styles.input}
                    value={texto}
                    onChangeText={setTexto}
                    placeholder="Escreva aqui..."
                    multiline
                />
            </View>
            <View style={styles.actions}>
                {/* Botão de traduzir */}
               <TouchableOpacity 
                    style={styles.button}
                    onPress={handleTraduzir} 
                    disabled={carregando}
                >
                    <Text style={styles.textButton}>{carregando ? "Traduzindo..." : "Traduzir"} </Text>
                </TouchableOpacity>
            </View>
            <View style={styles.divisor} />
            <View>
               {/* Resultado de busca */}
               
               {traducao.length > 0 && (
                <View>
                    <View style={styles.translateActions}>
                        <View>
                            {categoria !== '' && (<AppText style={styles.categoriaTexto}>{categoria}</AppText>)}
                        </View>
                    </View>
                    {traducao.map((trad, index) => (
                        <View key={index}>
                            <View style={styles.traducaoBox}>
                                <AppText style={styles.traducaoTexto}>{trad.texto}</AppText>
                            </View>
                            <TouchableOpacity 
                                style={styles.copy}
                                onPress={() => copiarParaClipboard(trad.texto)}
                            >
                                <Text style={styles.copyText}>Copiar</Text>
                            </TouchableOpacity>

                            {trad.imagem_url && (
                                <FotoPlayer uri={trad.imagem_url} />
                            )}
                            
                            {trad.audio_url && (
                                <AudioPlayer uri={trad.audio_url} name="Áudio da Tradução" />
                            )}
                            
                            {trad.video_url && (
                                <VideoPlayer uri={trad.video_url} />
                            )}
                            
                            {index < traducao.length - 1 && (
                                <View style={styles.divisor} />
                            )}
                        </View>
                    ))}
                </View>
                )}

                
            </View>
            </ScrollView>
        </SafeAreaView>
    )
}

export default Home;