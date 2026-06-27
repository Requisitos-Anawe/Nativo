import { useNavigation } from "@react-navigation/native";
import { Alert, Platform, Text, TextInput, TouchableOpacity, View, ScrollView, KeyboardAvoidingView } from "react-native";
import styles from "./styles";
import { useState, useRef } from "react";
import Icon from "react-native-vector-icons/Ionicons";
import api from "../../services/api";
import Erro from "../../components/Erro";
import FolhaVector from '../../../assets/images/FolhaVetorizada.svg';

export default function RecuperarSenha() {
    const [step, setStep] = useState<1 | 2 | 3>(1);
    const [email, setEmail] = useState('');
    const [codigo, setCodigo] = useState('');
    const [novaSenha, setNovaSenha] = useState('');
    const [confirmaSenha, setConfirmaSenha] = useState('');

    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [carregando, setCarregando] = useState(false);
    const [erro, setErro] = useState('');
    const [isFocused, setIsFocused] = useState(false);

    const inputRef = useRef<TextInput>(null);
    const navigation = useNavigation();

    const handleEnviarEmail = async () => {
        if (!email.trim()) {
            setErro("Por favor, digite seu e-mail.");
            return;
        }
        try {
            setCarregando(true);
            setErro('');
            const response = await api.post(`/auth/recuperar-senha`, {
                email: email.trim()
            });
            Alert.alert("Sucesso", response.data.mensagem || "Código de verificação enviado!");
            setStep(2);
        } catch (error: any) {
            if (error.response) {
                setErro(error.response.data.erro || "Erro ao solicitar recuperação.");
            } else {
                setErro("Erro inesperado. Tente novamente.");
            }
        } finally {
            setCarregando(false);
        }
    };

    const handleReenviarEmail = async () => {
        try {
            setCarregando(true);
            setErro('');
            setCodigo('');
            const response = await api.post(`/auth/recuperar-senha`, {
                email: email.trim()
            });
            Alert.alert("Sucesso", response.data.mensagem || "Novo código de verificação enviado!");
        } catch (error: any) {
            if (error.response) {
                setErro(error.response.data.erro || "Erro ao reenviar código.");
            } else {
                setErro("Erro inesperado. Tente novamente.");
            }
        } finally {
            setCarregando(false);
        }
    };

    const handleValidarCodigo = async () => {
        if (!codigo.trim()) {
            setErro("Por favor, digite o código de verificação.");
            return;
        }
        try {
            setCarregando(true);
            setErro('');
            const response = await api.post(`/auth/validar-codigo`, {
                email: email.trim(),
                codigo: codigo.trim()
            });
            Alert.alert("Sucesso", response.data.mensagem || "Código validado com sucesso!");
            setStep(3);
        } catch (error: any) {
            if (error.response) {
                const erroMsg = error.response.data.erro;
                setErro(erroMsg || "Código inválido ou expirado.");
                if (erroMsg && erroMsg.includes("A solicitação não é mais válida")) {
                    Alert.alert(
                        "Solicitação Expirada/Inválida",
                        erroMsg,
                        [
                            {
                                text: "Nova Solicitação",
                                onPress: () => {
                                    setStep(1);
                                    setCodigo('');
                                    setErro('');
                                }
                            }
                        ]
                    );
                }
            } else {
                setErro("Erro inesperado. Tente novamente.");
            }
        } finally {
            setCarregando(false);
        }
    };

    const handleRedefinirSenha = async () => {
        if (!novaSenha || !confirmaSenha) {
            setErro("Por favor, preencha todos os campos.");
            return;
        }
        if (novaSenha !== confirmaSenha) {
            setErro("As senhas não coincidem.");
            return;
        }
        try {
            setCarregando(true);
            setErro('');
            const response = await api.post(`/auth/redefinir-senha`, {
                email: email.trim(),
                codigo: codigo.trim(),
                nova_senha: novaSenha
            });
            Alert.alert("Sucesso", response.data.mensagem || "Senha redefinida com sucesso!");
            navigation.goBack();
        } catch (error: any) {
            if (error.response) {
                const erroMsg = error.response.data.erro;
                const detalhes = error.response.data.detalhes;
                if (detalhes && Array.isArray(detalhes)) {
                    setErro(`${erroMsg}:\n- ${detalhes.join('\n- ')}`);
                } else {
                    setErro(erroMsg || "Erro ao redefinir senha.");
                }
                
                if (erroMsg && erroMsg.includes("A solicitação não é mais válida")) {
                    Alert.alert(
                        "Solicitação Expirada/Inválida",
                        erroMsg,
                        [
                            {
                                text: "Nova Solicitação",
                                onPress: () => {
                                    setStep(1);
                                    setCodigo('');
                                    setNovaSenha('');
                                    setConfirmaSenha('');
                                    setErro('');
                                }
                            }
                        ]
                    );
                }
            } else {
                setErro("Erro inesperado. Tente novamente.");
            }
        } finally {
            setCarregando(false);
        }
    };

    return (
        <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            <View style={styles.topSection}>
                <View style={styles.leafTopRight}>
                    <FolhaVector width={250} height={250} />
                </View>
                <View style={styles.leafBottomLeft}>
                    <FolhaVector width={250} height={250} />
                </View>
            </View>

            <View style={styles.bottomCard}>
                <ScrollView
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={{ flexGrow: 1, paddingBottom: 80 }}
                    keyboardShouldPersistTaps="handled"
                >
                    <View style={styles.headerCard}>
                        <TouchableOpacity style={styles.backButton} onPress={() => {
                            if (step === 2) setStep(1);
                            else if (step === 3) setStep(2);
                            else navigation.goBack();
                        }}>
                            <Icon name="arrow-back-outline" size={20} color="#093624" />
                            <Text style={styles.backText}>
                                {step === 1 ? "Voltar" : "Etapa Anterior"}
                            </Text>
                        </TouchableOpacity>
                        <Text style={styles.title}>RECUPERAR</Text>
                    </View>

                    {step === 1 && (
                        <View style={{ width: '100%' }}>
                            <Text style={styles.instructions}>
                                Digite seu e-mail cadastrado para receber um código de verificação de 6 dígitos.
                            </Text>

                            <View style={styles.inputContainer}>
                                <Icon name="mail-outline" size={20} color="#093624" style={styles.inputIcon} />
                                <TextInput
                                    value={email}
                                    style={styles.input}
                                    onChangeText={setEmail}
                                    placeholder="E-mail"
                                    placeholderTextColor="#7a7a7a"
                                    keyboardType="email-address"
                                    autoCapitalize="none"
                                />
                            </View>

                            {erro ? <Erro texto={erro} /> : null}

                            <TouchableOpacity
                                onPress={handleEnviarEmail}
                                disabled={carregando}
                                style={styles.button}
                            >
                                <Text style={styles.buttonText}>
                                    {carregando ? "Enviando..." : "Enviar Código"}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    )}

                    {step === 2 && (
                        <View style={{ width: '100%' }}>
                            <Text style={styles.instructions}>
                                O código de verificação foi enviado para o e-mail:{"\n"}
                                <Text style={{ fontWeight: 'bold' }}>{email}</Text>
                            </Text>

                            <TouchableOpacity 
                                activeOpacity={0.9} 
                                style={styles.codeContainer} 
                                onPress={() => inputRef.current?.focus()}
                            >
                                {[0, 1, 2, 3, 4, 5].map((index) => {
                                    const char = codigo[index] || '';
                                    const isCurrent = index === codigo.length;
                                    const isLast = index === 5 && codigo.length === 6;
                                    const highlight = isFocused && (isCurrent || isLast);
                                    
                                    return (
                                        <View 
                                            key={index} 
                                            style={[
                                                styles.codeBox, 
                                                highlight && styles.codeBoxFocused
                                            ]}
                                        >
                                            <Text style={styles.codeBoxText}>{char}</Text>
                                        </View>
                                    );
                                })}
                            </TouchableOpacity>

                            <TextInput
                                ref={inputRef}
                                value={codigo}
                                onChangeText={setCodigo}
                                keyboardType="number-pad"
                                maxLength={6}
                                onFocus={() => setIsFocused(true)}
                                onBlur={() => setIsFocused(false)}
                                style={styles.hiddenTextInput}
                            />

                            {erro ? <Erro texto={erro} /> : null}

                            <TouchableOpacity
                                onPress={handleValidarCodigo}
                                disabled={carregando}
                                style={styles.button}
                            >
                                <Text style={styles.buttonText}>
                                    {carregando ? "Validando..." : "Validar Código"}
                                </Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                onPress={handleReenviarEmail}
                                disabled={carregando}
                                style={styles.resendButton}
                            >
                                <Text style={styles.resendText}>
                                    Reenviar código
                                </Text>
                            </TouchableOpacity>
                        </View>
                    )}

                    {step === 3 && (
                        <View style={{ width: '100%' }}>
                            <Text style={styles.instructions}>
                                Digite sua nova senha de acesso. Ela deve conter pelo menos 8 caracteres, maiúsculas, minúsculas, números e caracteres especiais.
                            </Text>

                            <View style={styles.inputContainer}>
                                <Icon name="key-outline" size={20} color="#093624" style={styles.inputIcon} />
                                <TextInput
                                    value={novaSenha}
                                    style={styles.input}
                                    onChangeText={setNovaSenha}
                                    placeholder="Nova Senha"
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

                            <View style={styles.inputContainer}>
                                <Icon name="lock-closed-outline" size={20} color="#093624" style={styles.inputIcon} />
                                <TextInput
                                    value={confirmaSenha}
                                    style={styles.input}
                                    onChangeText={setConfirmaSenha}
                                    placeholder="Confirmar Nova Senha"
                                    placeholderTextColor="#7a7a7a"
                                    secureTextEntry={!showConfirmPassword}
                                />
                                <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
                                    <Icon
                                        name={showConfirmPassword ? "eye-off-outline" : "eye-outline"}
                                        size={20}
                                        color="#000"
                                    />
                                </TouchableOpacity>
                            </View>

                            {erro ? <Erro texto={erro} /> : null}

                            <TouchableOpacity
                                onPress={handleRedefinirSenha}
                                disabled={carregando}
                                style={styles.button}
                            >
                                <Text style={styles.buttonText}>
                                    {carregando ? "Salvando..." : "Salvar Nova Senha"}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    )}
                </ScrollView>
            </View>
        </KeyboardAvoidingView>
    );
}
