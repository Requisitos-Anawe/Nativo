import React, { useState } from "react";
import { Text, View, TextInput, TouchableOpacity, Alert, ScrollView } from "react-native";
import styles from "./styles";
import { SafeAreaView } from 'react-native-safe-area-context';
import api from '../../services/api';
import Clipboard from '@react-native-clipboard/clipboard';
import Icon from 'react-native-vector-icons/Ionicons';
import { useNavigation, useIsFocused } from '@react-navigation/native';

import { FotoPlayer } from '../../components/FotoPlayer';
import { AudioPlayer } from '../../components/AudioPlayer';
import { VideoPlayer } from '../../components/VideoPlayer';
import { useAuth } from "../../contexts/AuthContext";
import { ModalAdicionarMidia } from "../../components/AddMidia";
import AppText from '../../components/AppText';

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

    const navigation = useNavigation();
    const isFocused = useIsFocused();
    const { user } = useAuth();



    const copiarParaClipboard = (textoParaCopiar: string) => {
        Clipboard.setString(textoParaCopiar);
        Alert.alert("Sucesso", "Texto copiado!");
    };

    const limparTexto = () => {
        setTexto('');
        setTraducao([]);
    };

    const temPermissaoEdicao = user?.perfil === 'professor' || user?.perfil === 'admin';
    const handleTraduzir = async () => {
        if (!texto.trim()) return;

        try {
            setCarregando(true);
            setTraducao([])
            const response = await api.post(`/discurso/buscar`, {
                texto: texto.trim(),
            });
            let traducaoData = response.data.traducao;

            if (response.data.imagem_url || response.data.audio_url || response.data.video_url) {
                traducaoData = traducaoData.map((trad: any) => ({
                    ...trad,
                    imagem_url: trad.imagem_url || response.data.imagem_url,
                    audio_url: trad.audio_url || response.data.audio_url,
                    video_url: trad.video_url || response.data.video_url,
                    id: trad.id || response.data.traducao_id // in case we want to pass the id later
                }));
            }

            setTraducao(traducaoData);
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

    const [modalVisible, setModalVisible] = useState(false);
    const [idParaMidia, setIdParaMidia] = useState('');
    const [traducaoSelecionada, setTraducaoSelecionada] = useState<Traducao | null>(null);

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ flexGrow: 1 }}>

                {/* Seletores de Idioma */}
                <View style={styles.languageContainer}>
                    <View style={styles.languageDropdown}>
                        <Text style={styles.languageText}>De</Text>
                        <Icon name="chevron-down" size={16} color="#000" />
                    </View>

                    <Icon name="swap-horizontal" size={20} color="#000" />

                    <View style={styles.languageDropdown}>
                        <Text style={styles.languageText}>Para</Text>
                        <Icon name="chevron-down" size={16} color="#000" />
                    </View>
                </View>

                {/* Área de Input */}
                <View style={styles.inputContainer}>
                    <TextInput
                        style={styles.input}
                        value={texto}
                        onChangeText={setTexto}
                        placeholder="Discurso"
                        placeholderTextColor="#333"
                        multiline
                    />
                    {texto.length > 0 && (
                        <TouchableOpacity style={styles.clearIcon} onPress={limparTexto}>
                            <Icon name="close" size={20} color="#000" />
                        </TouchableOpacity>
                    )}
                </View>

                {/* Botão Traduzir */}
                <View style={styles.actions}>
                    <TouchableOpacity
                        style={styles.button}
                        onPress={handleTraduzir}
                        disabled={carregando}
                    >
                        <Text style={styles.textButton}>{carregando ? "Traduzindo..." : "Traduzir"}</Text>
                    </TouchableOpacity>
                </View>

                {/* Área de Output (Resultados) */}
                {traducao.length === 0 && (
                    <View style={styles.outputContainer}>
                        <Text style={[styles.outputText, { color: '#999' }]}>
                            Tradução aparecerá aqui
                        </Text>
                    </View>
                )}

                {traducao.map((trad, index) => (
                    <View key={trad.id || index} style={[styles.outputContainer, { marginBottom: index === traducao.length - 1 ? 30 : 15 }]}>
                        <Text style={[styles.outputText, { color: '#333' }]}>
                            {trad.texto}
                        </Text>

                        <View style={styles.outputActions}>
                            <TouchableOpacity onPress={() => copiarParaClipboard(trad.texto)}>
                                <Icon name="copy-outline" size={22} color="#000" />
                            </TouchableOpacity>
                            <TouchableOpacity>
                                <Icon name="mic-outline" size={24} color="#000" />
                            </TouchableOpacity>
                        </View>

                        {/* Midias */}
                        {trad.imagem_url && (
                            <View style={{ marginTop: 20 }}>
                                <FotoPlayer uri={trad.imagem_url} />
                                <BotaoRemoverMidia id={trad.id} tipo="imagem_url" />
                            </View>
                        )}

                        {trad.audio_url && (
                            <View style={{ marginTop: 20 }}>
                                <AudioPlayer uri={trad.audio_url} name="Áudio da Tradução" />
                                <BotaoRemoverMidia id={trad.id} tipo="audio_url" />
                            </View>
                        )}

                        {trad.video_url && (
                            <View style={{ marginTop: 20 }}>
                                <VideoPlayer uri={trad.video_url} />
                                <BotaoRemoverMidia id={trad.id} tipo="video_url" />
                            </View>
                        )}

                        {temPermissaoEdicao && (
                            <TouchableOpacity
                                style={{ backgroundColor: '#28a745', padding: 10, borderRadius: 5, marginTop: 10 }}
                                onPress={() => {
                                    setIdParaMidia(trad.id);
                                    setTraducaoSelecionada(trad);
                                    setModalVisible(true);
                                }}
                            >
                                <Text style={{ color: '#fff', textAlign: 'center', fontWeight: 'bold' }}>
                                    + Adicionar Mídia
                                </Text>
                            </TouchableOpacity>
                        )}
                    </View>
                ))}

            </ScrollView>

            {/* Botão Info Flutuante */}
            <TouchableOpacity
                style={styles.infoButton}
                onPress={() => navigation.navigate('Informations' as never)}
            >
                <Icon name="information" size={24} color="#fff" />
            </TouchableOpacity>

            {temPermissaoEdicao && (
                <ModalAdicionarMidia
                    visible={modalVisible}
                    onClose={() => setModalVisible(false)}
                    traducaoId={idParaMidia}
                    onSucesso={handleTraduzir}
                    traducao={traducaoSelecionada}
                />
            )}
        </SafeAreaView>
    )
}

export default Home;