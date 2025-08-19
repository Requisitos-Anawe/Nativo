import { ActivityIndicator, Alert, ScrollView, Text, TextInput, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import styles from "./styles";
import { Picker } from '@react-native-picker/picker';
import { useCallback, useEffect, useState } from "react";
import api from "../../services/api";
import { RouteProp, useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';

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
    const [categoriaSelecionada, setCategoriaSelecionada] = useState<CategoriaInterface|null>(null);
    const [idiomaTraducao, setIdiomaTraducao] = useState<IdiomaInterface|null>(null);
    const [idiomaDiscurso, setIdiomaDiscurso] = useState<IdiomaInterface|null>(null);
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
                setCategoriaSelecionada(catRes.data[0]);

                setIdiomas(idiRes.data);
                setIdiomaTraducao(idiRes.data[0]);
                setIdiomaDiscurso(idiRes.data[1]);

                if (traducao_id) {
                    const traducaoRes = await api.get(`/traducao/${traducao_id}`);
                    if (!isActive) return;

                    setTraducao(traducaoRes.data);

                    // Preencher os estados com os dados da tradução carregada
                    setCategoriaSelecionada(traducaoRes.data.discurso.discurso_categoria);
                    setIdiomaDiscurso(traducaoRes.data.discurso.idioma);
                    setTextoDiscurso(traducaoRes.data.discurso.texto);
                    setIdiomaTraducao(traducaoRes.data.idioma);
                    setTextoTraducao(traducaoRes.data.texto);
                } else {
                    // Se for adicionar nova, limpa os estados (útil para resetar caso tenha vindo de edição)
                    setTraducao(undefined);
                    setCategoriaSelecionada(catRes.data[0]);
                    setIdiomaDiscurso(idiRes.data[1]);
                    setTextoDiscurso('');
                    setIdiomaTraducao(idiRes.data[0]);
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
                // Limpa o param quando sair da tela
                navigation.setParams({ traducao_id: undefined });
            };
        }, [traducao_id])
    );

    const handleEvent = async () => {
        try{
            setCarregando(true);

            if(!traducao)
            {
                const response = await api.post('/traducao/cadastrar', {
                    "traducao_texto": textoTraducao.trim(),
                    "discurso_texto": textoDiscurso.trim(), 
                    "idioma_discurso_id": idiomaDiscurso?.id,  
                    "idioma_traducao_id": idiomaTraducao?.id,  
                    "discurso_categoria_id": categoriaSelecionada?.id, 
                })
                if(response) Alert.alert('Tradução cadastrada com sucesso');
                setTextoDiscurso('');
                setTextoTraducao('');
                setErro('');
            }else{
                await api.put(`/traducao/discurso/edit-completo/${traducao_id}`, {
                    texto_traducao: textoTraducao.trim(),
                    idioma_traducao_id: idiomaTraducao?.id,
                    texto_discurso: textoDiscurso.trim(),
                    idioma_discurso_id: idiomaDiscurso?.id,
                    discurso_categoria_id: categoriaSelecionada?.id
                });

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

                    {erro && (
                        <View style={styles.erro} >
                            <Text style={styles.erro_text} >{erro}</Text>
                        </View>
                    )} 

                    <View style={styles.divisor} />
                    <Text style={styles.subtitle} >Categoria do discurso</Text>
                    <View style={styles.input} >
                        <Picker 
                            selectedValue={categoriaSelecionada?.id} 
                            onValueChange={(item) => {
                                setCategoriaSelecionada(categorias.find((i) => i.id === item) || null);
                            }} 
                        >
                            {categorias.map((item) => (
                                <Picker.Item key={item.id} label={item.descricao} value={item.id} />
                            ))}
                        </Picker>
                    </View>
                    <View style={styles.divisor} />

                    <Text style={styles.subtitle} >Discurso</Text>
                    <View style={styles.input} >
                        <Picker 
                            selectedValue={idiomaDiscurso?.id} 
                            onValueChange={(itemValue) =>
                                setIdiomaDiscurso(idiomas.find((i) => i.id === itemValue) || null)}
                        >
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
                            style={{height: 120,textAlign: 'left',textAlignVertical: 'top'}} 
                            onChangeText={setTextoDiscurso}
                        ></TextInput>
                    </View>

                    <View style={styles.divisor} />

                    <Text style={styles.subtitle} >Tradução</Text>
                    <View style={styles.input} >
                        <Picker 
                            selectedValue={idiomaTraducao?.id}  
                            onValueChange={(itemValue) =>
                                setIdiomaTraducao(idiomas.find((i) => i.id === itemValue) || null)} 
                        >
                            {idiomas.map((item) => (
                                <Picker.Item key={item.id} label={item.nome} value={item.id} />
                            ))}
                        </Picker>
                    </View>
                    <View style={styles.input} >
                        <TextInput 
                            value={textoTraducao} 
                            placeholder="Digite o discurso" 
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