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

    textoAviso: {
        color: '#333',
        fontSize: 16,
    },

    background: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.3)',
    },

    modal: {
        position: 'absolute',
        left: 0,
        right: 0,
        height: screenHeight * 0.4,
        backgroundColor: 'white',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        padding: 30
    },

    closeButton: {
        backgroundColor: 'red',
        padding: 12,
        borderRadius: 6,
        alignSelf: 'flex-end',
    },

    pickerInput: {
        borderColor: '#d9d9d9',
        borderWidth: 1,
        borderRadius: 5,
        paddingHorizontal: 10,
        marginBottom: 20
    },

    button: {
        width: 150,
        backgroundColor: '#CC005F',
        paddingVertical: 8,
        borderRadius: 4,
        alignItems: 'center',
        marginBottom: 10
    },
});