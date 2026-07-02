import React, {useCallback, useState} from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
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
import {launchImageLibrary} from 'react-native-image-picker';
import DateTimePicker from '@react-native-community/datetimepicker';

import {useAuth} from '../../contexts/AuthContext';
import {UsuarioPerfil} from '../../interfaces/ProfileInterface';
import {atualizarUsuario, buscarMeuPerfil} from '../../services/ProfileService';
import api from '../../services/api';
import styles from './styles';

type FormState = {
  nome: string;
  email: string;
  data_nascimento: string;
  senha: string;
  confirmarSenha: string;
  imagem_url: string;
};

const normalizarData = (valor?: string | null) => {
  if (!valor) {
    return '';
  }
  return valor.split('T')[0];
};

const converterParaBr = (valor?: string | null) => {
  if (!valor) return '';
  const dataLimpa = valor.split('T')[0];
  const partes = dataLimpa.split('-');
  if (partes.length === 3) {
    return `${partes[2]}/${partes[1]}/${partes[0]}`;
  }
  return valor;
};

const aplicarMascaraData = (valor: string) => {
  const limpo = valor.replace(/\D/g, '');
  let formatado = limpo;
  if (limpo.length > 2) {
    formatado = `${limpo.slice(0, 2)}/${limpo.slice(2)}`;
  }
  if (limpo.length > 4) {
    formatado = `${limpo.slice(0, 2)}/${limpo.slice(2, 4)}/${limpo.slice(4, 8)}`;
  }
  return formatado;
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
    imagem_url: '',
  });
  const [dataDigitada, setDataDigitada] = useState('');
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  // States para o DateTimePicker
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showSenha, setShowSenha] = useState(false);
  const [showConfirmarSenha, setShowConfirmarSenha] = useState(false);
  const [dateObj, setDateObj] = useState(new Date());

  const carregarPerfil = useCallback(async () => {
    try {
      setErro(null);
      setCarregando(true);

      const response: any = await buscarMeuPerfil();
      const dados: UsuarioPerfil = response?.dados || response?.usuario || response;

      setPerfil(dados);
      setDataDigitada(converterParaBr(dados?.data_nascimento));
      setForm({
        nome: dados?.nome || '',
        email: dados?.email || '',
        data_nascimento: normalizarData(dados?.data_nascimento),
        senha: '',
        confirmarSenha: '',
        imagem_url: dados?.imagem_url || '',
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

  const handleDataDigitadaChange = (valor: string) => {
    const mascarado = aplicarMascaraData(valor);
    setDataDigitada(mascarado);

    if (mascarado.length === 10) {
      const partes = mascarado.split('/');
      if (partes.length === 3) {
        const [dia, mes, ano] = partes;
        atualizarCampo('data_nascimento', `${ano}-${mes}-${dia}`);
      }
    } else {
      atualizarCampo('data_nascimento', '');
    }
  };

  const abrirCalendario = () => {
    if (form.data_nascimento) {
      const partes = form.data_nascimento.split('-');
      if (partes.length === 3) {
        const ano = parseInt(partes[0], 10);
        const mes = parseInt(partes[1], 10) - 1;
        const dia = parseInt(partes[2], 10);
        setDateObj(new Date(ano, mes, dia));
      }
    } else {
      setDateObj(new Date());
    }
    setShowDatePicker(true);
  };

  const onChangeDatePicker = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setDateObj(selectedDate);
      const dia = String(selectedDate.getDate()).padStart(2, '0');
      const mes = String(selectedDate.getMonth() + 1).padStart(2, '0');
      const ano = selectedDate.getFullYear();
      const dataFormatada = `${dia}/${mes}/${ano}`;
      setDataDigitada(dataFormatada);
      atualizarCampo('data_nascimento', `${ano}-${mes}-${dia}`);
    }
  };

  const selecionarAvatar = async () => {
    const result = await launchImageLibrary({mediaType: 'photo', quality: 0.8});
    if (result.assets && result.assets.length > 0) {
      const asset = result.assets[0];
      const formData = new FormData();
      formData.append('file', {
        uri: Platform.OS === 'android' ? asset.uri : asset.uri?.replace('file://', ''),
        type: asset.type || 'image/jpeg',
        name: asset.fileName || 'avatar.jpg',
      } as any);
      formData.append('pasta', 'perfis');

      try {
        setSalvando(true);
        const uploadResponse = await api.post('/upload_midia', formData, {
          headers: {'Content-Type': 'multipart/form-data'},
        });
        const url = uploadResponse.data.url;
        atualizarCampo('imagem_url', url);
        Alert.alert(
          'Sucesso',
          'Foto de perfil carregada com sucesso! Lembre-se de salvar as alterações do perfil.',
        );
      } catch (uploadError: any) {
        Alert.alert(
          'Erro',
          uploadError?.response?.data?.erro || 'Falha ao realizar o upload da imagem.',
        );
      } finally {
        setSalvando(false);
      }
    }
  };

  const validarFormulario = () => {
    const email = form.email.trim();

    if (!form.nome.trim()) {
      Alert.alert('Erro', 'O nome é obrigatório.');
      return false;
    }

    if (email && !/^\S+@\S+\.\S+$/.test(email)) {
      Alert.alert('Erro', 'Informe um e-mail válido.');
      return false;
    }

    if (dataDigitada.trim() && !/^\d{2}\/\d{2}\/\d{4}$/.test(dataDigitada.trim())) {
      Alert.alert('Erro', 'Informe a data no formato DD/MM/AAAA.');
      return false;
    }

    if (form.data_nascimento.trim() && !/^\d{4}-\d{2}-\d{2}$/.test(form.data_nascimento.trim())) {
      Alert.alert('Erro', 'Data de nascimento inválida.');
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
      imagem_url?: string;
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

    payload.imagem_url = form.imagem_url;

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
            <View style={styles.avatarWrapper}>
              <View style={styles.avatarContainer}>
                {form.imagem_url ? (
                  <Image
                    source={{uri: form.imagem_url}}
                    style={styles.avatarImage}
                  />
                ) : (
                  <View style={[styles.avatarImage, {alignItems: 'center', justifyContent: 'center'}]}>
                    <Icon name="person" size={60} color="#042d1f" />
                  </View>
                )}
                <TouchableOpacity style={styles.avatarEditButton} onPress={selecionarAvatar}>
                  <Icon name="camera" size={18} color="#fff" />
                </TouchableOpacity>
              </View>
            </View>

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
            <View style={styles.dateInputContainer}>
              <TextInput
                style={styles.dateInput}
                value={dataDigitada}
                onChangeText={handleDataDigitadaChange}
                placeholder="DD/MM/AAAA"
                placeholderTextColor="#777"
                keyboardType="numeric"
                maxLength={10}
              />
              <TouchableOpacity style={styles.calendarButton} onPress={abrirCalendario}>
                <Icon name="calendar-outline" size={22} color="#042d1f" />
              </TouchableOpacity>
            </View>

            {showDatePicker && (
              <DateTimePicker
                value={dateObj}
                mode="date"
                display="default"
                onChange={onChangeDatePicker}
                maximumDate={new Date()}
              />
            )}

            <Text style={styles.label}>Nova senha</Text>
            <View style={styles.passwordInputContainer}>
              <TextInput
                style={styles.passwordInput}
                value={form.senha}
                onChangeText={valor => atualizarCampo('senha', valor)}
                placeholder="Deixe em branco para não alterar"
                placeholderTextColor="#777"
                secureTextEntry={!showSenha}
              />
              <TouchableOpacity style={styles.eyeButton} onPress={() => setShowSenha(!showSenha)}>
                <Icon
                  name={showSenha ? "eye-off-outline" : "eye-outline"}
                  size={20}
                  color="#042d1f"
                />
              </TouchableOpacity>
            </View>

            <Text style={styles.label}>Confirmar nova senha</Text>
            <View style={styles.passwordInputContainer}>
              <TextInput
                style={styles.passwordInput}
                value={form.confirmarSenha}
                onChangeText={valor => atualizarCampo('confirmarSenha', valor)}
                placeholder="Confirme a nova senha"
                placeholderTextColor="#777"
                secureTextEntry={!showConfirmarSenha}
              />
              <TouchableOpacity style={styles.eyeButton} onPress={() => setShowConfirmarSenha(!showConfirmarSenha)}>
                <Icon
                  name={showConfirmarSenha ? "eye-off-outline" : "eye-outline"}
                  size={20}
                  color="#042d1f"
                />
              </TouchableOpacity>
            </View>

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