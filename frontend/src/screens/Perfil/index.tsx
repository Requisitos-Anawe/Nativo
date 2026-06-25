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
import styles from './styles';

export default function Perfil() {
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
            <Icon name="person" size={60} color="#042d1f" />
          </View>

          <TouchableOpacity
            style={styles.editIconContainer}
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
                    style={{width: 300, marginRight: 12, marginBottom: 0}}
                  />
                ))}
              </ScrollView>
            )}

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
                    style={{width: 300, marginRight: 12, marginBottom: 0}}
                  />
                ))}
              </ScrollView>
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}