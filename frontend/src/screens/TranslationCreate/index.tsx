import { ActivityIndicator, Alert, ScrollView, Text, TextInput, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import styles from "./styles";
import { Picker } from '@react-native-picker/picker';
import { useCallback, useEffect, useState } from "react";
import api from "../../services/api";
import { RouteProp, useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import Erro from "../../components/Erro";

type RootStackParamList = {
  TraslationCreate: {
    traducao_id?: string;
  };
};

export default function TraslationCreate(){
    const route = useRoute<RouteProp<RootStackParamList, 'TraslationCreate'>>();
    const traducao_id = route.params?.traducao_id ?? null;
    const [traducao, setTraducao] = useState<TraducaoInterface>();
    const [categorias, setCategorias] = useState<CategoriaInterface[]>([]);
    const [idiomas, setIdiomas] = useState<IdiomaInterface[]>([]);
    const [categoriaSelecionada, setCategoriaSelecionada] = useState('');
    const [idiomaTraducao, setIdiomaTraducao] = useState('');
    const [idiomaDiscurso, setIdiomaDiscurso] = useState('');
    const [textoDiscurso, setTextoDiscurso] = useState('');
    const [textoTraducao, setTextoTraducao] = useState('');
    const [carregando, setCarregando] = useState(true);
    const [erro, setErro] = useState('');
    const navigation = useNavigation();

    useFocusEffect(
        useCallback(() => {
            let isActive = true;

            const loadData = async () => {
                try {
                    setCarregando(true);
                    setErro('');

                    const [catRes, idiRes] = await Promise.all([
                        api.get(`/categorias`),
                        api.get(`/idiomas`),
                    ]);

                    if (!isActive) return;

                    setCategorias(catRes.data);
                    setCategoriaSelecionada(catRes.data[0].descricao);

                    setIdiomas(idiRes.data);

                    if (traducao_id) {
                        const traducaoRes = await api.get(`/traducao/${traducao_id}`);
                        if (!isActive) return;

                        setTraducao(traducaoRes.data);

                        // Preencher os estados com os dados da tradução carregada
                        setCategoriaSelecionada(traducaoRes.data.discurso_categoria);
                        setIdiomaDiscurso(traducaoRes.data.idiomaDiscurso);
                        setTextoDiscurso(traducaoRes.data.discurso);
                        setIdiomaTraducao(traducaoRes.data.idioma);
                        setTextoTraducao(traducaoRes.data.texto);
                    } else {
                        // Se for adicionar nova, limpa os estados (útil para resetar caso tenha vindo de edição)
                        setTraducao(undefined);
                        setCategoriaSelecionada(catRes.data[0].descricao);
                        setIdiomaDiscurso(idiRes.data[0].descricao);
                        setTextoDiscurso('');
                        setIdiomaTraducao(idiRes.data[1].descricao);
                        setTextoTraducao('');
                    }
                } catch (error) {
                    const err = error as any;
                    setErro(err.response?.data?.erro || "Aconteceu um erro desconhecido, tente mais tarde.");
                } finally {
                    if (isActive) setCarregando(false);
                }
            };

            loadData();

            return () => {
                isActive = false;
                navigation.setParams(undefined);
            };
        }, [traducao_id])
    );

    const handleEvent = async () => {
        try{
            setCarregando(true);
            setErro('');
            if(!traducao)
            {
                const payload = {
                    categoria: categoriaSelecionada,
                    discurso: textoDiscurso.trim(),
                    idioma_discurso: idiomaDiscurso,
                    traducao: textoTraducao.trim(),
                    idioma_traducao: idiomaTraducao
                }
                const response = await api.post('/traducao/cadastrar', payload)
                if(response) Alert.alert('Tradução cadastrada com sucesso');
                setTextoDiscurso('');
                setTextoTraducao('');
            }else{
                const payload = {
                    discurso: {
                        texto: textoDiscurso.trim(),
                        idioma: idiomaDiscurso.toLowerCase()
                    },
                    discurso_id: traducao.discurso_id,
                    traducao: {
                        texto: textoTraducao.trim(),
                        discurso: textoDiscurso.trim(),
                        idioma: idiomaTraducao.toLowerCase()
                    }
                }
                await api.put(`/traducao/${traducao_id}/com-discurso`, payload);

                Alert.alert('Tradução e discurso atualizados com sucesso');
            }

        }catch(error){
            const err = error as any;
            const mensagemErro = err.response?.data?.erro || 
                `Não foi possível ${traducao? "atualizar" : "adicionar"} a tradução.`;
            setErro(mensagemErro)
            Alert.alert('Não foi possível realizar o cadastro.')
        }finally{
            setCarregando(false);
        }
    }

    if (carregando) {
        return <ActivityIndicator />;
    }else{
        return(
            <ScrollView>
                <SafeAreaView style={styles.container} >
                    
                    <Text style={styles.title}>
                        {traducao ? 'Editar Tradução' : 'Nova Tradução'}
                    </Text>

                    {erro && <Erro texto={erro} />} 

                    <View style={styles.divisor} />
                    <Text style={styles.subtitle} >Categoria do discurso</Text>
                    <View style={styles.input} >
                        <Picker 
                            selectedValue={categorias.filter(cat => cat.descricao.toLowerCase() === categoriaSelecionada)[0]?.descricao} 
                            onValueChange={(item) => { setCategoriaSelecionada(item)}} 
                        >
                            {categorias.map((item) => (
                                <Picker.Item key={item.id} label={item.descricao} value={item.descricao} />
                            ))}
                        </Picker>
                    </View>
                    <View style={styles.divisor} />

                    <Text style={styles.subtitle} >Discurso</Text>
                    <View style={styles.input} >
                        <Picker 
                            selectedValue={idiomas.filter(idi => idi.descricao === idiomaDiscurso)[0]?.descricao}  
                            onValueChange={(itemValue) => setIdiomaDiscurso(itemValue)} 
                        >
                            {idiomas.map((item) => (
                                <Picker.Item key={item.id} label={item.descricao} value={item.descricao} />
                            ))}
                        </Picker>
                    </View>
                    <View style={styles.input} >
                        <TextInput 
                            value={textoDiscurso} 
                            placeholder="Digite o discurso" 
                            multiline 
                            style={{height: 120,textAlign: 'left',textAlignVertical: 'top'}} 
                            onChangeText={setTextoDiscurso}
                        ></TextInput>
                    </View>

                    <View style={styles.divisor} />

                    <Text style={styles.subtitle} >Tradução</Text>
                    <View style={styles.input} >
                        <Picker 
                            selectedValue={idiomas.filter(idi => idi.descricao.toLowerCase() === idiomaTraducao)[0]?.descricao}  
                            onValueChange={(itemValue) => setIdiomaTraducao(itemValue)} 
                        >
                            {idiomas.map((item) => (
                                <Picker.Item key={item.id} label={item.descricao} value={item.descricao} />
                            ))}
                        </Picker>
                    </View>
                    <View style={styles.input} >
                        <TextInput 
                            value={textoTraducao} 
                            placeholder="Digite a tradução" 
                            multiline 
                            style={{height: 120,textAlign: 'left',textAlignVertical: 'top'}} 
                            onChangeText={setTextoTraducao}
                        ></TextInput>
                    </View>

                    <View style={styles.divisor} />

                    <TouchableOpacity 
                        onPress={handleEvent} 
                        disabled={carregando}
                        style={styles.button}
                    >
                        <Text style={{color:'#fff'}}>{carregando ? "Aguarde..." : traducao? "Atualizar" : "Adicionar"}</Text>
                    </TouchableOpacity>

                </SafeAreaView>
            </ScrollView>
        )
    }

}