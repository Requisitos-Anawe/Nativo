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

    divisor: {
        width: '100%',
        height: 1,
        backgroundColor: "#D9D9D9",
    },

    textDiscurso: {
        padding: 20
    },

    textTraducao: {
        padding: 20
    },

    autor: {
        paddingHorizontal: 20,
        paddingVertical: 10,
        width: '100%',
        alignItems: 'flex-end'
    },

    size: {
        fontSize: 12
    },

    pink: {
        color: '#CC005F',
        fontWeight: 'bold'
    },

    textoAviso: {
        color: '#333',
        fontSize: 16,
    },

    block: {
        backgroundColor: '#fff',
        borderRadius: 5,
        borderColor: "#d9d9d9",
        borderWidth: 1,
        marginBottom: 15,
    },

    bold: {
        fontWeight: 'bold'
    },

    erro: {
        backgroundColor: 'red',
        padding: 15,
        borderRadius: 5,
        marginVertical: 10,
        width: '100%',
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

    button: {
        width: 150,
        backgroundColor: '#CC005F',
        paddingVertical: 8,
        borderRadius: 4,
        alignItems: 'center',
        marginBottom: 10
    },

    pages: { 
        flexDirection: 'row', 
        justifyContent: 'center', 
        margin: 10, 
        alignItems: 'center' 
    },
});