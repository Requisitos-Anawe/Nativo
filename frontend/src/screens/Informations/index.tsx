import React, { useLayoutEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useIsFocused } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Ionicons';
import styles from './styles';
import DownloadFile from '../../components/DownloadFile';

// Imagens
import AldeiaVetorizado from '../../../assets/images/aldeiaVetorizado.svg';

export default function Informations() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const isFocused = useIsFocused();

  useLayoutEffect(() => {
    if (isFocused) {
      navigation.getParent()?.setOptions({ headerShown: false });
    }
  }, [navigation, isFocused]);

  return (
    <View style={styles.container}>
      {/* Header Fixo no Topo */}
      <View style={[styles.header, { paddingTop: insets.top + 20 }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Icon name="arrow-back-outline" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Informações</Text>
      </View>

      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.welcomeTitle}>Olá, bem vindo ao Nativo!</Text>

        <TouchableOpacity
          style={styles.downloadCard}
          activeOpacity={0.8}
          onPress={() => DownloadFile('manual', 'https://drive.google.com/uc?export=download&id=176jdwMj0g_sQptlPF0SDREApmtjs82Jl')}
        >
          <View style={styles.downloadIconCircle}>
            <Icon name="download-outline" size={24} color="#042d1f" />
          </View>
          <View style={styles.downloadTextContainer}>
            <Text style={styles.downloadTitle}>Baixar manual do aplicativo</Text>
            <Text style={styles.downloadSubtitle}>Guia completo para aproveitar todos os recursos do Nativo</Text>
          </View>
          <Icon name="chevron-forward-outline" size={20} color="#fff" style={styles.downloadArrow} />
        </TouchableOpacity>

        {/* Card: Sobre o aplicativo */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.cardIconCircle}>
              <Icon name="phone-portrait-outline" size={20} color="#fff" />
            </View>
            <Text style={styles.cardTitle}>Sobre o aplicativo</Text>
          </View>
          <Text style={styles.cardText}>
            O aplicativo teve origem a partir de um Trabalho de Conclusão de Curso (TCC) da Universidade de Brasília (UnB), desenvolvido pela estudante Alexia Cardoso do curso de Engenharia de Software. O projeto foi orientado pelo professor Dr. Sergio Freitas e contou com a coorientação da professora Dra. Célia Higawa.
          </Text>
          <Text style={styles.cardText}>
            Tem como propósito contribuir com a preservação e o ensino das línguas indígenas brasileiras. A ferramenta permite realizar traduções escritas de palavras e expressões entre o português e línguas indígenas, com foco inicial na língua Munduruku.
          </Text>
          <Text style={styles.cardText}>
            O projeto prevê futuras melhorias, como a inclusão de áudios, imagens e novos idiomas, sempre priorizando a valorização das línguas indígenas e sua continuidade.
          </Text>
        </View>

        {/* Card: Sobre a aldeia */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.cardIconCircle}>
              <Icon name="home-outline" size={20} color="#fff" />
            </View>
            <Text style={styles.cardTitle}>Sobre a aldeia</Text>
          </View>
          <Text style={styles.cardText}>
            Este trabalho começou a partir do contato da professora Celia Kinuko Matsunaga Higawa, da Universidade de Brasília, com a Aldeia Munduruku de Bragança, a Aldeia demonstrou interesse em ter um aplicativo para ajudar na consulta e ensino da língua Munduruku.
          </Text>
          <Text style={styles.cardText}>
            Conversando com os representantes da comunidade, foi definido que o aplicativo teria o formato de um tradutor, que pudesse ser usado no dia a dia para consultar palavras e frases, além de possibilitar ouvir a pronúncia correta delas (implementação futura).
          </Text>
        </View>

        {/* Imagem Vetorial no Fim */}
        <View style={styles.svgBackground}>
          <AldeiaVetorizado width="100%" height="100%" />
        </View>
      </ScrollView>
    </View>
  );
}
