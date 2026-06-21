import { StyleSheet, Text, View } from "react-native";
import Icon from 'react-native-vector-icons/Ionicons';

const Erro = ({ texto }: { texto: string }) => {
    return (
        <View style={styles.erro} >
            <Icon name="alert-circle-outline" size={20} color="#D32F2F" style={styles.icon} />
            <Text style={styles.erro_text} >{texto}</Text>
        </View>
    )
};

const styles = StyleSheet.create({
    erro: {
        backgroundColor: '#FFEBEE',
        borderWidth: 1,
        borderColor: '#FFCDD2',
        paddingVertical: 10,
        paddingHorizontal: 15,
        borderRadius: 10,
        marginBottom: 15,
        width: '100%',
        flexDirection: 'row',
        alignItems: 'center'
    },
    icon: {
        marginRight: 8,
    },
    erro_text: {
        color: '#D32F2F',
        fontSize: 14,
        fontWeight: '500',
        flex: 1,
    },
});

export default Erro;