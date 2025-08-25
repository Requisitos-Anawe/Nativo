import { StyleSheet } from 'react-native';
import { Dimensions } from 'react-native';
const screenHeight = Dimensions.get('window').height;

export default StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
        padding: 25,
        minHeight: screenHeight-140
    },

    input: {
        backgroundColor: '#fff',
        borderRadius: 5,
        marginBottom: 15,
        padding: 10,
        justifyContent: 'space-between',
        borderColor: "#d9d9d9",
        borderWidth: 1,
        flexDirection: 'row',
        alignItems: 'center'
    },

    name: {
        fontWeight: 'bold'
    },

    moderador: {
        color: '#114A1B',
        fontWeight: 'medium'
    },
    admin: {
        color: '#CC005F',
        fontWeight: 'medium'
    },
    professor: {
        color: '#003066',
        fontWeight: 'medium'
    },
    default: {
        display: 'none'
    },

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

    caixaAviso: {
        backgroundColor: '#f0f0f0',
        borderLeftWidth: 4,
        borderLeftColor: '#CC005F',
        padding: 12,
        marginVertical: 16,
        borderRadius: 5,
    },

    textoAviso: {
        color: '#333',
        fontSize: 16,
    },
});