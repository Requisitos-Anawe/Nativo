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
import { useAuth } from "../../contexts/AuthContext";

type Traducao = {
    id: string;
    texto: string;
    imagem_url?: string;
    audio_url?: string;
    video_url?: string;
};


function Home() {
    const [texto, setTexto] = useState('');
    const [categoria, setCategoria] = useState('');
    const [traducao, setTraducao] = useState<Traducao[]>([]);
    const [carregando, setCarregando] = useState(false);

    const copiarParaClipboard = (texto: string) => {
        Clipboard.setString(texto);
    };

    const { user } = useAuth();

    const perfilUsuario = user?.perfil || '';

    const temPermissaoEdicao = perfilUsuario === 'professor' || perfilUsuario === 'administrador';
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

    const RemoverMidia = async (traducaoId: string, tipoMidia: string, apagarDoServidor: boolean) => {
        try {
            setCarregando(true);
            await api.put(`/traducao/${traducaoId}/remover-midia`, {
                tipo_midia: tipoMidia,
                apagar_servidor: apagarDoServidor
            });

            Alert.alert('Sucesso', 'Mídia removida com sucesso!');
            handleTraduzir();
        } catch (error) {
            Alert.alert('Erro', 'Não foi possível remover a mídia.');
        } finally {
            setCarregando(false);
        }
    };

    const confirmarRemocaoMidia = (traducaoId: string, tipoMidia: string) => {
        Alert.alert(
            "Opções de Mídia",
            "Deseja apenas desvincular esta mídia da tradução ou excluí-la permanentemente do servidor?",
            [
                { text: "Cancelar", style: "cancel" },
                { text: "Apenas Desvincular", onPress: () => RemoverMidia(traducaoId, tipoMidia, false) },
                {
                    text: "Excluir Permanente",
                    style: "destructive",
                    onPress: () => {
                        Alert.alert(
                            "Atenção!",
                            "Tem certeza? Esta ação não pode ser desfeita e o arquivo será apagado do banco de dados.",
                            [
                                { text: "Cancelar", style: "cancel" },
                                { text: "Sim, Excluir", style: "destructive", onPress: () => RemoverMidia(traducaoId, tipoMidia, true) }
                            ]
                        );
                    }
                }
            ]
        );
    };

    const BotaoRemoverMidia = ({ id, tipo }: { id: string, tipo: string }) => {
        if (!temPermissaoEdicao || !id) return null;
        return (
            <TouchableOpacity
                style={{ alignSelf: 'flex-end', marginTop: 5, marginBottom: 15 }}
                onPress={() => confirmarRemocaoMidia(id, tipo)}
            >
                <Text style={{ color: 'red', fontWeight: 'bold' }}>Remover Mídia</Text>
            </TouchableOpacity>
        );
    };

    return (
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
                                <View key={trad.id || index}>
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
                                        <View>
                                            <FotoPlayer uri={trad.imagem_url} />
                                            <BotaoRemoverMidia id={trad.id} tipo="imagem_url" />
                                        </View>
                                    )}

                                    {trad.audio_url && (
                                        <View>
                                            <AudioPlayer uri={trad.audio_url} name="Áudio da Tradução" />
                                            <BotaoRemoverMidia id={trad.id} tipo="audio_url" />
                                        </View>
                                    )}

                                    {trad.video_url && (
                                        <View>
                                            <VideoPlayer uri={trad.video_url} />
                                            <BotaoRemoverMidia id={trad.id} tipo="video_url" />
                                        </View>
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