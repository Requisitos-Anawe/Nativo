import React, {useCallback, useState} from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import {useFocusEffect, useNavigation} from '@react-navigation/native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';

import TranslationCard from '../../components/TranslationCard';
import {FavoritoItem} from '../../interfaces/FavoritoInterface';
import {listarFavoritos, removerFavorito} from '../../services/FavoritoService';
import styles from './styles';

export default function FavoritosScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();

  const [favoritos, setFavoritos] = useState<FavoritoItem[]>([]);
  const [busca, setBusca] = useState('');
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  const carregarFavoritos = async () => {
    try {
      setErro(null);
      setCarregando(true);
      const response = await listarFavoritos(100);
      setFavoritos(response.dados || response.data || []);
    } catch (error: any) {
      setErro(error.response?.data?.erro || 'Erro ao listar favoritos.');
    } finally {
      setCarregando(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      carregarFavoritos();
    }, []),
  );

  const remover = async (item: FavoritoItem) => {
    try {
      await removerFavorito(item.traducao_id);
      setFavoritos(prev => prev.filter(favorito => favorito.id !== item.id));
    } catch (error: any) {
      Alert.alert(
        'Erro',
        error.response?.data?.erro || 'Não foi possível remover o favorito.',
      );
    }
  };

  const termoBusca = busca.trim().toLowerCase();
  const favoritosFiltrados = favoritos.filter(item => {
    const discurso = item.traducao?.discurso?.toLowerCase() || '';
    const texto = item.traducao?.texto?.toLowerCase() || '';
    return !termoBusca || discurso.includes(termoBusca) || texto.includes(termoBusca);
  });

  return (
    <View style={styles.container}>
      <View style={[styles.header, {paddingTop: insets.top + 12}]}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Icon name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Favoritos</Text>
        <Text style={styles.headerSubtitle}>Veja suas traduções favoritas</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.searchBox}>
          <Icon name="search-outline" size={18} color="#555" />
          <TextInput
            value={busca}
            onChangeText={setBusca}
            placeholder="Buscar por discurso"
            placeholderTextColor="#777"
            style={styles.searchInput}
          />
        </View>

        {carregando ? (
          <ActivityIndicator />
        ) : erro ? (
          <Text style={styles.emptyText}>{erro}</Text>
        ) : favoritos.length === 0 ? (
          <Text style={styles.emptyText}>Você ainda não possui traduções favoritas.</Text>
        ) : favoritosFiltrados.length === 0 ? (
          <Text style={styles.emptyText}>Nenhuma tradução favorita encontrada para essa busca.</Text>
        ) : (
          favoritosFiltrados.map(item => (
            <TranslationCard
              key={item.id}
              discurso={item.traducao?.discurso}
              traducao={item.traducao?.texto}
              onDelete={() => remover(item)}
            />
          ))
        )}
      </ScrollView>
    </View>
  );
}
