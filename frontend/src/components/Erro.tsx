import { ReactNode } from "react";
import { StyleSheet, Text, View } from "react-native";

const Erro = ({ texto }: { texto: string }) => {
    return (
        <View style={styles.erro} >
            <Text style={styles.erro_text} >{texto}</Text>
        </View>
    )
};

const styles = StyleSheet.create({
    erro: {
        backgroundColor: 'red',
        padding: 15,
        borderRadius: 5,
        marginVertical: 10,
        width: 250,
        alignItems: 'center'
    },

    erro_text: {
        color: '#fff',
    },
});

export default Erro;