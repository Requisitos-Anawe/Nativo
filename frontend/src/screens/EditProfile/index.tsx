import React, {useCallback, useState} from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import {useFocusEffect, useNavigation} from '@react-navigation/native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';

import {useAuth} from '../../contexts/AuthContext';
import {UsuarioPerfil} from '../../interfaces/ProfileInterface';
import {atualizarUsuario, buscarMeuPerfil} from '../../services/ProfileService';
import styles from './styles';

type FormState = {
  nome: string;
  email: string;
  data_nascimento: string;
  senha: string;
  confirmarSenha: string;
};

const normalizarData = (valor?: string | null) => {
  if (!valor) {
    return '';
  }

  return valor.split('T')[0];
};

export default function EditProfileScreen() {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const auth = useAuth() as any;
  const user = auth?.user;
  const setUser = auth?.setUser;

  const [perfil, setPerfil] = useState<UsuarioPerfil | null>(null);
  const [form, setForm] = useState<FormState>({
    nome: '',
    email: '',
    data_nascimento: '',
    senha: '',
    confirmarSenha: '',
  });
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const carregarPerfil = useCallback(async () => {
    try {
      setErro(null);
      setCarregando(true);

      const response: any = await buscarMeuPerfil();
      const dados: UsuarioPerfil = response?.dados || response?.usuario || response;

      setPerfil(dados);
      setForm({
        nome: dados?.nome || '',
        email: dados?.email || '',
        data_nascimento: normalizarData(dados?.data_nascimento),
        senha: '',
        confirmarSenha: '',
      });
    } catch (error: any) {
      setErro(error?.response?.data?.erro || 'Não foi possível carregar seus dados.');
    } finally {
      setCarregando(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      carregarPerfil();
    }, [carregarPerfil]),
  );

  const atualizarCampo = (campo: keyof FormState, valor: string) => {
    setForm(prev => ({...prev, [campo]: valor}));
  };

  const validarFormulario = () => {
    const email = form.email.trim();
    const dataNascimento = form.data_nascimento.trim();

    if (!form.nome.trim()) {
      Alert.alert('Erro', 'O nome é obrigatório.');
      return false;
    }

    if (email && !/^\S+@\S+\.\S+$/.test(email)) {
      Alert.alert('Erro', 'Informe um e-mail válido.');
      return false;
    }

    if (dataNascimento && !/^\d{4}-\d{2}-\d{2}$/.test(dataNascimento)) {
      Alert.alert('Erro', 'Informe a data no formato AAAA-MM-DD.');
      return false;
    }

    if (form.senha || form.confirmarSenha) {
      if (form.senha.length < 8) {
        Alert.alert('Erro', 'A senha deve ter pelo menos 8 caracteres.');
        return false;
      }

      if (form.senha !== form.confirmarSenha) {
        Alert.alert('Erro', 'A confirmação de senha não confere.');
        return false;
      }
    }

    return true;
  };

  const salvarPerfil = async () => {
    const usuarioId = perfil?.id || user?.id;

    if (!usuarioId) {
      Alert.alert('Erro', 'Não foi possível identificar o usuário logado.');
      return;
    }

    if (!validarFormulario()) {
      return;
    }

    const payload: {
      nome: string;
      email?: string;
      data_nascimento?: string;
      senha?: string;
    } = {
      nome: form.nome.trim(),
    };

    if (form.email.trim()) {
      payload.email = form.email.trim();
    }

    if (form.data_nascimento.trim()) {
      payload.data_nascimento = form.data_nascimento.trim();
    }

    if (form.senha) {
      payload.senha = form.senha;
    }

    try {
      setSalvando(true);

      const response: any = await atualizarUsuario(usuarioId, payload);
      const dadosAtualizados: UsuarioPerfil = response?.dados || response?.usuario || response;

      if (dadosAtualizados) {
        setPerfil(prev => ({...(prev || ({} as UsuarioPerfil)), ...dadosAtualizados}));

        if (typeof setUser === 'function') {
          setUser((prev: any) => ({...(prev || {}), ...dadosAtualizados}));
        }
      }

      Alert.alert('Sucesso', 'Perfil atualizado com sucesso.', [
        {text: 'OK', onPress: () => navigation.goBack()},
      ]);
    } catch (error: any) {
      Alert.alert(
        'Erro',
        error?.response?.data?.erro || 'Não foi possível atualizar o perfil.',
      );
    } finally {
      setSalvando(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={[styles.header, {paddingTop: insets.top + 20}]}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Icon name="arrow-back" size={28} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Editar Perfil</Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled">
        {carregando ? (
          <ActivityIndicator size="large" color="#042d1f" />
        ) : erro ? (
          <Text style={styles.errorText}>{erro}</Text>
        ) : (
          <>
            <Text style={styles.label}>Nome</Text>
            <TextInput
              style={styles.input}
              value={form.nome}
              onChangeText={valor => atualizarCampo('nome', valor)}
              placeholder="Digite seu nome"
              placeholderTextColor="#777"
            />

            <Text style={styles.label}>E-mail</Text>
            <TextInput
              style={styles.input}
              value={form.email}
              onChangeText={valor => atualizarCampo('email', valor)}
              placeholder="Digite seu e-mail"
              placeholderTextColor="#777"
              keyboardType="email-address"
              autoCapitalize="none"
            />

            <Text style={styles.label}>Data de nascimento</Text>
            <TextInput
              style={styles.input}
              value={form.data_nascimento}
              onChangeText={valor => atualizarCampo('data_nascimento', valor)}
              placeholder="AAAA-MM-DD"
              placeholderTextColor="#777"
            />

            <Text style={styles.label}>Nova senha</Text>
            <TextInput
              style={styles.input}
              value={form.senha}
              onChangeText={valor => atualizarCampo('senha', valor)}
              placeholder="Deixe em branco para não alterar"
              placeholderTextColor="#777"
              secureTextEntry
            />

            <Text style={styles.label}>Confirmar nova senha</Text>
            <TextInput
              style={styles.input}
              value={form.confirmarSenha}
              onChangeText={valor => atualizarCampo('confirmarSenha', valor)}
              placeholder="Confirme a nova senha"
              placeholderTextColor="#777"
              secureTextEntry
            />

            <TouchableOpacity
              style={[styles.saveButton, salvando && styles.saveButtonDisabled]}
              onPress={salvarPerfil}
              disabled={salvando}>
              {salvando ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.saveButtonText}>Salvar alterações</Text>
              )}
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}