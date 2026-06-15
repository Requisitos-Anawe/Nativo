import React, { useState, useLayoutEffect } from "react";
import { Text, View, TextInput, TouchableOpacity, Alert, ScrollView } from "react-native";
import styles from "./styles";
import { SafeAreaView } from 'react-native-safe-area-context';
import api from '../../services/api';
import Clipboard from '@react-native-clipboard/clipboard';
import Icon from 'react-native-vector-icons/Ionicons';
import { useNavigation, useIsFocused } from '@react-navigation/native';

// Imagens (usando as disponíveis como placeholder para os gráficos)
import IndigenaVetorizada from '../../../assets/images/IndigenaVetorizada.svg';
import FolhaVetorizada from '../../../assets/images/FolhaVetorizada.svg';

type Traducao = {
  texto: string;
};

function Home(){
    const [texto, setTexto] = useState('');
    const [categoria, setCategoria] = useState('');
    const [traducao, setTraducao] = useState<Traducao[]>([]);
    const [carregando, setCarregando] = useState(false);
    
    const navigation = useNavigation();
    const isFocused = useIsFocused();

    useLayoutEffect(() => {
        if (isFocused) {
            navigation.getParent()?.setOptions({ headerShown: false });
        } else {
            navigation.getParent()?.setOptions({ headerShown: true });
        }
    }, [navigation, isFocused]);

    const copiarParaClipboard = () => {
        if(traducao.length > 0) {
            Clipboard.setString(traducao[0].texto);
            Alert.alert("Sucesso", "Texto copiado!");
        }
    };

    const limparTexto = () => {
        setTexto('');
        setTraducao([]);
    };

    const handleTraduzir = async () => {
        if (!texto.trim()) return;
        
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
            <ScrollView showsVerticalScrollIndicator={false}>
                
                {/* Seletores de Idioma */}
                <View style={styles.languageContainer}>
                    <View style={styles.languageDropdown}>
                        <Text style={styles.languageText}>De</Text>
                        <Icon name="chevron-down" size={16} color="#000" />
                    </View>
                    
                    <Icon name="swap-horizontal" size={20} color="#000" />
                    
                    <View style={styles.languageDropdown}>
                        <Text style={styles.languageText}>Para</Text>
                        <Icon name="chevron-down" size={16} color="#000" />
                    </View>
                </View>

                {/* Área de Input */}
                <View style={styles.inputContainer}>
                    <TextInput
                        style={styles.input}
                        value={texto}
                        onChangeText={setTexto}
                        placeholder="Discurso"
                        placeholderTextColor="#333"
                        multiline
                    />
                    {texto.length > 0 && (
                        <TouchableOpacity style={styles.clearIcon} onPress={limparTexto}>
                            <Icon name="close" size={20} color="#000" />
                        </TouchableOpacity>
                    )}
                </View>

                {/* Botão Traduzir */}
                <View style={styles.actions}>
                   <TouchableOpacity 
                        style={styles.button}
                        onPress={handleTraduzir} 
                        disabled={carregando}
                    >
                        <Text style={styles.textButton}>{carregando ? "Traduzindo..." : "Traduzir"}</Text>
                    </TouchableOpacity>
                </View>

                {/* Área de Output (Resultados) */}
                <View style={styles.outputContainer}>
                    <Text style={[styles.outputText, { color: traducao.length > 0 ? '#333' : '#999' }]}>
                        {traducao.length > 0 ? traducao[0].texto : "Tradução aparecerá aqui"}
                    </Text>
                    
                    <View style={styles.outputActions}>
                        <TouchableOpacity onPress={copiarParaClipboard}>
                            <Icon name="copy-outline" size={22} color="#000" />
                        </TouchableOpacity>
                        <TouchableOpacity>
                            <Icon name="mic-outline" size={24} color="#000" />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Gráficos da parte inferior */}
                <View style={styles.graphicsContainer}>
                    <View style={styles.graphicBoxRed}>
                        <IndigenaVetorizada width={80} height={80} />
                    </View>
                    <View style={styles.graphicBoxGreen}>
                        <FolhaVetorizada width={80} height={80} />
                    </View>
                </View>

            </ScrollView>

            {/* Botão Info Flutuante */}
            <TouchableOpacity 
                style={styles.infoButton}
                onPress={() => navigation.navigate('Informations' as never)}
            >
                <Icon name="information" size={24} color="#fff" />
            </TouchableOpacity>

        </SafeAreaView>
    )
}

export default Home;