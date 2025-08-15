import { ActivityIndicator, Alert, ScrollView, Text, TextInput, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import styles from "./styles";
import { Picker } from '@react-native-picker/picker';
import { useEffect, useState } from "react";
import api from "../../services/api";

export default function(){
    const [categorias, setCategorias] = useState<CategoriaInterface[]>([]);
    const [idiomas, setIdiomas] = useState<IdiomaInterface[]>([]);

    const [categoriaSelecionada, setCategoriaSelecionada] = useState<CategoriaInterface|null>(null);
    const [idiomaTraducao, setIdiomaTraducao] = useState<IdiomaInterface|null>(null);
    const [idiomaDiscurso, setIdiomaDiscurso] = useState<IdiomaInterface|null>(null);
    const [textoDiscurso, setTextoDiscurso] = useState('');
    const [textoTraducao, setTextoTraducao] = useState('');

    const [carregando, setCarregando] = useState(true);
    const [erro, setErro] = useState('');

    useEffect(() => {
        const getCategorias = async () => {
            const response = await api.get(`/categorias`);
            setCategorias(response.data);
            setCategoriaSelecionada(response.data[0]);
        }

        const getIdiomas = async () => {
            const response = await api.get(`/idiomas`);
            setIdiomas(response.data);
            setIdiomaTraducao(response.data[0]);
            setIdiomaDiscurso(response.data[1]);
        }

        try{
            setCarregando(true);
            setErro('');
            getCategorias();
            getIdiomas();
        }catch(error){
            var err = error as any;
            setErro(err.response?.data?.erro || "Aconteceu um erro desconhecido, tente mais tarde.");
        }finally{
            setCarregando(false);
        }

    }, []);

    const handleAdd = async () => {
        try{
            setCarregando(true);
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
        }catch(error){
            const err = error as any;
            const mensagemErro = err.response?.data?.erro || "Não foi possível adicionar a tradução.";
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
                    
                    <Text style={styles.title}> Adicionar Tradução</Text>

                    {erro && (
                        <View style={styles.erro} >
                            <Text style={styles.erro_text} >{erro}</Text>
                        </View>
                    )} 

                    <View style={styles.divisor} />
                    <Text style={styles.subtitle} >Categoria do discurso</Text>
                    <View style={styles.input} >
                        <Picker selectedValue={categoriaSelecionada} onValueChange={(item) => setCategoriaSelecionada(item)} >
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
                        onPress={handleAdd} 
                        disabled={carregando}
                        style={styles.button}
                    >
                        <Text style={{color:'#fff'}}>{carregando ? "Aguarde..." : "Adicionar"}</Text>
                    </TouchableOpacity>

                </SafeAreaView>
            </ScrollView>
        )
    }

}