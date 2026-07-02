import React, {useCallback, useEffect, useLayoutEffect, useState} from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DateTimePicker from '@react-native-community/datetimepicker';
import {
  useFocusEffect,
  useIsFocused,
  useNavigation,
} from '@react-navigation/native';
import {launchImageLibrary} from 'react-native-image-picker';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';

import TranslationCard from '../../components/TranslationCard';
import {useAuth} from '../../contexts/AuthContext';
import {FavoritoItem} from '../../interfaces/FavoritoInterface';
import {HistoricoItem} from '../../interfaces/HistoricoInterface';
import {Insignia} from '../../interfaces/InsigniaInterface';
import {UsuarioPerfil} from '../../interfaces/ProfileInterface';
import {listarFavoritos, removerFavorito} from '../../services/FavoritoService';
import {listarHistorico, removerHistoricoItem} from '../../services/HistoricoService';
import {obterInsigniasUsuario} from '../../services/InsigniaService';
import {buscarMeuPerfil} from '../../services/ProfileService';
import api from '../../services/api';
import styles from './styles';

import insignia1 from '../../../assets/images/insignia1.svg';
import insignia2 from '../../../assets/images/insignia2.svg';
import insignia3 from '../../../assets/images/insignia3.svg';
import insignia4 from '../../../assets/images/insignia4.svg';

import ocultInsignia1 from '../../../assets/images/ocultInsignia1.svg';
import ocultInsignia2 from '../../../assets/images/ocultInsignia2.svg';
import ocultInsignia3 from '../../../assets/images/ocultInsignia3.svg';
import ocultInsignia4 from '../../../assets/images/ocultInsignia4.png';

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

const extrairLista = <T,>(response: any): T[] => {
  const lista = response?.dados ?? response?.data ?? response;
  return Array.isArray(lista) ? lista : [];
};

const extrairTexto = (valor: any): string => {
  if (!valor) {
    return '';
  }

  if (typeof valor === 'string') {
    return valor;
  }

  return valor.texto ?? valor.traducao ?? valor.resultado ?? valor.termo ?? '';
};

const formatToBirthdayMask = (text: string) => {
  const cleaned = text.replace(/\D/g, '').slice(0, 8);

  if (cleaned.length <= 2) {
    return cleaned;
  }

  if (cleaned.length <= 4) {
    return `${cleaned.substring(0, 2)}/${cleaned.substring(2)}`;
  }

  return `${cleaned.substring(0, 2)}/${cleaned.substring(
    2,
    4,
  )}/${cleaned.substring(4)}`;
};

const dbDateToDisplayDate = (dbDate?: string | null) => {
  if (!dbDate) {
    return '';
  }

  const datePart = dbDate.split('T')[0];
  const parts = datePart.split('-');

  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }

  return dbDate;
};

const displayDateToDbDate = (displayDate: string) => {
  if (!displayDate) {
    return '';
  }

  const parts = displayDate.split('/');

  if (parts.length === 3) {
    return `${parts[2]}-${parts[1]}-${parts[0]}`;
  }

  return displayDate;
};

const formatInsigniaDate = (isoString?: string | null) => {
  if (!isoString) {
    return '';
  }

  const datePart = isoString.split('T')[0];
  const parts = datePart.split('-');

  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }

  return isoString;
};

export default function Perfil() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const isFocused = useIsFocused();

  const auth = useAuth() as any;
  const user = auth?.user;
  const setUser = auth?.setUser;

  const [perfil, setPerfil] = useState<UsuarioPerfil | null>(null);
  const [historicoPreview, setHistoricoPreview] = useState<HistoricoItem[]>([]);
  const [favoritosPreview, setFavoritosPreview] = useState<FavoritoItem[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  const [insignias, setInsignias] = useState<Insignia[]>([]);
  const [totalAtividades, setTotalAtividades] = useState(0);
  const [loadingInsignias, setLoadingInsignias] = useState(false);
  const [insigniaSelecionada, setInsigniaSelecionada] =
    useState<Insignia | null>(null);
  const [insigniaModalVisible, setInsigniaModalVisible] = useState(false);

  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editNome, setEditNome] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editDataNascimento, setEditDataNascimento] = useState('');
  const [editFoto, setEditFoto] = useState<any>(null);
  const [updatingUser, setUpdatingUser] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);

  useLayoutEffect(() => {
    if (isFocused) {
      navigation.getParent()?.setOptions({headerShown: false});
    }
  }, [navigation, isFocused]);

  const carregarPerfil = useCallback(async () => {
    try {
      setErro(null);
      setCarregando(true);

      const [perfilResponse, historicoResponse, favoritosResponse] =
        await Promise.all([
          buscarMeuPerfil(),
          listarHistorico(5),
          listarFavoritos(5),
        ]);

      const dadosPerfil: UsuarioPerfil =
        perfilResponse?.dados || perfilResponse?.usuario || perfilResponse;

      setPerfil(dadosPerfil);

      if (dadosPerfil?.id && typeof setUser === 'function') {
        setUser((prev: any) => ({
          ...(prev || {}),
          ...dadosPerfil,
        }));
      }

      setHistoricoPreview(extrairLista<HistoricoItem>(historicoResponse));
      setFavoritosPreview(extrairLista<FavoritoItem>(favoritosResponse));
    } catch (error: any) {
      setErro(
        error?.response?.data?.erro || 'Não foi possível carregar o perfil.',
      );
    } finally {
      setCarregando(false);
    }
  }, [setUser]);

  const carregarInsignias = useCallback(async () => {
    if (!user?.id) {
      return;
    }

    try {
      setLoadingInsignias(true);

      const data = await obterInsigniasUsuario(user.id);

      setInsignias(Array.isArray(data?.insignias) ? data.insignias : []);
      setTotalAtividades(data?.total_atividades ?? 0);
    } catch (error) {
      console.error('Erro ao buscar insígnias:', error);
    } finally {
      setLoadingInsignias(false);
    }
  }, [user?.id]);

  useFocusEffect(
    useCallback(() => {
      carregarPerfil();
    }, [carregarPerfil]),
  );

  useEffect(() => {
    if (isFocused && user?.id) {
      carregarInsignias();
    }
  }, [carregarInsignias, isFocused, user?.id]);

  const getParsedDateForPicker = () => {
    if (editDataNascimento) {
      const parts = editDataNascimento.split('/');

      if (parts.length === 3) {
        const day = Number.parseInt(parts[0], 10);
        const month = Number.parseInt(parts[1], 10) - 1;
        const year = Number.parseInt(parts[2], 10);
        const dateObj = new Date(year, month, day);

        if (!Number.isNaN(dateObj.getTime())) {
          return dateObj;
        }
      }
    }

    return new Date();
  };

  const handleOpenEditModal = () => {
    const fotoAtual = (perfil as any)?.imagem_url || (perfil as any)?.foto || user?.imagem_url || user?.foto || null;

    setEditNome(perfil?.nome || user?.nome || '');
    setEditEmail(perfil?.email || user?.email || '');
    setEditFoto(fotoAtual);
    setEditDataNascimento(
      dbDateToDisplayDate(perfil?.data_nascimento || user?.data_nascimento || ''),
    );
    setEditModalVisible(true);
  };

  const handlePickPhoto = async () => {
    try {
      const res = await launchImageLibrary({mediaType: 'photo'});

      if (res.assets && res.assets.length > 0) {
        setEditFoto(res.assets[0]);
      }
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível selecionar a foto.');
    }
  };

  const handleSaveUser = async () => {
    const usuarioId = perfil?.id || user?.id;

    if (!usuarioId) {
      Alert.alert('Erro', 'Não foi possível identificar o usuário.');
      return;
    }

    if (!editNome.trim()) {
      Alert.alert('Erro', 'O nome é obrigatório.');
      return;
    }

    try {
      setUpdatingUser(true);

      let fotoUrl = (perfil as any)?.imagem_url || (perfil as any)?.foto || user?.imagem_url || user?.foto || '';

      if (editFoto && typeof editFoto === 'object' && editFoto.uri) {
        const formData = new FormData();

        formData.append('file', {
          uri: editFoto.uri,
          type: editFoto.type || 'image/jpeg',
          name: editFoto.fileName || 'avatar.jpg',
        } as any);

        const uploadRes = await api.post('/upload', formData, {
          headers: {'Content-Type': 'multipart/form-data'},
        });

        fotoUrl = uploadRes.data?.url || fotoUrl;
      } else if (editFoto === null) {
        fotoUrl = '';
      }

      const dbBirthDate = displayDateToDbDate(editDataNascimento);

      await api.put(`/usuarios/${usuarioId}`, {
        nome: editNome.trim(),
        email: editEmail.trim(),
        data_nascimento: dbBirthDate,
        imagem_url: fotoUrl,
      });

      const updatedUser = {
        ...(user || {}),
        id: usuarioId,
        nome: editNome.trim(),
        email: editEmail.trim(),
        data_nascimento: dbBirthDate,
        imagem_url: fotoUrl,
        foto: fotoUrl,
      };

      setPerfil(prev => ({...(prev || ({} as UsuarioPerfil)), ...updatedUser}));

      if (typeof setUser === 'function') {
        setUser(updatedUser);
      }

      await AsyncStorage.setItem('user', JSON.stringify(updatedUser));

      Alert.alert('Sucesso', 'Informações atualizadas com sucesso!');
      setEditModalVisible(false);
    } catch (error: any) {
      console.error('Erro ao atualizar usuário:', error);

      Alert.alert(
        'Erro',
        error?.response?.data?.erro ||
          'Não foi possível atualizar as informações. Tente novamente mais tarde.',
      );
    } finally {
      setUpdatingUser(false);
    }
  };

  const removerHistoricoLocal = async (item: HistoricoItem) => {
    try {
      await removerHistoricoItem(item.id);
      setHistoricoPreview(prev => prev.filter(h => h.id !== item.id));
    } catch (error: any) {
      Alert.alert(
        'Erro',
        error?.response?.data?.erro ||
          'Não foi possível remover o item do histórico.',
      );
    }
  };

  const removerFavoritoLocal = async (item: FavoritoItem) => {
    const itemAny = item as any;
    const traducaoId =
      itemAny?.traducao_id ??
      itemAny?.traducao?.id ??
      itemAny?.traducao?.traducao_id;

    if (!traducaoId) {
      Alert.alert('Erro', 'Não foi possível identificar a tradução favorita.');
      return;
    }

    try {
      await removerFavorito(traducaoId);
      setFavoritosPreview(prev => prev.filter(f => f.id !== item.id));
    } catch (error: any) {
      Alert.alert(
        'Erro',
        error?.response?.data?.erro ||
          'Não foi possível remover o favorito.',
      );
    }
  };

  const handlePressInsignia = (insignia: Insignia) => {
    setInsigniaSelecionada(insignia);
    setInsigniaModalVisible(true);
  };

  const nome = perfil?.nome || user?.nome || 'Nome do Usuário';
  const email = perfil?.email || user?.email || 'usuário@gmail.com';
  const foto = (perfil as any)?.imagem_url || (perfil as any)?.foto || user?.imagem_url || user?.foto;

  const insigniasConquistadas = insignias
    .filter(insignia => insignia.adquirida)
    .sort((a, b) => {
      const dateA = a.data_conquista
        ? new Date(a.data_conquista).getTime()
        : 0;
      const dateB = b.data_conquista
        ? new Date(b.data_conquista).getTime()
        : 0;

      return dateB - dateA;
    })
    .slice(0, 4);

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
            {foto ? (
              <Image
                source={{uri: foto}}
                style={{width: 100, height: 100, borderRadius: 50}}
              />
            ) : (
              <Icon name="person" size={60} color="#042d1f" />
            )}
          </View>

          <TouchableOpacity
            style={styles.editIconContainer}
            onPress={handleOpenEditModal}>
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
          <ActivityIndicator color="#042d1f" />
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
                {favoritosPreview.slice(0, 5).map(item => {
                  const itemAny = item as any;
                  const traducao = itemAny.traducao || {};

                  return (
                    <View key={item.id} style={{width: 300, marginRight: 12}}>
                      <TranslationCard
                        discurso={extrairTexto(
                          traducao.discurso ??
                            traducao.termo_pesquisado ??
                            itemAny.discurso,
                        )}
                        traducao={extrairTexto(
                          traducao.texto ??
                            traducao.traducao ??
                            itemAny.traducao_resultado,
                        )}
                        onDelete={() => removerFavoritoLocal(item)}
                      />
                    </View>
                  );
                })}
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
                  <View key={item.id} style={{width: 300, marginRight: 12}}>
                    <TranslationCard
                      discurso={extrairTexto((item as any).termo_pesquisado)}
                      traducao={extrairTexto((item as any).traducao_resultado)}
                      onDelete={() => removerHistoricoLocal(item)}
                    />
                  </View>
                ))}
              </ScrollView>
            )}

            <TouchableOpacity
              style={styles.sectionHeader}
              activeOpacity={0.7}
              onPress={() => navigation.navigate('Insignias')}>
              <Text style={styles.sectionTitle}>
                CONQUISTAS ({totalAtividades} {totalAtividades === 1 ? 'atividade concluída' : 'atividades concluídas'})
              </Text>
              <Icon name="chevron-forward" size={20} color="#000" />
            </TouchableOpacity>

            <View style={styles.achievementsContainer}>
              {loadingInsignias ? (
                <ActivityIndicator size="small" color="#042d1f" />
              ) : insigniasConquistadas.length === 0 ? (
                <Text
                  style={{
                    color: '#666',
                    fontSize: 14,
                    fontFamily: 'Inter',
                    fontStyle: 'italic',
                    paddingVertical: 10,
                  }}>
                  nenhuma insígnia desbloqueada
                </Text>
              ) : (
                insigniasConquistadas.map(insignia => {
                  const imageName = insignia.imagem || '';
                  const Asset = imageName ? ASSETS_INSIGNIAS[imageName] : null;
                  const isPng = imageName.endsWith('.png');

                  return (
                    <TouchableOpacity
                      key={insignia.id}
                      style={styles.achievementBadge}
                      onPress={() => handlePressInsignia(insignia)}
                      activeOpacity={0.7}>
                      <View style={styles.badgeImageWrapper}>
                        {imageName.startsWith('http') ? (
                          <Image
                            source={{uri: imageName}}
                            style={{width: 66, height: 66, borderRadius: 33}}
                            resizeMode="cover"
                          />
                        ) : Asset ? (
                          isPng ? (
                            <Image
                              source={Asset}
                              style={{width: 66, height: 66}}
                              resizeMode="contain"
                            />
                          ) : (
                            React.createElement(Asset, {
                              width: 66,
                              height: 66,
                            })
                          )
                        ) : null}
                      </View>

                      <Text style={styles.achievementText} numberOfLines={1}>
                        {insignia.titulo}
                      </Text>
                    </TouchableOpacity>
                  );
                })
              )}
            </View>
          </>
        )}
      </ScrollView>

      <Modal
        animationType="fade"
        transparent
        visible={editModalVisible}
        onRequestClose={() => setEditModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Editar Informações</Text>

              <TouchableOpacity onPress={() => setEditModalVisible(false)}>
                <Icon name="close-circle-outline" size={24} color="#333" />
              </TouchableOpacity>
            </View>

            <View style={{alignItems: 'center', marginBottom: 20}}>
              <TouchableOpacity
                onPress={handlePickPhoto}
                style={{position: 'relative'}}>
                <View
                  style={{
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
                      source={{
                        uri:
                          typeof editFoto === 'string'
                            ? editFoto
                            : editFoto.uri,
                      }}
                      style={{width: 80, height: 80, borderRadius: 40}}
                    />
                  ) : (
                    <Icon name="person" size={48} color="#042d1f" />
                  )}
                </View>

                <View
                  style={{
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

              <TouchableOpacity onPress={handlePickPhoto} style={{marginTop: 8}}>
                <Text
                  style={{fontSize: 13, color: '#042d1f', fontWeight: 'bold'}}>
                  Alterar Foto
                </Text>
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
            <View
              style={{
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
                style={{
                  flex: 1,
                  paddingVertical: 12,
                  fontSize: 15,
                  color: '#333',
                }}
                value={editDataNascimento}
                onChangeText={text =>
                  setEditDataNascimento(formatToBirthdayMask(text))
                }
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
                onChange={(_, selectedDate) => {
                  setShowDatePicker(false);

                  if (selectedDate) {
                    const day = String(selectedDate.getDate()).padStart(2, '0');
                    const month = String(selectedDate.getMonth() + 1).padStart(
                      2,
                      '0',
                    );
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
                disabled={updatingUser}>
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.saveButton}
                onPress={handleSaveUser}
                disabled={updatingUser}>
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
        onRequestClose={() => setInsigniaModalVisible(false)}>
        {insigniaSelecionada && (
          <View style={styles.insigniaModalContainer}>
            <TouchableOpacity
              style={styles.insigniaCloseButton}
              onPress={() => setInsigniaModalVisible(false)}>
              <Icon name="close-outline" size={32} color="#000" />
            </TouchableOpacity>

            <View style={styles.insigniaModalImageWrapper}>
              {(() => {
                const imageName = insigniaSelecionada.adquirida
                  ? insigniaSelecionada.imagem || ''
                  : insigniaSelecionada.imagem_bloqueada || '';

                if (imageName.startsWith('http')) {
                  return (
                    <Image
                      source={{uri: imageName}}
                      style={{width: 220, height: 220, borderRadius: 110}}
                      resizeMode="cover"
                    />
                  );
                }

                const Asset = imageName ? ASSETS_INSIGNIAS[imageName] : null;
                const isPng = imageName.endsWith('.png');

                if (!Asset) {
                  return null;
                }

                return isPng ? (
                  <Image
                    source={Asset}
                    style={{width: 220, height: 220}}
                    resizeMode="contain"
                  />
                ) : (
                  React.createElement(Asset, {
                    width: 220,
                    height: 220,
                  })
                );
              })()}
            </View>

            {insigniaSelecionada.adquirida &&
            insigniaSelecionada.data_conquista ? (
              <View style={styles.insigniaDatePill}>
                <Text style={styles.insigniaDateText}>
                  {formatInsigniaDate(insigniaSelecionada.data_conquista)}
                </Text>
              </View>
            ) : (
              <View style={[styles.insigniaDatePill, {backgroundColor: '#888'}]}>
                <Text style={styles.insigniaDateText}>Bloqueada</Text>
              </View>
            )}

            <Text style={styles.insigniaDescriptionText}>
              Você {insigniaSelecionada.descricao.toLowerCase()} e alcançou a
              conquista{'\n'}
              <Text style={styles.insigniaBoldText}>
                {insigniaSelecionada.titulo}!
              </Text>
            </Text>
          </View>
        )}
      </Modal>
    </View>
  );
}