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

    title: {
        color: '#333333',
        fontSize: 26,
        fontWeight: 'bold',
    },

    subtitle: {
        color: '#333333',
        marginBottom: 5,
        fontWeight: 'bold'
    },

    input: {
        borderColor: '#d9d9d9',
        borderWidth: 1,
        borderRadius: 5,
        paddingHorizontal: 10,
        marginBottom: 5
    },

    text_button: {
        color: '#333333',
        fontSize: 16,
        fontWeight: 'bold',
    },

    button: {
        width: 150,
        backgroundColor: '#CC005F',
        paddingVertical: 8,
        borderRadius: 4,
        alignItems: 'center',
        marginBottom: 10
    },

    minorButton: {
        width: 80,
        backgroundColor: '#CC005F',
        paddingVertical: 8,
        borderRadius: 4,
        alignItems: 'center',
        marginBottom: 10
    },

    divisor: {
        marginVertical: 15,
        width: '100%',
        height: 1,
        backgroundColor: '#d9d9d9'
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

    traducaoBox: {
        borderColor: "#d9d9d9",
        borderWidth: 1,
        width: '100%',
        marginVertical: 16,
        borderRadius: 5,
        padding: 12,
        color: '#333333',
    },

    discursoText: {
        fontSize: 18,
        color: '#333333',
        marginBottom: 6,
        fontWeight: 'thin'
    },

    traducaoText: {
        fontSize: 16,
        color: '#333333',
        marginBottom: 4,
    },

    idiomaText: {
        fontSize: 14,
        color: '#333333',
    },

    traducaoHour: {
        color: "#CC005F",
        fontWeight: 'bold',
        fontSize: 12,
        marginTop: 15
    },

    boxTitle: {
        color: '#333333',
        fontSize: 18,
        fontWeight: 'bold'
    },

    boxHour: {
        alignItems: 'flex-end',
        width: '100%'
    }
});