import { StyleSheet, Dimensions } from 'react-native';

const { width } = Dimensions.get('window');

export default StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#093624',
    },
    topSection: {
        flex: 0.35,
        position: 'relative',
        justifyContent: 'flex-end',
    },
    leafTopRight: {
        position: 'absolute',
        top: -45,
        right: -45,
        transform: [{ rotate: '80deg' }, { scale: 1.0 }],
    },
    leafBottomLeft: {
        position: 'absolute',
        bottom: -60,
        left: -70,
        transform: [{ rotate: '-100deg' }, { scale: 1.0 }],
    },
    bottomCard: {
        flex: 0.65,
        backgroundColor: '#F5F5F5',
        borderTopLeftRadius: 40,
        borderTopRightRadius: 40,
        paddingHorizontal: 30,
        paddingTop: 30,
    },
    headerCard: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 30,
    },
    backButton: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    backText: {
        color: '#093624',
        fontSize: 14,
        fontWeight: 'bold',
        marginLeft: 5,
    },
    cadastroTitle: {
        color: '#093624',
        fontSize: 28,
        fontWeight: '900',
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        height: 55,
        paddingHorizontal: 15,
        marginBottom: 15,
        width: '100%',
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 3.84,
        elevation: 3,
    },
    inputIcon: {
        marginRight: 10,
    },
    input: {
        flex: 1,
        color: '#000',
        fontSize: 14,
    },
    dateText: {
        flex: 1,
        color: '#000',
        fontSize: 14,
        marginTop: 17,
    },
    button: {
        backgroundColor: '#093624',
        borderRadius: 20,
        height: 55,
        width: '100%',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
        marginTop: 10,
    },
    buttonNot: {
        backgroundColor: '#686868',
        borderRadius: 20,
        height: 55,
        width: '100%',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
        marginTop: 10,
    },
    buttonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: 'bold',
    },
    termo: {
        fontSize: 12,
        color: '#093624',
        textDecorationLine: 'underline',
        marginBottom: 15,
        textAlign: 'center',
    },
});