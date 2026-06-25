import { ActivityIndicator, Alert, Button, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import styles from "./styles";
import { useEffect, useState } from "react";
import api from "../../services/api";
import Icon from "react-native-vector-icons/Ionicons";
import Erro from "../../components/Erro";

export default function ModTranslationList(){
    const [traducoes, setTraducoes] = useState<TraducaoResponse[]|null>(null);
    const [carregando, setCarregando] = useState(true);
    const [erro, setErro] = useState('');

    const [paginaAtual, setPaginaAtual] = useState(1);
    const [totalPaginas, setTotalPaginas] = useState(1);
    const limite = 10;

    const mudarPagina = (novaPagina: number) => {
        if (novaPagina >= 1 && novaPagina <= totalPaginas) {
            setPaginaAtual(novaPagina);
        }
    };

    const carregarTraducoes = async () => {
        setCarregando(true);
        try {
            const response = await api.get('/traducao', {
                params: {
                pagina: paginaAtual,
                limite,
                },
            });
            setTraducoes(response.data.traducoes);
            setPaginaAtual(response.data.pagina);
            setTotalPaginas(response.data.total_paginas);
        } catch (error) {
        const err = error as any;
            setErro(err.response?.data?.erro || "Aconteceu um erro desconhecido, tente mais tarde.");
        } finally {
            setCarregando(false);
        }
    };

    useEffect(() => {
        carregarTraducoes();
    }, [paginaAtual]);

    const handleDelete = async (traducao_id: string) => {
        try {
            const response = await api.delete(`/traducao/${traducao_id}`);
            Alert.alert(response.data.mensagem);
            carregarTraducoes();
        } catch (error: any) {
            Alert.alert(error.response.data.erro);
        }
    }

    if (carregando) {
        return (
            <SafeAreaView style={styles.container}>
                <ActivityIndicator />
            </SafeAreaView>
        );
    }

    
    if (!traducoes || traducoes.length === 0) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.caixaAviso}>
                    <Text style={styles.textoAviso}>Nenhuma tradução foi encontrada</Text>
                </View>
            </SafeAreaView>
        );
    }

    return(
        <ScrollView>
            <SafeAreaView style={styles.container}>

                {erro && <Erro texto={erro} />}
               
                <View style={styles.pages}> 
                    <TouchableOpacity disabled={paginaAtual === 1} onPress={() => mudarPagina(1)}>
                        <Icon name="play-back-outline" size={24} />
                    </TouchableOpacity>
                    <TouchableOpacity disabled={paginaAtual === 1} onPress={() => mudarPagina(paginaAtual - 1)}>
                        <Icon name="play-outline" style={{ transform: [{ rotate: '180deg' }] }} size={22} />
                    </TouchableOpacity>
                    <Text style={{ marginHorizontal: 10 }}>Página {paginaAtual} de {totalPaginas}</Text>
                    <TouchableOpacity disabled={paginaAtual === totalPaginas} onPress={() => mudarPagina(paginaAtual + 1)}>
                        <Icon name="play-outline" size={22} />
                    </TouchableOpacity>
                    <TouchableOpacity disabled={paginaAtual === totalPaginas} onPress={() => mudarPagina(totalPaginas)}>
                        <Icon name="play-forward-outline" size={24} />
                    </TouchableOpacity>
                </View>

                {traducoes?.map((item) => (
                    <View style={styles.block} key={item.id}>
                        <View style={{alignItems: 'flex-end', padding: 10}} >
                            <TouchableOpacity onPress={() => {handleDelete(item.id)}}>
                                <Icon name="trash-outline" size={18} />
                            </TouchableOpacity>
                        </View>
                        <Text style={styles.textDiscurso} > 
                            <Text style={{fontWeight: 'bold'}}>Discurso: </Text> 
                            {item.discurso}
                        </Text>
                        <View style={styles.divisor} />
                        <Text style={styles.textTraducao}>
                            <Text style={{fontWeight: 'bold'}}>Tradução: </Text>
                            {item.texto}
                        </Text>
                        <View style={styles.autor} >
                            <Text style={styles.size} > 
                                Adicionado por 
                                <Text style={styles.pink}> {item.usuario} </Text> 
                                em 
                                <Text style={styles.pink}> {item.data_criacao} </Text> 
                            </Text>
                        </View>
                    </View>
                ))}

            </SafeAreaView>
        </ScrollView>
    )
}