import { StyleSheet, Dimensions } from 'react-native';

const { width } = Dimensions.get('window');

export default StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f4f5f4',
    },
    header: {
        backgroundColor: '#042d1f',
        width: '100%',
        paddingBottom: 30,
        alignItems: 'center',
        borderBottomLeftRadius: 30,
        borderBottomRightRadius: 30,
        zIndex: 10,
        position: 'relative',
    },
    settingsButton: {
        position: 'absolute',
        top: 20,
        right: 20,
        padding: 5,
    },
    profileImageContainer: {
        marginTop: 40,
        position: 'relative',
        marginBottom: 15,
    },
    profileImagePlaceholder: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: '#F5E8C7',
        justifyContent: 'center',
        alignItems: 'center',
    },
    editIconContainer: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        backgroundColor: '#A3C68C',
        width: 32,
        height: 32,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#042d1f',
    },
    userName: {
        color: '#fff',
        fontSize: 22,
        fontFamily: 'InterDisplay-SemiBold',
        fontWeight: 'bold',
        marginBottom: 5,
    },
    userEmail: {
        color: '#fff',
        fontSize: 12,
        opacity: 0.9,
    },
    scrollContainer: {
        flex: 1,
    },
    scrollContent: {
        paddingHorizontal: 20,
        paddingTop: 30,
        paddingBottom: 100, // For the bottom nav bar spacing
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 15,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1A1A1A',
        fontFamily: 'InterDisplay-SemiBold',
    },
    historyCard: {
        backgroundColor: '#f4f5f4',
        borderWidth: 1,
        borderColor: '#dcdcdc',
        borderRadius: 8,
        padding: 15,
        marginBottom: 30,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 5,
        elevation: 2,
    },
    historyRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 15,
    },
    historyText: {
        fontSize: 12,
        color: '#1A1A1A',
        fontWeight: '500',
    },
    historyDivider: {
        height: 1,
        backgroundColor: '#e0e0e0',
        marginBottom: 15,
    },
    achievementsContainer: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        gap: 15,
    },
    achievementBadge: {
        width: 100,
        height: 120,
        justifyContent: 'center',
        alignItems: 'center',
    },
    achievementLevel: {
        position: 'absolute',
        bottom: 0,
        backgroundColor: '#75B73E',
        borderRadius: 15,
        paddingHorizontal: 10,
        paddingVertical: 2,
        borderWidth: 2,
        borderColor: '#fff',
    },
    achievementLevelText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 16,
    },
    achievementBadgeCircle: {
        width: 90,
        height: 90,
        borderRadius: 45,
        backgroundColor: '#A62A22', // Reddish background for hut
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 3,
        borderColor: '#8A1F18',
    }
,
    emptyText: {
        textAlign: 'center',
        color: '#555',
        marginBottom: 25,
    }
});
