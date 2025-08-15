import { ActivityIndicator, ScrollView, Text, TextInput, TouchableOpacity, View } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import styles from "./styles"
import { Picker } from "@react-native-picker/picker"
import { useEffect, useState } from "react"
import api from "../../services/api"
import AsyncStorage from "@react-native-async-storage/async-storage"

export default function TraslationList(){
    const [idiomaDiscurso, setIdiomaDiscurso] = useState<IdiomaInterface|null>(null);
    const [textoDiscurso, setTextoDiscurso] = useState('');
    const [idiomas, setIdiomas] = useState<IdiomaInterface[]>([]);
    const [traducoes, setTraducoes] = useState<TraducaoInterface[]>([]);

    const [carregando, setCarregando] = useState(true);
    const [erro, setErro] = useState('');

    const handleSearch = async () => {
        try{
            setErro('');
            setCarregando(true);

            const userString = await AsyncStorage.getItem('user');
            if(userString){
                const user = JSON.parse(userString);
                const response = await api.post(`/traducao/usuario/${user.id}`, {
                    textoDiscurso: textoDiscurso.trim(),
                    idiomaDiscurso: idiomaDiscurso ? idiomaDiscurso.id : '',
                });
                setTraducoes(response.data);
            }else{
                setErro('Não foi possível buscar as traduções.');
            }
        }catch(error){
            var err = error as any;
            setErro(err.response?.data?.erro || "Aconteceu um erro desconhecido, tente mais tarde.");
        }finally{
            setCarregando(false);
        }
    }

    useEffect(() => {
        
        const getIdiomas = async () => {
            const response = await api.get(`/idiomas`);
            setIdiomas(response.data);
        }

        try{
            setCarregando(true);
            setErro('');
            getIdiomas();
            handleSearch();
        }catch(error){
            var err = error as any;
            setErro(err.response?.data?.erro || "Aconteceu um erro desconhecido, tente mais tarde.");
        }finally{
            setCarregando(false);
        }

    }, []);

    return (
        <ScrollView>
            <SafeAreaView style={styles.container} >
                
                <Text style={styles.subtitle} >Filtros</Text>
                <View style={styles.input} >
                    <Picker 
                        selectedValue={idiomaDiscurso?.id || ''} 
                        onValueChange={(itemValue) =>
                            setIdiomaDiscurso(idiomas.find((i) => i.id === itemValue) || null)}
                    >
                        <Picker.Item label="Selecione um idioma" value="" />
                        {idiomas.map((item) => (
                            <Picker.Item key={item.id} label={item.nome} value={item.id} />
                        ))}
                    </Picker>
                </View>
                <View style={styles.input} >
                    <TextInput 
                        value={textoDiscurso} 
                        placeholder="Digite o discurso" 
                        multiline 
                        style={{height: 55}} 
                        onChangeText={setTextoDiscurso}
                    ></TextInput>
                </View>
                <View style={{alignItems: 'flex-end'}}>
                    <TouchableOpacity 
                        onPress={handleSearch} 
                        disabled={carregando}
                        style={styles.button}
                    >
                        <Text style={{color:'#fff'}}>{carregando ? "Aguarde..." : "Buscar"}</Text>
                    </TouchableOpacity>
                </View>

                {erro && (
                    <View style={styles.erro} >
                        <Text style={styles.erro_text} >{erro}</Text>
                    </View>
                )} 

                <View style={styles.divisor} />

                {carregando ? (
                    <ActivityIndicator />
                ) : (
                    <>
                        {traducoes.length === 0 ? (
                        <View style={styles.caixaAviso}>
                            <Text style={styles.textoAviso}>Nenhuma tradução foi encontrada.</Text>
                        </View>
                        ) : (
                        traducoes.map((item) => (
                            <View key={item.id} style={styles.traducaoBox}>
                                <Text style={styles.boxTitle} >Discurso: <Text style={styles.discursoText} >{item.discurso}</Text> </Text>
                                <View style={styles.divisor}/>
                                <Text style={styles.boxTitle} >Tradução: <Text style={styles.discursoText} >{item.texto}</Text> </Text>
                                <View style={styles.boxHour} ><Text style={styles.traducaoHour}>{item.data_criacao}</Text></View>
                            </View>
                        ))
                        )}
                    </>
                )}

            </SafeAreaView>
        </ScrollView>
    )
}