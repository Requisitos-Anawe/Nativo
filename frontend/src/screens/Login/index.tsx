import { SafeAreaView, Text, TextInput, TouchableOpacity, View } from "react-native";
import AsyncStorage from '@react-native-async-storage/async-storage';
import styles from "./styles";
import { useState } from "react";
import api from "../../services/api";
import LinearGradient from "react-native-linear-gradient";
import Icon from 'react-native-vector-icons/Ionicons';
import { useNavigation } from "@react-navigation/native";

type LoginProps = {
  onLoginSuccess: () => void;
};

export default function Login({ onLoginSuccess }: LoginProps) {
    const [showPassword, setShowPassword] = useState(false); 
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [carregando, setCarregando] = useState(false);
    const [erro, setErro] = useState('');
    
    const navigation = useNavigation();

    const handleLogin = async () => {
        try {
            setCarregando(true);
            setErro('');
            const response = await api.post(`/auth/login`, {
                email: email.trim(),
                senha: password,
            });
            await AsyncStorage.setItem('token', response.data.token);
            onLoginSuccess();
        } catch (error) {
            var err = error as any;
            setErro(err.response?.data?.erro || "Não foi possível realizar o login.");
        } finally {
            setCarregando(false);
        }
    };

    return(
        <LinearGradient colors={['#003066', '#0060CC']} style={{flex:1}} start={{x:0.5,y:0}} end={{x:0.5,y:1}}>
            <SafeAreaView style={styles.container}>
                <Text style={styles.title} >Login</Text>

                <View style={styles.inputView} >
                    <Text style={styles.subtitle} >E-mail</Text>
                    <TextInput
                        value={email}
                        style={styles.input}
                        onChangeText={setEmail}
                    />

                    <Text style={styles.subtitle} >Senha</Text>
                    
                    <View style={styles.passwordContainer}>
                        <TextInput
                            value={password}
                            style={[{flex: 1}]}
                            onChangeText={setPassword}
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

                </View>



                <TouchableOpacity 
                    onPress={handleLogin} 
                    disabled={carregando}
                    style={styles.button}
                >
                    <Text style={{color:'#fff'}}>{carregando ? "Aguarde..." : "Entrar"}</Text>
                </TouchableOpacity>

                {erro && (
                    <View style={styles.erro} >
                        <Text style={styles.erro_text} >{erro}</Text>
                    </View>
                )}

                <Text style={styles.links} >Cadastre-se</Text>
                <Text style={styles.links} >Esqueci minha senha</Text>
            </SafeAreaView>
        </LinearGradient>
    )
}