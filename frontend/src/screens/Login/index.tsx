import { Text, TextInput, TouchableOpacity, View, ScrollView } from "react-native";
import AsyncStorage from '@react-native-async-storage/async-storage';
import styles from "./styles";
import { useState, useCallback } from "react";
import api from "../../services/api";
import Icon from 'react-native-vector-icons/Ionicons';
import { useAuth } from "../../contexts/AuthContext";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../../navigation/AuthStack";
import Erro from "../../components/Erro";
import IndigenaVector from '../../../assets/images/IndigenaVetorizada.svg';
import FolhaVector from '../../../assets/images/FolhaVetorizada.svg';

type Navigation = NativeStackNavigationProp<RootStackParamList>;

export default function Login() {
    const [showPassword, setShowPassword] = useState(false);
    const [cpf, setCpf] = useState('');
    const [password, setPassword] = useState('');
    const [carregando, setCarregando] = useState(false);
    const [erro, setErro] = useState('');

    const { setUser } = useAuth();
    const navigation = useNavigation<Navigation>();

    useFocusEffect(
        useCallback(() => {
            setErro('');
        }, [])
    );

    const handleLogin = async () => {
        try {
            setCarregando(true);
            setErro('');
            const response = await api.post(`/auth/login`, {
                cpf: cpf,
                senha: password,
            });
            setUser(response.data.usuario);
            await AsyncStorage.setItem('token', response.data.token);
            await AsyncStorage.setItem('user', JSON.stringify(response.data.usuario));
        } catch (error) {
            var err = error as any;
            setErro(err.response?.data?.erro || "Não foi possível realizar o login.");
        } finally {
            setCarregando(false);
        }
    };

    return (
        <View style={styles.container}>
            <View style={styles.topSection}>
                <View style={styles.leafTopLeft}>
                    <FolhaVector width={250} height={250} />
                </View>
                <View style={styles.leafMiddleRight}>
                    <FolhaVector width={200} height={200} />
                </View>

                <Text style={styles.olaText}>Olá!</Text>

                <View style={styles.indigenaWrapper}>
                    <IndigenaVector width={200} height={200} />
                </View>
            </View>

            <View style={styles.bottomCard}>
                <ScrollView
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={{ flexGrow: 1, alignItems: 'center', paddingBottom: 80 }}
                    style={{ width: '100%' }}
                    keyboardShouldPersistTaps="handled"
                >
                    <Text style={styles.loginTitle}>LOGIN</Text>

                    <View style={styles.inputContainer}>
                        <Icon name="id-card-outline" size={20} color="#093624" style={styles.inputIcon} />
                        <TextInput
                            value={cpf}
                            style={styles.input}
                            onChangeText={setCpf}
                            placeholder="CPF"
                            placeholderTextColor="#7a7a7a"
                            keyboardType="numeric"
                        />
                    </View>

                    <View style={styles.inputContainer}>
                        <Icon name="key-outline" size={20} color="#093624" style={styles.inputIcon} />
                        <TextInput
                            value={password}
                            style={styles.input}
                            onChangeText={setPassword}
                            placeholder="Senha"
                            placeholderTextColor="#7a7a7a"
                            secureTextEntry={!showPassword}
                        />
                        <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                            <Icon
                                name={showPassword ? "eye-off-outline" : "eye-outline"}
                                size={20}
                                color="#000"
                            />
                        </TouchableOpacity>
                    </View>

                    <TouchableOpacity style={styles.forgotPassword} onPress={() => navigation.navigate("RecuperarSenha")}>
                        <Text style={styles.forgotPasswordText}>Esqueceu sua senha?</Text>
                    </TouchableOpacity>

                    {erro ? <Erro texto={erro} /> : null}

                    <TouchableOpacity
                        onPress={handleLogin}
                        disabled={carregando}
                        style={styles.button}
                    >
                        <Text style={styles.buttonText}>{carregando ? "Aguarde..." : "Entrar"}</Text>
                    </TouchableOpacity>

                    <View style={styles.registerContainer}>
                        <Text style={styles.noAccountText}>Não possui conta? </Text>
                        <TouchableOpacity onPress={() => navigation.navigate("Cadastro")}>
                            <Text style={styles.registerText}>Cadastro</Text>
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            </View>
        </View>
    )
}