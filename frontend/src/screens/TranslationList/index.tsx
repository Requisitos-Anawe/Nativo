import { ActivityIndicator, ScrollView, Text, TextInput, TouchableOpacity, View } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import styles from "./styles"
import { Picker } from "@react-native-picker/picker"
import { useCallback, useEffect, useState } from "react"
import api from "../../services/api"
import AsyncStorage from "@react-native-async-storage/async-storage"
import Icon from "react-native-vector-icons/Ionicons"
import { useFocusEffect, useNavigation, useRoute } from "@react-navigation/native"
import { NativeStackNavigationProp } from "@react-navigation/native-stack"
import Erro from "../../components/Erro"

type RootStackParamList = {
    AddTraducao: { traducao_id: string };
    [key: string]: undefined | object;
};

export default function TraslationList(){
    const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

    const [idiomaTraducao, setIdiomaTraducao] = useState<string>('');
    const [textoTraducao, setTextoTraducao] = useState('');
    const [idiomas, setIdiomas] = useState<IdiomaInterface[]>([]);
    const [traducoes, setTraducoes] = useState<TraducaoResponse[]>([]);

    const [carregando, setCarregando] = useState(true);
    const [erro, setErro] = useState('');

    const handleSearch = async () => {
        try{
            setErro('');
            setCarregando(true);

            const userString = await AsyncStorage.getItem('user');
            if(userString){
                const user = JSON.parse(userString);
                const payload = {
                    textoTraducao: textoTraducao.trim(),
                    idiomaTraducao: idiomaTraducao,
                }
                const response = await api.post(`/traducao/usuario/${user.id}`, payload);
                // TODO: paginacao
                setTraducoes(response.data.traducoes);
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

    useFocusEffect(
        useCallback(() => {
            const buscarDados = async () => {
            try {
                setCarregando(true);
                setErro('');
                await handleSearch();
            } catch (error) {
                const err = error as any;
                setErro(err.response?.data?.erro || "Aconteceu um erro, tente mais tarde.");
            } finally {
                setCarregando(false);
            }
            };

            buscarDados();

        }, [])
    );

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
            setErro(err.response?.data?.erro || "Aconteceu um erro, tente mais tarde.");
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
                        selectedValue={idiomaTraducao ?? ''} 
                        onValueChange={(itemValue) => setIdiomaTraducao(itemValue)}
                    >
                        <Picker.Item label="Selecione um idioma" value="" />
                        {idiomas.map((item) => (
                            <Picker.Item key={item.id} label={item.descricao} value={item.id} />
                        ))}
                    </Picker>
                </View>
                <View style={styles.input} >
                    <TextInput 
                        value={textoTraducao} 
                        placeholder="Digite a tradução desejada" 
                        multiline 
                        style={{height: 55}} 
                        onChangeText={setTextoTraducao}
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

                {erro && <Erro texto={erro} />} 

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
                                <View style={{alignItems: "flex-end"}}>
                                    <TouchableOpacity onPress={() => navigation.navigate('AddTraducao', { traducao_id: item.id })}>
                                        <Icon name={"create-outline"} size={18} color="#000"/>
                                    </TouchableOpacity>
                                </View>
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