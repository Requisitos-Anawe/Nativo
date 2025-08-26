import { StyleSheet } from 'react-native';

export default StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        color: '#fff',
    },

    title: {
        color: '#fff',
        fontSize: 32,
        fontWeight: 'bold',
        marginBottom: 40
    },

    inputView: {
        width: 250,
        marginBottom: 10
    },

    subtitle: {
        color: '#fff',
        marginBottom: 5
    },

    input: {
        backgroundColor: '#fff',
        borderRadius: 5,
        marginBottom: 15,
        height: 40,
        paddingHorizontal: 10,
        justifyContent: 'center'
    },

    passwordContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
        width: 250,
        borderRadius: 5,
        backgroundColor: '#fff',
        height: 40,
        paddingHorizontal: 10
    },

    button: {
        width: 150,
        backgroundColor: '#CC005F',
        paddingVertical: 8,
        borderRadius: 4,
        alignItems: 'center',
        marginBottom: 10
    },

    buttonNot: {
        backgroundColor: '#686868ff',
        paddingVertical: 8,
        borderRadius: 4,
        alignItems: 'center',
        marginBottom: 10,
        width: 150,
    },

    links: {
        color: '#fff',
        textDecorationLine: 'underline',
        marginBottom: 15
    },

    termo: {
        fontSize: 10,
        color: '#fff',
        textDecorationLine: 'underline',
        marginBottom: 15
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

    checkbox: {
        color: '#FFF'
    },
});