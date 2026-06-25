import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { Alert, Platform, Text, TextInput, TouchableOpacity, View, ScrollView, KeyboardAvoidingView } from "react-native"
import styles from "./styles";
import { useState, useCallback } from "react";
import Icon from "react-native-vector-icons/Ionicons";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import DateTimePicker from '@react-native-community/datetimepicker';
import api from "../../services/api";
import BouncyCheckbox from "react-native-bouncy-checkbox";
import DownloadFile from "../../components/DownloadFile";
import Erro from "../../components/Erro";
import FolhaVector from '../../../assets/images/FolhaVetorizada.svg';

export default function UserCreate() {
    const [user, setUser] = useState({
        nome: '',
        email: '',
        cpf: ''
    });
    const [senha, setSenha] = useState('');
    const [date, setDate] = useState(new Date());
    
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [showPassword, setShowPassword] = useState(false); 
    const [carregando, setCarregando] = useState(false);
    const [erro, setErro] = useState('');
    const [isSelected, setSelection] = useState(false);

    const formatDate = (date: Date) => {
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        return `${day}/${month}/${year}`;
    };

    const navigation = useNavigation();

    useFocusEffect(
        useCallback(() => {
            setErro('');
        }, [])
    );

    const handleDateChange = (_event: any, selectedDate?: Date) => {
        setShowDatePicker(false);
        if (selectedDate) {
            setDate(selectedDate);
        }
    };

    const handleCreate = async () => {
        try {
            setCarregando(true);
            setErro('');
            const response = await api.post(`/auth/cadastro`, {
                nome: user.nome.trim(),
                email: user.email.trim(),
                cpf: user.cpf.trim(),
                senha,
                data_nascimento: date.toISOString().split('T')[0]
            });
            Alert.alert("Sucesso", response.data.mensagem || "Cadastro realizado com sucesso!");
            navigation.goBack();
        } catch (error: any) {
            if (error.response) {
                const erro = error.response.data.erro;
                const detalhes = error.response.data.detalhes;
                if (detalhes && Array.isArray(detalhes)) setErro(`${erro}:\n- ${detalhes.join('\n- ')}`); 
                else setErro(erro || "Erro ao realizar cadastro.");
            } else {
                setErro("Erro inesperado. Tente novamente.");
            }
        } finally {
            setCarregando(false);
        }
    }

    return(
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
                        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                            <Icon name="arrow-back-outline" size={20} color="#093624" />
                            <Text style={styles.backText}>Voltar para o Login</Text>
                        </TouchableOpacity>
                        <Text style={styles.cadastroTitle}>CADASTRO</Text>
                    </View>

                    <View style={styles.inputContainer}>
                        <Icon name="person-outline" size={20} color="#093624" style={styles.inputIcon} />
                        <TextInput
                            value={user.nome}
                            style={styles.input}
                            onChangeText={(text) => setUser(prev => ({ ...prev, nome: text }))}
                            placeholder="Nome"
                            placeholderTextColor="#7a7a7a"
                        />
                    </View>

                    <View style={styles.inputContainer}>
                        <Icon name="id-card-outline" size={20} color="#093624" style={styles.inputIcon} />
                        <TextInput
                            value={user.cpf}
                            style={styles.input}
                            onChangeText={(text) => setUser(prev => ({ ...prev, cpf: text }))}
                            placeholder="CPF"
                            placeholderTextColor="#7a7a7a"
                            keyboardType="numeric"
                        />
                    </View>

                    <View style={styles.inputContainer}>
                        <Icon name="mail-outline" size={20} color="#093624" style={styles.inputIcon} />
                        <TextInput
                            value={user.email}
                            style={styles.input}
                            onChangeText={(text) => setUser(prev => ({ ...prev, email: text }))}
                            placeholder="E-mail"
                            placeholderTextColor="#7a7a7a"
                            keyboardType="email-address"
                            autoCapitalize="none"
                        />
                    </View>

                    <TouchableOpacity style={styles.inputContainer} onPress={() => setShowDatePicker(true)}>
                        <MaterialCommunityIcons name="cake-variant" size={20} color="#093624" style={styles.inputIcon} />
                        <Text style={[styles.input, { color: date ? '#000' : '#7a7a7a' }]}>
                            {date ? formatDate(date) : 'Data de aniversário'}
                        </Text>
                    </TouchableOpacity>
                    {showDatePicker && (
                        <DateTimePicker
                            value={date}
                            mode="date"
                            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                            locale="pt-BR"
                            onChange={handleDateChange}
                        />
                    )}

                    <View style={styles.inputContainer}>
                        <Icon name="key-outline" size={20} color="#093624" style={styles.inputIcon} />
                        <TextInput
                            value={senha}
                            style={styles.input}
                            onChangeText={setSenha}
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

                    <BouncyCheckbox
                        textStyle={{ color: '#093624', fontSize: 13, textDecorationLine: 'none' }}
                        size={20}
                        fillColor="#093624"
                        unFillColor="#FFFFFF"
                        text="Li e concordo com os Termos de Uso e Políticas de Privacidade"
                        iconStyle={{ borderColor: "#093624", borderRadius: 4 }}
                        innerIconStyle={{ borderWidth: 2, borderRadius: 4 }}
                        onPress={() => {setSelection(!isSelected)}}
                        style={{ marginBottom: 15 }}
                    />
                    
                    <TouchableOpacity onPress={() => DownloadFile('termo-uso','https://drive.google.com/uc?export=download&id=1V74rvGWG31ek6fx51rP64viIYK8vtvnk')}>
                        <Text style={styles.termo}>Baixar Termo de Uso e Políticas de Privacidade</Text>
                    </TouchableOpacity>

                    {erro ? <Erro texto={erro} /> : null}

                    <TouchableOpacity 
                        onPress={handleCreate} 
                        disabled={carregando || !isSelected}
                        style={ !carregando && isSelected ? styles.button : styles.buttonNot}
                    >
                        <Text style={styles.buttonText}>{carregando ? "Aguarde..." : "Cadastrar"}</Text>
                    </TouchableOpacity>
                </ScrollView>
            </View>
        </KeyboardAvoidingView>
    )
}