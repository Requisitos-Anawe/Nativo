import React, {useCallback, useState} from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {useFocusEffect, useNavigation} from '@react-navigation/native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';

import TranslationCard from '../../components/TranslationCard';
import {HistoricoItem} from '../../interfaces/HistoricoInterface';
import {listarHistorico, removerHistoricoItem} from '../../services/HistoricoService';
import styles from './styles';

export default function HistoricoScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();

  const [historico, setHistorico] = useState<HistoricoItem[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  const carregarHistorico = async () => {
    try {
      setErro(null);
      setCarregando(true);
      const response = await listarHistorico(50);
      setHistorico(response.dados || response.data || []);
    } catch (error: any) {
      setErro(error.response?.data?.erro || 'Erro ao listar histórico.');
    } finally {
      setCarregando(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      carregarHistorico();
    }, []),
  );

  const remover = async (item: HistoricoItem) => {
    try {
      await removerHistoricoItem(item.id);
      setHistorico(prev => prev.filter(h => h.id !== item.id));
    } catch (error: any) {
      Alert.alert(
        'Erro',
        error.response?.data?.erro || 'Não foi possível remover o item do histórico.',
      );
    }
  };

  return (
    <View style={styles.container}>
      <View style={[styles.header, {paddingTop: insets.top + 20}]}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Icon name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Histórico</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {carregando ? (
          <ActivityIndicator />
        ) : erro ? (
          <Text style={styles.emptyText}>{erro}</Text>
        ) : historico.length === 0 ? (
          <Text style={styles.emptyText}>Você ainda não possui histórico de traduções.</Text>
        ) : (
          historico.map(item => (
            <TranslationCard
              key={item.id}
              discurso={item.termo_pesquisado}
              traducao={item.traducao_resultado}
              onDelete={() => remover(item)}
            />
          ))
        )}
      </ScrollView>
    </View>
  );
}
