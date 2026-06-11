import { StyleSheet, Dimensions } from 'react-native';

const { width } = Dimensions.get('window');

export default StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#093624',
    },
    topSection: {
        flex: 0.42,
        position: 'relative',
        justifyContent: 'flex-end',
    },
    leafTopLeft: {
        position: 'absolute',
        top: -80,
        left: -50,
        transform: [{ rotate: '150deg' }, { scale: 1.5 }],
    },
    leafMiddleRight: {
        position: 'absolute',
        bottom: 20,
        right: 10,
        transform: [{ rotate: '45deg' }, { scale: 0.9 }],
    },
    olaText: {
        color: '#FFFFFF',
        fontSize: 56,
        fontWeight: 'bold',
        marginLeft: 35,
        marginBottom: 40,
        fontFamily: 'serif',
    },
    indigenaWrapper: {
        position: 'absolute',
        bottom: -20,
        right: 0,
        zIndex: 10,
    },
    bottomCard: {
        flex: 0.58,
        backgroundColor: '#F5F5F5',
        borderTopLeftRadius: 40,
        borderTopRightRadius: 40,
        paddingHorizontal: 30,
        paddingTop: 45,
        alignItems: 'center',
    },
    loginTitle: {
        color: '#093624',
        fontSize: 28,
        fontWeight: '900',
        alignSelf: 'flex-start',
        marginBottom: 30,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        height: 55,
        paddingHorizontal: 15,
        marginBottom: 20,
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
        fontSize: 16,
    },
    forgotPassword: {
        alignSelf: 'flex-end',
        marginBottom: 25,
    },
    forgotPasswordText: {
        color: '#093624',
        fontSize: 12,
        fontWeight: 'bold',
    },
    button: {
        backgroundColor: '#093624',
        borderRadius: 20,
        height: 55,
        width: '100%',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 30,
    },
    buttonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: 'bold',
    },
    dividerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        width: '100%',
        marginBottom: 30,
    },
    divider: {
        flex: 1,
        height: 1,
        backgroundColor: '#CCC',
    },
    dividerText: {
        marginHorizontal: 10,
        color: '#000',
        fontSize: 14,
        fontWeight: 'bold',
    },
    googleButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#F5F5F5',
        borderWidth: 1,
        borderColor: '#7a7a7a',
        borderRadius: 25,
        height: 50,
        width: '100%',
        marginBottom: 30,
    },
    googleIcon: {
        marginRight: 10,
    },
    googleButtonText: {
        color: '#555',
        fontSize: 14,
    },
    registerContainer: {
        flexDirection: 'row',
    },
    noAccountText: {
        color: '#000',
        fontSize: 14,
        fontWeight: 'bold',
    },
    registerText: {
        color: '#093624',
        fontSize: 14,
        fontWeight: 'bold',
    },
});