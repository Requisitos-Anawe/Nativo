import { Text, View, TextInput, TouchableOpacity, Alert } from "react-native";
import styles from "./styles";
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState } from "react";
import api from '../../services/api';
import AppText from '../../components/AppText';
import Clipboard from '@react-native-clipboard/clipboard';

type Traducao = {
  texto: string;
};


function Home(){
    const [texto, setTexto] = useState('');
    const [categoria, setCategoria] = useState('');
    const [traducao, setTraducao] = useState<Traducao[]>([]);
    const [carregando, setCarregando] = useState(false);

    const copiarParaClipboard = () => {
        Clipboard.setString(traducao[0].texto);
    };


    const handleTraduzir = async () => {
        try {
            setCarregando(true);
            setTraducao([])
            const response = await api.post(`/discurso/buscar`, {
                texto: texto.trim(),
            });
            setTraducao(response.data.traducao);
            setCategoria(response.data.categoria);
        } catch (error) {
            const err = error as any;
            const mensagemErro = err.response?.data?.erro || "Não foi possível traduzir, erro desconhecido.";
            Alert.alert(mensagemErro);
        } finally {
            setCarregando(false);
        }
    };

    
    return(
        <SafeAreaView style={styles.container}>
            
            <View>
               {/* Digitar discurso */}
               <TextInput
                    style={styles.input}
                    value={texto}
                    onChangeText={setTexto}
                    placeholder="Escreva aqui..."
                    multiline
                />
            </View>
            <View style={styles.actions}>
                {/* Botão de traduzir */}
               <TouchableOpacity 
                    style={styles.button}
                    onPress={handleTraduzir} 
                    disabled={carregando}
                >
                    <Text style={styles.textButton}>{carregando ? "Traduzindo..." : "Traduzir"} </Text>
                </TouchableOpacity>
            </View>
            <View style={styles.divisor} />
            <View>
               {/* Resultado de busca */}
               
               {traducao.length > 0 && (
                <View>
                    <View style={styles.translateActions}>
                        {/* Ações da tradução */}
                        <View>
                            {categoria !== '' && (<AppText style={styles.categoriaTexto}>{categoria}</AppText>)}
                        </View>
                    </View>
                    <View style={styles.traducaoBox}>
                        <AppText style={styles.traducaoTexto}>{traducao[0].texto}</AppText>
                    </View>
                    <TouchableOpacity 
                        style={styles.copy}
                        onPress={copiarParaClipboard}
                    >
                        <Text style={styles.copyText}>Copiar</Text>
                    </TouchableOpacity>
                </View>
                )}

                
            </View>
            
        </SafeAreaView>
    )
}

export default Home;