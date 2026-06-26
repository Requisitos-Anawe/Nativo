import React, { useState } from 'react';
import { View, Text, TouchableOpacity, SafeAreaView, StyleSheet } from 'react-native';
import UsuariosTab from './UsuariosTab.tsx';
    
export default function AdminScreen() {
  const [abaAtiva, setAbaAtiva] = useState<'usuarios' | 'denuncias'>('usuarios');

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Administração</Text>
      </View>

      <View style={styles.tabContainer}>
        <TouchableOpacity 
          style={[styles.tab, abaAtiva === 'usuarios' && styles.tabAtiva]}
          onPress={() => setAbaAtiva('usuarios')}
        >
          <Text style={[styles.tabText, abaAtiva === 'usuarios' && styles.tabTextAtivo]}>Gestão de Acessos</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.tab, abaAtiva === 'denuncias' && styles.tabAtiva]}
          onPress={() => setAbaAtiva('denuncias')}
        >
          <Text style={[styles.tabText, abaAtiva === 'denuncias' && styles.tabTextAtivo]}>Denúncias</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        {abaAtiva === 'usuarios' ? (
          <UsuariosTab />
        ) : (
          <View style={styles.placeholder} />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
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
  title: { fontSize: 30, fontWeight: 'bold', color: '#fff' },
  subtitle: { fontSize: 14, color: '#a0a0a0', marginTop: 5 },
  tabContainer: { flexDirection: 'row', marginHorizontal: 20, marginTop: 16, backgroundColor: '#e0e0e0', borderRadius: 10, overflow: 'hidden' },
  tab: { flex: 1, paddingVertical: 12, alignItems: 'center' },
  tabAtiva: { backgroundColor: '#042d1f' },
  tabText: { fontWeight: '600', color: '#666' },
  tabTextAtivo: { color: '#fff' },
  content: { flex: 1, padding: 20 },
  placeholder: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  placeholderText: { color: '#888', fontSize: 16 }
});