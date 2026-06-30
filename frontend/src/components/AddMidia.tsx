import React, { useState } from 'react';
import { Modal, View, Text, TouchableOpacity, Alert, ScrollView, StyleSheet } from 'react-native';
import api from '../services/api';
import { launchImageLibrary } from 'react-native-image-picker';
import { pick } from '@react-native-documents/picker';
import { useAuth } from '../contexts/AuthContext';
import { FotoPlayer } from './FotoPlayer';
import { AudioPlayer } from './AudioPlayer';
import { VideoPlayer } from './VideoPlayer';

interface ModalProps {
    visible: boolean;
    onClose: () => void;
    traducaoId: string;
    traducao: any;
    onSucesso: () => void;
}
export const ModalAdicionarMidia = ({ visible, onClose, traducaoId, traducao, onSucesso }: ModalProps) => {
    const { user } = useAuth();
    const temPermissao = user?.perfil === 'professor' || user?.perfil === 'administrador' || user?.perfil === 'admin';

    // Se não tiver permissão, fecha o modal automaticamente
    React.useEffect(() => {
        if (!temPermissao && visible) {
            onClose();
            Alert.alert("Acesso Negado", "Você não tem permissão para adicionar mídias.");
        }
    }, [temPermissao, visible]);
    const [carregando, setCarregando] = useState(false);
    const [foto, setFoto] = useState<any>(null);
    const [audio, setAudio] = useState<any>(null);
    const [video, setVideo] = useState<any>(null);
    const jaTemFoto = !!traducao?.imagem_url;
    const jaTemAudio = !!traducao?.audio_url;
    const jaTemVideo = !!traducao?.video_url;

    const handleUpload = async () => {
        if (!temPermissao) {
            Alert.alert("Acesso Negado", "Você não tem permissão para adicionar mídias.");
            return;
        }

        if (!foto && !audio && !video) return Alert.alert("Aviso", "Selecione pelo menos um arquivo para adicionar.");

        setCarregando(true);
        const formData = new FormData();

        if (foto) formData.append("foto", { uri: foto.uri, type: 'image/jpeg', name: 'foto.jpg' } as any);
        if (audio) formData.append("audio", { uri: audio.uri, type: 'audio/mpeg', name: 'audio.mp3' } as any);
        if (video) formData.append("video", { uri: video.uri, type: 'video/mp4', name: 'video.mp4' } as any);

        try {
            // O endpoint PUT atualiza os campos, adicionando a nova mídia sem afetar as existentes
            await api.put(`/traducao/${traducaoId}/com-discurso`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            Alert.alert("Sucesso", "Mídias adicionadas com sucesso!");
            onSucesso();
            onClose();
            setFoto(null); setAudio(null); setVideo(null);
        } catch (e) {
            Alert.alert("Erro", "Falha ao adicionar mídias.");
        } finally {
            setCarregando(false);
        }
    };

    return (
        <Modal visible={visible && temPermissao} animationType="slide" transparent>
            <View style={styles.overlay}>
                <View style={styles.container}>
                    <Text style={styles.title}>Adicionar Novas Mídias</Text>

                    <ScrollView>
                        {!jaTemFoto && (
                            <View style={{ marginBottom: 15 }}>
                                <TouchableOpacity style={styles.input} onPress={async () => {
                                    const res = await launchImageLibrary({ mediaType: 'photo' });
                                    if (res.assets) setFoto(res.assets[0]);
                                }}>
                                    <Text>{foto ? "Alterar Foto" : "Selecionar Foto"}</Text>
                                </TouchableOpacity>
                                {foto && (
                                    <FotoPlayer uri={foto.uri} onExcluir={() => setFoto(null)} />
                                )}
                            </View>
                        )}

                        {!jaTemAudio && (
                            <View style={{ marginBottom: 15 }}>
                                <TouchableOpacity style={styles.input} onPress={async () => {
                                    try { const [res] = await pick({ type: ['audio/*'] }); setAudio(res); } catch (e) { }
                                }}>
                                    <Text>{audio ? "Alterar Áudio" : "Selecionar Áudio"}</Text>
                                </TouchableOpacity>
                                {audio && (
                                    <AudioPlayer uri={audio.uri} name={audio.name || "Áudio selecionado"} onExcluir={() => setAudio(null)} />
                                )}
                            </View>
                        )}

                        {!jaTemVideo && (
                            <View style={{ marginBottom: 15 }}>
                                <TouchableOpacity style={styles.input} onPress={async () => {
                                    const res = await launchImageLibrary({ mediaType: 'video' });
                                    if (res.assets) setVideo(res.assets[0]);
                                }}>
                                    <Text>{video ? "Alterar Vídeo" : "Selecionar Vídeo"}</Text>
                                </TouchableOpacity>
                                {video && (
                                    <VideoPlayer uri={video.uri} onExcluir={() => setVideo(null)} />
                                )}
                            </View>
                        )}

                        {(jaTemFoto && jaTemAudio && jaTemVideo) && (
                            <Text style={{ textAlign: 'center', marginVertical: 20 }}>
                                Esta tradução já possui todas as mídias disponíveis.
                            </Text>
                        )}
                    </ScrollView>

                    <TouchableOpacity onPress={handleUpload} style={styles.button} disabled={carregando}>
                        <Text style={{ color: '#fff', fontWeight: 'bold' }}>{carregando ? "Enviando..." : "Confirmar Adição"}</Text>
                    </TouchableOpacity>

                    <TouchableOpacity onPress={onClose} style={{ marginTop: 10, alignItems: 'center' }}>
                        <Text>Cancelar</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', padding: 20 },
    container: { backgroundColor: 'white', padding: 20, borderRadius: 10, maxHeight: '70%' },
    title: { fontSize: 18, fontWeight: 'bold', marginBottom: 15 },
    input: { padding: 15, borderWidth: 1, borderColor: '#ccc', borderRadius: 5, marginBottom: 10 },
    button: { padding: 15, backgroundColor: '#28a745', alignItems: 'center', borderRadius: 5 }
});