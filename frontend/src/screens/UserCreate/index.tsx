import { useNavigation } from "@react-navigation/native";
import { Alert, Platform, Text, TextInput, TouchableOpacity, View } from "react-native"
import LinearGradient from "react-native-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import styles from "./styles";
import { useState } from "react";
import Icon from "react-native-vector-icons/Ionicons";
import DateTimePicker from '@react-native-community/datetimepicker';
import api from "../../services/api";
import BouncyCheckbox from "react-native-bouncy-checkbox";
import DownloadFile from "../../components/DownloadFile";
import Erro from "../../components/Erro";

export default function UserCreate() {
    const [user, setUser] = useState<UserRequest>({
        nome: '',
        email: ''
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

    const handleDateChange = (_event: any, selectedDate?: Date) => {
        setShowDatePicker(false);
        if (selectedDate) {
            setDate(selectedDate);
            const formatted = selectedDate.toISOString().split('T')[0]; // yyyy-mm-dd
            setUser(prev => ({ ...prev, data_nascimento: formatted }));
        }
    };

    const handleCreate = async () => {
        try {
            setCarregando(true);
            setErro('');
            const response = await api.post(`/auth/cadastro`, {
                nome: user.nome.trim(),
                email: user.email.trim(),
                senha,
                data_nascimento: date.toISOString().split('T')[0]
            });
            Alert.alert(response.data.mensagem);
            navigation.goBack();
        } catch (error: any) {
            if (error.response) {
                const erro = error.response.data.erro;
                const detalhes = error.response.data.detalhes;
                if (detalhes && Array.isArray(detalhes)) setErro(`${erro}:\n- ${detalhes.join('\n- ')}`); 
                else setErro(erro);
            } else {
                setErro("Erro inesperado. Tente novamente.");
            }
        } finally {
            setCarregando(false);
        }
    }

    return(
        <LinearGradient colors={['#114A1B', 'rgba(17, 74, 27, 0.5)']} style={{flex:1}} start={{x:0.5,y:0}} end={{x:0.5,y:1}}>
            <SafeAreaView style={styles.container}>
                <Text style={styles.title} >Cadastro</Text>

                <View style={styles.inputView} >
                    <Text style={styles.subtitle} >Nome</Text>
                    <TextInput
                        value={user.nome}
                        style={styles.input}
                        onChangeText={(text) => setUser(prev => ({ ...prev, nome: text }))}
                    />

                    <Text style={styles.subtitle} >E-mail</Text>
                    <TextInput
                        value={user.email}
                        style={styles.input}
                        onChangeText={(text) => setUser(prev => ({ ...prev, email: text }))}
                    />

                    <Text style={styles.subtitle} >Data de nascimento</Text>
                    <TouchableOpacity onPress={() => setShowDatePicker(true)} style={styles.input}>
                        <Text>{formatDate(date) || 'Selecionar data'}</Text>
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

                    <Text style={styles.subtitle} >Senha</Text>
                    <View style={styles.passwordContainer}>
                        <TextInput
                            value={senha}
                            style={[{flex: 1}]}
                            onChangeText={setSenha}
                            secureTextEntry={!showPassword}
                        />
                        <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                            <Icon 
                                name={showPassword ? "eye-off" : "eye"} 
                                size={24} 
                                color="#000" 
                            />
                        </TouchableOpacity>
                    </View>

                    <TouchableOpacity onPress={() => DownloadFile('https://drive.google.com/uc?export=download&id=1V74rvGWG31ek6fx51rP64viIYK8vtvnk')}>
                        <Text style={styles.termo}>Baixar Termo de Uso e Políticas de Privacidade</Text>
                    </TouchableOpacity>

                    <BouncyCheckbox
                        textStyle={{ color: '#FFF', fontSize: 14, marginBottom: 10 }}
                        size={25}
                        fillColor="#CC005F"
                        unFillColor="#FFFFFF"
                        text="Li e concordo com os Termos de Uso e Políticas de Privacidade"
                        iconStyle={{ borderColor: "#CC005F" }}
                        innerIconStyle={{ borderWidth: 2 }}
                        onPress={() => {setSelection(!isSelected)}}
                    />

                </View>

                {erro && <Erro texto={erro} />}

                <TouchableOpacity 
                    onPress={handleCreate} 
                    disabled={carregando || !isSelected}
                    style={ !carregando && isSelected ? styles.button : styles.buttonNot}
                >
                    <Text style={{color:'#fff'}}>{carregando ? "Aguarde..." : "Cadastrar"}</Text>
                </TouchableOpacity>

                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Text style={styles.links}>Voltar</Text>
                </TouchableOpacity>
            </SafeAreaView>
        </LinearGradient>
    )
}