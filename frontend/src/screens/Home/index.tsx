import { Text, View, TextInput, Button } from "react-native";
import styles from "./styles";
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState } from "react";
import api from '../../services/api';

type Traducao = {
  texto: string;
};


function Home(){
    const [texto, setTexto] = useState('');
    const [categoria, setCategoria] = useState('');
    const [traducao, setTraducao] = useState<Traducao[]>([]);

    const handleTraduzir = async () => {
        try {
            const response = await api.post(`/discurso/buscar`, {
                texto: texto,
            });
            setTraducao(response.data.traducao);
            setCategoria(response.data.categoria);
        } catch (error) {
            setCategoria(`Erro ao traduzir: ${error}`);
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
            <View>
               {/* Botao traduzir */}
               <Button title="Traduzir" onPress={handleTraduzir} />
            </View>
            <View>
               {/* Resultado de busca */}
               {categoria !== '' && (
                    <View style={styles.traducaoBox}>
                    <Text style={styles.traducaoTexto}>Categoria: {categoria}</Text>
                    </View>
                )}
               {traducao.length > 0 && (
                    <View style={styles.traducaoBox}>
                        <Text style={styles.traducaoTexto}>{traducao[0].texto}</Text>
                    </View>
                )}
            </View>
        </SafeAreaView>
    )
}

export default Home;