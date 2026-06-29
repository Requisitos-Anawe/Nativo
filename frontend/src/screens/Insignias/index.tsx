import React, { useState, useEffect, useLayoutEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator, Alert, Image, Modal } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useIsFocused } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Ionicons';
import styles from './styles';
import { useAuth } from "../../contexts/AuthContext";

// Imagens
import insignia1 from '../../../assets/images/insignia1.svg';
import insignia2 from '../../../assets/images/insignia2.svg';
import insignia3 from '../../../assets/images/insignia3.svg';
import insignia4 from '../../../assets/images/insignia4.svg';

import ocultInsignia1 from '../../../assets/images/ocultInsignia1.svg';
import ocultInsignia2 from '../../../assets/images/ocultInsignia2.svg';
import ocultInsignia3 from '../../../assets/images/ocultInsignia3.svg';
import ocultInsignia4 from '../../../assets/images/ocultInsignia4.png'; // PNG

// Serviços e Interfaces
import { obterInsigniasUsuario } from '../../services/InsigniaService';
import { Insignia } from '../../interfaces/InsigniaInterface';

const ASSETS_INSIGNIAS: Record<string, any> = {
    'insignia1.svg': insignia1,
    'insignia2.svg': insignia2,
    'insignia3.svg': insignia3,
    'insignia4.svg': insignia4,
    'ocultInsignia1.svg': ocultInsignia1,
    'ocultInsignia2.svg': ocultInsignia2,
    'ocultInsignia3.svg': ocultInsignia3,
    'ocultInsignia4.png': ocultInsignia4,
};

export default function InsigniasScreen() {
    const insets = useSafeAreaInsets();
    const navigation = useNavigation();
    const isFocused = useIsFocused();
    const { user } = useAuth();

    const [insignias, setInsignias] = useState<Insignia[]>([]);
    const [loading, setLoading] = useState(false);
    
    // Estados para visualização de insígnias expandidas
    const [insigniaSelecionada, setInsigniaSelecionada] = useState<Insignia | null>(null);
    const [insigniaModalVisible, setInsigniaModalVisible] = useState(false);

    useLayoutEffect(() => {
        if (isFocused) {
            navigation.getParent()?.setOptions({ headerShown: false });
        }
    }, [navigation, isFocused]);

    const carregarInsignias = async () => {
        if (!user?.id) return;
        try {
            setLoading(true);
            const data = await obterInsigniasUsuario(user.id);
            setInsignias(data.insignias);
        } catch (error) {
            console.error('Erro ao buscar insígnias no ecrã integral:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (isFocused && user?.id) {
            carregarInsignias();
        }
    }, [isFocused, user?.id]);

    const handlePressInsignia = (insignia: Insignia) => {
        setInsigniaSelecionada(insignia);
        setInsigniaModalVisible(true);
    };

    const formatInsigniaDate = (isoString?: string | null) => {
        if (!isoString) return '';
        const datePart = isoString.split('T')[0];
        const parts = datePart.split('-');
        if (parts.length === 3) {
            return `${parts[2]}/${parts[1]}/${parts[0]}`;
        }
        return isoString;
    };

    return (
        <View style={styles.container}>
            {/* Header com botão de voltar */}
            <View style={[styles.header, { paddingTop: insets.top }]}>
                <TouchableOpacity 
                    style={[styles.backButton, { top: insets.top + 20 }]} 
                    onPress={() => navigation.goBack()}
                >
                    <Icon name="arrow-back" size={24} color="#fff" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Insígnias</Text>
            </View>

            {loading ? (
                <View style={styles.centerBox}>
                    <ActivityIndicator size="large" color="#042d1f" />
                </View>
            ) : (
                <ScrollView
                    style={styles.scrollContainer}
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                >
                    <View style={styles.gridContainer}>
                        {insignias.map((insignia) => {
                            const imageName = insignia.adquirida ? insignia.imagem : insignia.imagem_bloqueada;
                            const Asset = ASSETS_INSIGNIAS[imageName];
                            const isPng = imageName.endsWith('.png');

                            return (
                                <TouchableOpacity 
                                    key={insignia.id}
                                    style={styles.badgeCard}
                                    onPress={() => handlePressInsignia(insignia)}
                                    activeOpacity={0.7}
                                >
                                    <View style={styles.badgeImageWrapper}>
                                        {imageName && imageName.startsWith('http') ? (
                                            <Image source={{ uri: imageName }} style={{ width: 80, height: 80, borderRadius: 40 }} resizeMode="cover" />
                                        ) : Asset ? (
                                            isPng ? (
                                                <Image source={Asset} style={{ width: 80, height: 80 }} resizeMode="contain" />
                                            ) : (
                                                React.createElement(Asset, { width: 80, height: 80 })
                                            )
                                        ) : null}
                                        {!insignia.adquirida && (
                                            <View style={styles.lockOverlay}>
                                                <Icon name="lock-closed" size={20} color="#fff" />
                                            </View>
                                        )}
                                    </View>
                                    <Text style={styles.badgeTitle} numberOfLines={2}>
                                        {insignia.titulo}
                                    </Text>
                                    <Text style={styles.badgeDesc}>
                                        {insignia.descricao}
                                    </Text>
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                </ScrollView>
            )}
            {/* Modal de Conquista Expandida */}
            <Modal
                animationType="slide"
                transparent={false}
                visible={insigniaModalVisible}
                onRequestClose={() => setInsigniaModalVisible(false)}
            >
                {insigniaSelecionada && (
                    <View style={styles.insigniaModalContainer}>
                        <TouchableOpacity 
                            style={styles.insigniaCloseButton} 
                            onPress={() => setInsigniaModalVisible(false)}
                        >
                            <Icon name="close-outline" size={32} color="#000" />
                        </TouchableOpacity>

                        <View style={styles.insigniaModalImageWrapper}>
                            {(() => {
                                const imageName = insigniaSelecionada.adquirida 
                                    ? insigniaSelecionada.imagem 
                                    : insigniaSelecionada.imagem_bloqueada;
                                
                                if (imageName && imageName.startsWith('http')) {
                                    return <Image source={{ uri: imageName }} style={{ width: 220, height: 220, borderRadius: 110 }} resizeMode="cover" />;
                                }

                                const Asset = ASSETS_INSIGNIAS[imageName];
                                const isPng = imageName.endsWith('.png');

                                if (!Asset) return null;
                                return isPng ? (
                                    <Image source={Asset} style={{ width: 220, height: 220 }} resizeMode="contain" />
                                ) : (
                                    React.createElement(Asset, { width: 220, height: 220 })
                                );
                            })()}
                        </View>

                        {insigniaSelecionada.adquirida && insigniaSelecionada.data_conquista ? (
                            <View style={styles.insigniaDatePill}>
                                <Text style={styles.insigniaDateText}>
                                    {formatInsigniaDate(insigniaSelecionada.data_conquista)}
                                </Text>
                            </View>
                        ) : (
                            <View style={[styles.insigniaDatePill, { backgroundColor: '#888' }]}>
                                <Text style={styles.insigniaDateText}>Bloqueada</Text>
                            </View>
                        )}

                        <Text style={styles.insigniaDescriptionText}>
                            Você {insigniaSelecionada.descricao.toLowerCase()} e alcançou a conquista{'\n'}
                            <Text style={styles.insigniaBoldText}>{insigniaSelecionada.titulo}!</Text>
                        </Text>
                    </View>
                )}
            </Modal>
        </View>
    );
}
