import React, { useLayoutEffect, useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator, Alert, Image, Modal, TextInput, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useIsFocused } from '@react-navigation/native';
import React, {useCallback, useState} from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useFocusEffect, useNavigation} from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Ionicons';

import TranslationCard from '../../components/TranslationCard';
import {useAuth} from '../../contexts/AuthContext';
import {FavoritoItem} from '../../interfaces/FavoritoInterface';
import {HistoricoItem} from '../../interfaces/HistoricoInterface';
import {UsuarioPerfil} from '../../interfaces/ProfileInterface';
import {listarFavoritos, removerFavorito} from '../../services/FavoritoService';
import {listarHistorico, removerHistoricoItem} from '../../services/HistoricoService';
import {buscarMeuPerfil} from '../../services/ProfileService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { launchImageLibrary } from 'react-native-image-picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import styles from './styles';
import { useAuth } from "../../contexts/AuthContext";
import api from '../../services/api';

import insignia1 from '../../../assets/images/insignia1.svg';
import insignia2 from '../../../assets/images/insignia2.svg';
import insignia3 from '../../../assets/images/insignia3.svg';
import insignia4 from '../../../assets/images/insignia4.svg';

import ocultInsignia1 from '../../../assets/images/ocultInsignia1.svg';
import ocultInsignia2 from '../../../assets/images/ocultInsignia2.svg';
import ocultInsignia3 from '../../../assets/images/ocultInsignia3.svg';
import ocultInsignia4 from '../../../assets/images/ocultInsignia4.png'; // PNG

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

export default function Perfil() {
    const insets = useSafeAreaInsets();
    const navigation = useNavigation();
    const isFocused = useIsFocused();
    const { user, setUser } = useAuth();

    const [insignias, setInsignias] = useState<Insignia[]>([]);
    const [totalAtividades, setTotalAtividades] = useState(0);
    const [loading, setLoading] = useState(false);

    const [editModalVisible, setEditModalVisible] = useState(false);
    const [editNome, setEditNome] = useState('');
    const [editEmail, setEditEmail] = useState('');
    const [editDataNascimento, setEditDataNascimento] = useState('');
    const [editFoto, setEditFoto] = useState<any>(null);
    const [updatingUser, setUpdatingUser] = useState(false);
    const [showDatePicker, setShowDatePicker] = useState(false);

    const [insigniaSelecionada, setInsigniaSelecionada] = useState<Insignia | null>(null);
    const [insigniaModalVisible, setInsigniaModalVisible] = useState(false);

    const formatToBirthdayMask = (text: string) => {
        const cleaned = text.replace(/\D/g, '');
        let formatted = cleaned;
        if (cleaned.length > 2) {
            formatted = `${cleaned.substring(0, 2)}/${cleaned.substring(2, 4)}`;
        }
        if (cleaned.length > 4) {
            formatted = `${cleaned.substring(0, 2)}/${cleaned.substring(2, 4)}/${cleaned.substring(4, 8)}`;
        }
        return formatted;
    };

    const dbDateToDisplayDate = (dbDate: string) => {
        if (!dbDate) return '';
        const datePart = dbDate.split('T')[0];
        const parts = datePart.split('-');
        if (parts.length === 3) {
            return `${parts[2]}/${parts[1]}/${parts[0]}`;
        }
        return dbDate;
    };

    const displayDateToDbDate = (displayDate: string) => {
        if (!displayDate) return '';
        const parts = displayDate.split('/');
        if (parts.length === 3) {
            return `${parts[2]}-${parts[1]}-${parts[0]}`;
        }
        return displayDate;
    };

    const getParsedDateForPicker = () => {
        if (editDataNascimento) {
            const parts = editDataNascimento.split('/');
            if (parts.length === 3) {
                const day = parseInt(parts[0], 10);
                const month = parseInt(parts[1], 10) - 1;
                const year = parseInt(parts[2], 10);
                const dateObj = new Date(year, month, day);
                if (!isNaN(dateObj.getTime())) {
                    return dateObj;
                }
            }
        }
        return new Date();
    };

    const handleOpenEditModal = () => {
        setEditNome(user?.nome || '');
        setEditEmail(user?.email || '');
        setEditFoto(user?.foto || null);
        setEditDataNascimento(dbDateToDisplayDate(user?.data_nascimento || ''));
        setEditModalVisible(true);
    };

    const handlePickPhoto = async () => {
        const res = await launchImageLibrary({ mediaType: 'photo' });
        if (res.assets && res.assets.length > 0) {
            setEditFoto(res.assets[0]);
        }
    };

    const handleSaveUser = async () => {
        if (!user) return;
        if (!editNome.trim()) {
            Alert.alert('Erro', 'O nome é obrigatório.');
            return;
        }

        try {
            setUpdatingUser(true);
            let fotoUrl = user.foto || '';

            if (editFoto && typeof editFoto === 'object' && editFoto.uri) {
                const formData = new FormData();
                formData.append("file", {
                    uri: editFoto.uri,
                    type: editFoto.type || 'image/jpeg',
                    name: editFoto.fileName || 'avatar.jpg',
                } as any);

                const uploadRes = await api.post('/upload', formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
                fotoUrl = uploadRes.data.url;
            } else if (editFoto === null) {
                fotoUrl = '';
            }

            const dbBirthDate = displayDateToDbDate(editDataNascimento);

            await api.put(`/usuarios/${user.id}`, {
                nome: editNome,
                email: editEmail,
                data_nascimento: dbBirthDate,
                foto: fotoUrl,
            });

            const updatedUser: UserInterface = {
                id: user.id,
                perfil: user.perfil,
                nome: editNome,
                email: editEmail,
                data_nascimento: dbBirthDate,
                foto: fotoUrl,
            };
            setUser(updatedUser);
            await AsyncStorage.setItem('user', JSON.stringify(updatedUser));

            Alert.alert('Sucesso', 'Informações atualizadas com sucesso!');
            setEditModalVisible(false);
        } catch (error: any) {
            console.error('Erro ao atualizar usuário:', error);
            Alert.alert(
                'Erro',
                error.response?.data?.erro || 'Não foi possível atualizar as informações. Tente novamente mais tarde.'
            );
        } finally {
            setUpdatingUser(false);
        }
    };

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
            setTotalAtividades(data.total_atividades);
        } catch (error) {
            console.error('Erro ao buscar insígnias:', error);
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
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const {user, setUser} = useAuth();

  const [perfil, setPerfil] = useState<UsuarioPerfil | null>(null);
  const [historicoPreview, setHistoricoPreview] = useState<HistoricoItem[]>([]);
  const [favoritosPreview, setFavoritosPreview] = useState<FavoritoItem[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  const carregarPerfil = async () => {
    try {
      setErro(null);
      setCarregando(true);

      const [perfilResponse, historicoResponse, favoritosResponse] = await Promise.all([
        buscarMeuPerfil(),
        listarHistorico(5),
        listarFavoritos(5),
      ]);

      const dadosPerfil = perfilResponse.dados || perfilResponse.usuario || perfilResponse;

      setPerfil(dadosPerfil);

      if (dadosPerfil?.id) {
        setUser(prev => ({...(prev || {}), ...dadosPerfil} as any));
      }

      setHistoricoPreview(historicoResponse.dados || historicoResponse.data || []);
      setFavoritosPreview(favoritosResponse.dados || favoritosResponse.data || []);
    } catch (error: any) {
      setErro(error.response?.data?.erro || 'Não foi possível carregar o perfil.');
    } finally {
      setCarregando(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      carregarPerfil();
    }, []),
  );

  const removerHistoricoLocal = async (item: HistoricoItem) => {
    try {
      await removerHistoricoItem(item.id);
      setHistoricoPreview(prev => prev.filter(h => h.id !== item.id));
    } catch (error: any) {
      Alert.alert(
        'Erro',
        error.response?.data?.erro || 'Não foi possível remover o item do histórico.',
      );
    }
  };

  const removerFavoritoLocal = async (item: FavoritoItem) => {
    try {
      await removerFavorito(item.traducao_id);
      setFavoritosPreview(prev => prev.filter(f => f.id !== item.id));
    } catch (error: any) {
      Alert.alert(
        'Erro',
        error.response?.data?.erro || 'Não foi possível remover o favorito.',
      );
    }
  };

  const nome = perfil?.nome || user?.nome || 'Nome do Usuário';
  const email = perfil?.email || user?.email || 'usuário@gmail.com';

  return (
    <View style={styles.container}>
      <View style={[styles.header, {paddingTop: insets.top}]}>
        <TouchableOpacity
          style={[styles.settingsButton, {top: insets.top + 20}]}
          onPress={() => navigation.navigate('Configurations')}>
          <Icon name="settings" size={24} color="#fff" />
        </TouchableOpacity>

        <View style={styles.profileImageContainer}>
          <View style={styles.profileImagePlaceholder}>
                        {user?.foto ? (
                            <Image source={{ uri: user.foto }} style={{ width: 100, height: 100, borderRadius: 50 }} />
                        ) : (
                <Icon name="person" size={60} color="#042d1f" />
                        )}
          </View>

          <TouchableOpacity
            style={styles.editIconContainer} onPress={handleOpenEditModal}
            onPress={() => navigation.navigate('EditProfile')}>
            <Icon name="pencil" size={16} color="#000" />
          </TouchableOpacity>
        </View>

        <Text style={styles.userName}>{nome}</Text>
        <Text style={styles.userEmail}>{email}</Text>
      </View>

      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        {carregando ? (
          <ActivityIndicator />
        ) : erro ? (
          <Text style={styles.emptyText}>{erro}</Text>
        ) : (
          <>
            <TouchableOpacity
              style={styles.sectionHeader}
              activeOpacity={0.7}
              onPress={() => navigation.navigate('Favoritos')}>
              <Text style={styles.sectionTitle}>TRADUÇÕES FAVORITAS</Text>
              <Icon name="chevron-forward" size={20} color="#000" />
            </TouchableOpacity>

            {favoritosPreview.length === 0 ? (
              <Text style={styles.emptyText}>
                Você ainda não possui traduções favoritas.
              </Text>
            ) : (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={{marginBottom: 14}}
                contentContainerStyle={{paddingRight: 20}}>
                {favoritosPreview.slice(0, 5).map(item => (
                  <TranslationCard
                    key={item.id}
                    discurso={item.traducao?.discurso}
                    traducao={item.traducao?.texto}
                    onDelete={() => removerFavoritoLocal(item)}
                    style={{width: 300, height: 110, marginRight: 12, marginBottom: 0}}
                  />
                ))}
              </ScrollView>
            )}

            <TouchableOpacity
              style={styles.sectionHeader}
              activeOpacity={0.7}
              onPress={() => navigation.navigate('Historico')}>
              <Text style={styles.sectionTitle}>HISTÓRICO</Text>
              <Icon name="chevron-forward" size={20} color="#000" />
            </TouchableOpacity>

            {historicoPreview.length === 0 ? (
              <Text style={styles.emptyText}>
                Você ainda não possui histórico de traduções.
              </Text>
            ) : (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={{marginBottom: 14}}
                contentContainerStyle={{paddingRight: 20}}>
                {historicoPreview.slice(0, 5).map(item => (
                  <TranslationCard
                    key={item.id}
                    discurso={item.termo_pesquisado}
                    traducao={item.traducao_resultado}
                    onDelete={() => removerHistoricoLocal(item)}
                    style={{width: 300, height: 110, marginRight: 12, marginBottom: 0}}
                  />
                ))}
              </ScrollView>
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
                <View style={styles.achievementsContainer}>
                    {loading ? (
                        <ActivityIndicator size="small" color="#042d1f" />
                    ) : (
                        (() => {
                            const conquistadas = insignias
                                .filter(i => i.adquirida)
                                .sort((a, b) => {
                                    const dateA = a.data_conquista ? new Date(a.data_conquista).getTime() : 0;
                                    const dateB = b.data_conquista ? new Date(b.data_conquista).getTime() : 0;
                                    return dateB - dateA;
                                })
                                .slice(0, 4);
                            if (conquistadas.length === 0) {
                                return (
                                    <Text style={{ color: '#666', fontSize: 14, fontFamily: 'Inter', fontStyle: 'italic', paddingVertical: 10 }}>
                                        nenhuma insígnia desbloqueada
                                    </Text>
                                );
                            }
                            return conquistadas.map((insignia) => {
                                const imageName = insignia.imagem;
                                const Asset = ASSETS_INSIGNIAS[imageName];
                                const isPng = imageName.endsWith('.png');

                                return (
                                    <TouchableOpacity
                                        key={insignia.id}
                                        style={styles.achievementBadge}
                                        onPress={() => handlePressInsignia(insignia)}
                                        activeOpacity={0.7}
                                    >
                                        <View style={styles.badgeImageWrapper}>
                                            {imageName && imageName.startsWith('http') ? (
                                                <Image source={{ uri: imageName }} style={{ width: 66, height: 66, borderRadius: 33 }} resizeMode="cover" />
                                            ) : Asset ? (
                                                isPng ? (
                                                    <Image source={Asset} style={{ width: 66, height: 66 }} resizeMode="contain" />
                                                ) : (
                                                    React.createElement(Asset, { width: 66, height: 66 })
                                                )
                                            ) : null}
                                        </View>
                                        <Text style={styles.achievementText} numberOfLines={1}>
                                            {insignia.titulo}
                                        </Text>
                                    </TouchableOpacity>
                                );
                            });
                        })()
                    )}
                </View>
            </ScrollView>

            <Modal
                animationType="fade"
                transparent={true}
                visible={editModalVisible}
                onRequestClose={() => setEditModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Editar Informações</Text>
                            <TouchableOpacity onPress={() => setEditModalVisible(false)}>
                                <Icon name="close-circle-outline" size={24} color="#333" />
                            </TouchableOpacity>
                        </View>

                        <View style={{ alignItems: 'center', marginBottom: 20 }}>
                            <TouchableOpacity onPress={handlePickPhoto} style={{ position: 'relative' }}>
                                <View style={{
                                    width: 80,
                                    height: 80,
                                    borderRadius: 40,
                                    backgroundColor: '#EAEAEA',
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                    overflow: 'hidden',
                                    borderWidth: 2,
                                    borderColor: '#042d1f',
                                }}>
                                    {editFoto ? (
                                        <Image
                                            source={{ uri: typeof editFoto === 'string' ? editFoto : editFoto.uri }}
                                            style={{ width: 80, height: 80, borderRadius: 40 }}
                                        />
                                    ) : (
                                        <Icon name="person" size={48} color="#042d1f" />
                                    )}
                                </View>
                                <View style={{
                                    position: 'absolute',
                                    bottom: 0,
                                    right: 0,
                                    backgroundColor: '#A3C68C',
                                    width: 24,
                                    height: 24,
                                    borderRadius: 12,
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                    borderWidth: 1.5,
                                    borderColor: '#fff',
                                }}>
                                    <Icon name="camera" size={12} color="#000" />
                                </View>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={handlePickPhoto} style={{ marginTop: 8 }}>
                                <Text style={{ fontSize: 13, color: '#042d1f', fontWeight: 'bold' }}>Alterar Foto</Text>
                            </TouchableOpacity>
                        </View>

                        <Text style={styles.inputLabel}>Nome</Text>
                        <TextInput
                            style={styles.textInput}
                            value={editNome}
                            onChangeText={setEditNome}
                            placeholder="Seu nome"
                        />

                        <Text style={styles.inputLabel}>Email</Text>
                        <TextInput
                            style={styles.textInput}
                            value={editEmail}
                            onChangeText={setEditEmail}
                            placeholder="Seu email"
                            keyboardType="email-address"
                            autoCapitalize="none"
                        />

                        <Text style={styles.inputLabel}>Data de Nascimento</Text>
                        <View style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            backgroundColor: '#f9f9f9',
                            borderWidth: 1,
                            borderColor: '#e0e0e0',
                            borderRadius: 10,
                            paddingHorizontal: 15,
                            marginBottom: 15,
                        }}>
                            <TextInput
                                style={{ flex: 1, paddingVertical: 12, fontSize: 15, color: '#333' }}
                                value={editDataNascimento}
                                onChangeText={(text) => setEditDataNascimento(formatToBirthdayMask(text))}
                                placeholder="DD/MM/AAAA"
                                keyboardType="numeric"
                                maxLength={10}
                            />
                            <TouchableOpacity onPress={() => setShowDatePicker(true)}>
                                <Icon name="calendar-outline" size={20} color="#042d1f" />
                            </TouchableOpacity>
                        </View>

                        {showDatePicker && (
                            <DateTimePicker
                                value={getParsedDateForPicker()}
                                mode="date"
                                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                                locale="pt-BR"
                                onChange={(event, selectedDate) => {
                                    setShowDatePicker(false);
                                    if (selectedDate) {
                                        const day = String(selectedDate.getDate()).padStart(2, '0');
                                        const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
                                        const year = selectedDate.getFullYear();
                                        setEditDataNascimento(`${day}/${month}/${year}`);
                                    }
                                }}
                            />
                        )}

                        <View style={styles.modalButtonsContainer}>
                            <TouchableOpacity
                                style={styles.cancelButton}
                                onPress={() => setEditModalVisible(false)}
                                disabled={updatingUser}
                            >
                                <Text style={styles.cancelButtonText}>Cancelar</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.saveButton}
                                onPress={handleSaveUser}
                                disabled={updatingUser}
                            >
                                {updatingUser ? (
                                    <ActivityIndicator size="small" color="#fff" />
                                ) : (
                                    <Text style={styles.saveButtonText}>Salvar</Text>
                                )}
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

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