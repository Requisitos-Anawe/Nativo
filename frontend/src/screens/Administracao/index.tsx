import React from 'react';
import { View, Text, SafeAreaView, StyleSheet } from 'react-native';
import UsuariosTab from './UsuariosTab';
    
export default function AdminScreen() {
  return (
    <SafeAreaView style={styles.container}>
      {/* CABEÇALHO */}
      <View style={styles.header}>
        <Text style={styles.title}>Administração</Text>
      </View>

      {/* CONTEÚDO PRINCIPAL (Carrega direto a sua tela de Gestão) */}
      <View style={styles.content}>
        <UsuariosTab />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#f5f5f5' 
  },
  header: {
    minHeight: 130,
    paddingTop: 26,
    paddingBottom: 26,
    paddingHorizontal: 20,
    justifyContent: 'flex-end',
    backgroundColor: '#042d1f',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  title: { 
    fontSize: 30, 
    fontWeight: 'bold', 
    color: '#fff' 
  },
  content: { 
    flex: 1, 
    padding: 20,
    paddingTop: 16 // Um pequeno espaçamento extra no topo para compensar a saída dos botões
  }
});