import { Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import styles from "./styles";
import { useNavigation } from "@react-navigation/native";
import DownloadFile from "../../components/DownloadFile";

export default function Configurations(){
    const navigation = useNavigation();
    
    return(
        <SafeAreaView style={styles.container}>

            <TouchableOpacity onPress={() => navigation.goBack()}>
                <Text>Voltar</Text>
            </TouchableOpacity>

            <View style={styles.divisor} />

            <Text style={styles.title} >Configurações</Text>

            <TouchableOpacity onPress={() => DownloadFile('termo-uso','https://drive.google.com/uc?export=download&id=1V74rvGWG31ek6fx51rP64viIYK8vtvnk')}>
                <Text style={styles.termo}>Baixar Termo de Uso e Políticas de Privacidade</Text>
            </TouchableOpacity>
            
        </SafeAreaView>
    )
}