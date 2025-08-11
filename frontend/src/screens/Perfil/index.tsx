import { Text, TouchableOpacity } from "react-native";
import ScreenContainer from "../../components/ScreenContainer";
import { useNavigation } from "@react-navigation/native";

export default function Perfil() {
    const navigation = useNavigation();

    function handleGoBack() {
        navigation.goBack();
    }

    return (
        <ScreenContainer>

            <Text>Perfil</Text>

            <TouchableOpacity onPress={handleGoBack}>
                <Text>Voltar</Text>
            </TouchableOpacity>
            
        </ScreenContainer>
    )
}