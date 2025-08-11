import React from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface MenuModalProps {
  visible: boolean;
  onClose: () => void;
  onLogout: () => void;
}

export default function MenuModal({ visible, onClose, onLogout }: MenuModalProps) {
  const navigation = useNavigation<NativeStackNavigationProp<any>>();

  const handleNavigate = (screen: string) => {
    onClose();
    navigation.navigate(screen);
  };

  const handleLogOut = async () => {
    await AsyncStorage.removeItem('token');
    onLogout();
  };

  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableOpacity style={styles.overlay} onPress={onClose}>
        <View style={styles.menu}>
          <TouchableOpacity onPress={() => handleNavigate('Perfil')}>
            <Text style={styles.menuItem}>Perfil</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => handleLogOut()}>
            <Text style={styles.menuItem}>Sair</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'flex-end',
  },
  menu: {
    backgroundColor: '#fff',
    padding: 20,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  menuItem: {
    fontSize: 18,
    paddingVertical: 10,
  },
});
