import React, { useState, useEffect, useRef } from 'react';
import { Text, TouchableOpacity, View, ScrollView, Switch, Alert, ActivityIndicator, Modal, Linking } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Icon from "react-native-vector-icons/Ionicons";
import MaterialIcon from "react-native-vector-icons/MaterialIcons";

import { useAuth } from "../../contexts/AuthContext";
import DownloadFile from "../../components/DownloadFile";
import styles from "./styles";
import { SyncOfflineService } from '../../services/SyncOfflineService';

export default function Configurations() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { user, setUser } = useAuth();
  const [offlineAccess, setOfflineAccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [tamanhoDownload, setTamanhoDownload] = useState("0.00");
  const [downloadProgress, setDownloadProgress] = useState(0);
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    const loadOfflineState = async () => {
      try {
        const key = user?.id ? `offline_access_${user.id}` : 'offline_access';
        const value = await AsyncStorage.getItem(key);
        if (value !== null) {
          setOfflineAccess(value === 'true');
        } else {
          setOfflineAccess(false);
        }
      } catch (e) {
        console.log('Erro ao carregar estado offline:', e);
      }
    };
    loadOfflineState();
  }, [user]);

  const sincronizarBancoLocal = async () => {
    const token = await AsyncStorage.getItem('token');
    if (!token) throw new Error("Usuário não autenticado");
    abortControllerRef.current = new AbortController();
    await SyncOfflineService.prepararSincronizacao();
    await SyncOfflineService.iniciarDownload(
      (progresso) => setDownloadProgress(progresso),
      abortControllerRef.current.signal
    );
  };

  const cancelarDownload = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  };

  const handleDownload = async () => {
    try {
      setIsDownloading(true);
      const tamanho = await SyncOfflineService.prepararSincronizacao();
      setTamanhoDownload(tamanho);
      setIsDownloading(false);
      const titulo = offlineAccess ? "Atualizar Acervo" : "Baixar Acervo Offline";
      const mensagem = offlineAccess
        ? `Deseja substituir os dados locais pelas traduções mais recentes do servidor?\n\nTamanho do download: ${tamanho} MB`
        : `Deseja baixar os dados para acessar sem internet? Isso consumirá espaço no seu dispositivo.\n\nTamanho do download: ${tamanho} MB`;

      Alert.alert(titulo, mensagem, [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Baixar",
          onPress: async () => {
            try {
              setIsLoading(true);
              setDownloadProgress(0);
              await sincronizarBancoLocal();
              const key = user?.id ? `offline_access_${user.id}` : 'offline_access';
              await AsyncStorage.setItem(key, 'true');
              setOfflineAccess(true);
              setTimeout(() => {
                Alert.alert("Sucesso", "Banco de traduções atualizado com sucesso!");
              }, 500);

            } catch (error: any) {
              if (error.name === 'CanceledError' || error.message === 'canceled') {
                setTimeout(() => {
                  Alert.alert("Cancelado", "O download foi interrompido.");
                }, 500);
              } else {
                console.log('Erro na sincronização:', error);
                setTimeout(() => {
                  Alert.alert("Erro", "Não foi possível conectar ao servidor. Verifique sua conexão e tente novamente.");
                }, 500);
              }
            } finally {
              setIsLoading(false);
              setDownloadProgress(0);
              abortControllerRef.current = null;
            }
          }
        }
      ]);
    } catch (error: any) {
      setIsLoading(false);
      if (error.message === 'ESPACO_INSUFICIENTE') {
        Alert.alert("Erro de Espaço", "Seu dispositivo não tem espaço livre suficiente para armazenar o acervo.");
      } else {
        console.log('Erro ao verificar tamanho:', error);
        Alert.alert("Erro", "Não foi possível verificar os dados com o servidor. Verifique sua conexão.");
      }
    }
  };

  const handleLogout = async () => {
    try {
      await AsyncStorage.removeItem('token');
      await AsyncStorage.removeItem('user');
      setUser(null);
    } catch (error) {
      console.log('Erro ao fazer logout:', error);
    }
  };

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 20 }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Icon name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Configurações</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.card}>
          <View style={styles.cardLeft}>
            <View style={[styles.iconContainer, { backgroundColor: '#e8f0fe' }]}>
              <MaterialIcon name="signal-wifi-off" size={22} color="#1a73e8" />
            </View>
            <Text style={styles.cardText}>
              {offlineAccess ? "Atualizar tradução-offline" : "Baixar tradução off-line"}
            </Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            {isLoading ? (
              <ActivityIndicator size="small" color="#1a73e8" style={{ marginRight: 10 }} />
            ) : (
              <TouchableOpacity
                onPress={handleDownload}
                style={{ padding: 4 }}
                hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
                testID="download-acervo-button"
              >
                <Icon
                  name="cloud-download-outline"
                  size={26}
                  color={offlineAccess ? "#1a73e8" : "#042d1f"}
                />
              </TouchableOpacity>
            )}
          </View>
        </View>

        <TouchableOpacity
          style={styles.card}
          activeOpacity={0.7}
          onPress={async () => {
            try {
              await Linking.openURL('https://drive.google.com/file/d/1V74rvGWG31ek6fx51rP64viIYK8vtvnk/view?usp=sharing');
            } catch (error) {
              Alert.alert('Erro', 'Não foi possível abrir os termos de uso.');
            }
          }}
        >
          <View style={styles.cardLeft}>
            <View style={[styles.iconContainer, { backgroundColor: '#e8f5e9' }]}>
              <Icon name="document-text-outline" size={22} color="#042d1f" />
            </View>
            <Text style={styles.cardText}>Termos de Uso e Privacidade</Text>
          </View>
          <Icon name="chevron-forward" size={20} color="#777" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.card}
          activeOpacity={0.7}
          onPress={handleLogout}
        >
          <View style={styles.cardLeft}>
            <View style={[styles.iconContainer, { backgroundColor: '#ffebee' }]}>
              <Icon name="log-out-outline" size={22} color="#c62828" />
            </View>
            <Text style={[styles.cardText, { color: '#c62828' }]}>Sair da Conta</Text>
          </View>
          <Icon name="chevron-forward" size={20} color="#c62828" />
        </TouchableOpacity>
      </ScrollView>
      <Modal
        transparent={true}
        visible={isLoading}
        animationType="fade"
      >
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0, 0, 0, 0.6)' }}>
          <View style={{ width: '80%', backgroundColor: '#fff', borderRadius: 12, padding: 24, alignItems: 'center', elevation: 5 }}>

            <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#333', marginBottom: 20 }}>
              Baixando Acervo...
            </Text>
            <View style={{ width: '100%', height: 8, backgroundColor: '#e0e0e0', borderRadius: 4, overflow: 'hidden', marginBottom: 12 }}>

              <View testID="download-progress-bar" style={{ width: `${downloadProgress}%`, height: '100%', backgroundColor: '#1a73e8' }} />
            </View>
            <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#1a73e8', marginBottom: 24 }}>
              {downloadProgress}%
            </Text>
            <TouchableOpacity
              onPress={cancelarDownload}
              style={{ width: '100%', paddingVertical: 12, backgroundColor: '#ffebee', borderRadius: 8, alignItems: 'center' }}
            >
              <Text style={{ color: '#c62828', fontWeight: 'bold', fontSize: 16 }}>Cancelar</Text>
            </TouchableOpacity>

          </View>
        </View>
      </Modal>
    </View>
  );
}