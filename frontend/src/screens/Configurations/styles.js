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
        marginVertical: 20
    },

    title: {
        fontSize: 32,
        fontWeight: 'bold',
        paddingBottom: 12
    },

    termo: {
        fontSize: 16,
        color: '#000',
        textDecorationLine: 'underline',
        marginBottom: 15,
        fontWeight: 'bold',
        paddingTop: 14,
    },
});