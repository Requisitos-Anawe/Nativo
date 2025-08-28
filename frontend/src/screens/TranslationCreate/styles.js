import { StyleSheet } from 'react-native';

export default StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
        padding: 25
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
        marginBottom: 20
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
    
    divisor: {
        marginVertical: 15,
        width: '100%',
        height: 1,
        backgroundColor: '#d9d9d9'
    },
});