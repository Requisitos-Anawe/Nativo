import React, { useState, useEffect } from 'react';
import { Text, TouchableOpacity, View, ScrollView, Switch } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Icon from "react-native-vector-icons/Ionicons";

import { useAuth } from "../../contexts/AuthContext";
import DownloadFile from "../../components/DownloadFile";
import styles from "./styles";

export default function Configurations() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { setUser } = useAuth();
  const [offlineAccess, setOfflineAccess] = useState(false);

  useEffect(() => {
    const loadOfflineState = async () => {
      try {
        const value = await AsyncStorage.getItem('offline_access');
        if (value !== null) {
          setOfflineAccess(value === 'true');
        }
      } catch (e) {
        console.log('Erro ao carregar estado offline:', e);
      }
    };
    loadOfflineState();
  }, []);

  const toggleOfflineAccess = async (value: boolean) => {
    try {
      setOfflineAccess(value);
      await AsyncStorage.setItem('offline_access', String(value));
    } catch (e) {
      console.log('Erro ao salvar estado offline:', e);
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
              <Icon name="cloud-offline-outline" size={22} color="#1a73e8" />
            </View>
            <Text style={styles.cardText}>Acesso Offline</Text>
          </View>
          <Switch
            trackColor={{ false: '#dcdcdc', true: '#042d1f' }}
            thumbColor={offlineAccess ? '#fff' : '#f4f4f4'}
            ios_backgroundColor="#dcdcdc"
            onValueChange={toggleOfflineAccess}
            value={offlineAccess}
          />
        </View>

        <TouchableOpacity
          style={styles.card}
          activeOpacity={0.7}
          onPress={() => DownloadFile('termo-uso', 'https://drive.google.com/uc?export=download&id=1V74rvGWG31ek6fx51rP64viIYK8vtvnk')}
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
    </View>
  );
}