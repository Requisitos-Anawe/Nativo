import React, { useLayoutEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useIsFocused } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Ionicons';
import styles from './styles';

// Imagens
import IndigenaVetorizada from '../../../assets/images/IndigenaVetorizada.svg';
import AldeiaVetorizado from '../../../assets/images/aldeiaVetorizado.svg';

export default function Perfil() {
    const insets = useSafeAreaInsets();
    const navigation = useNavigation();
    const isFocused = useIsFocused();

    useLayoutEffect(() => {
        if (isFocused) {
            navigation.getParent()?.setOptions({ headerShown: false });
        } else {
            navigation.getParent()?.setOptions({ headerShown: true });
        }
    }, [navigation, isFocused]);

    return (
        <View style={styles.container}>
            {/* Header com informações do usuário */}
            <View style={[styles.header, { paddingTop: insets.top }]}>
                <TouchableOpacity 
                    style={[styles.settingsButton, { top: insets.top + 20 }]} 
                    onPress={() => navigation.navigate('Configurations' as never)}
                >
                    <Icon name="settings" size={24} color="#fff" />
                </TouchableOpacity>

                <View style={styles.profileImageContainer}>
                    <View style={styles.profileImagePlaceholder}>
                        <Icon name="person" size={60} color="#042d1f" />
                    </View>
                    <TouchableOpacity style={styles.editIconContainer}>
                        <Icon name="pencil" size={16} color="#000" />
                    </TouchableOpacity>
                </View>

                <Text style={styles.userName}>Nome do Usuário</Text>
                <Text style={styles.userEmail}>usuário@gmail.com</Text>
            </View>

            <ScrollView
                style={styles.scrollContainer}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* Histórico */}
                <TouchableOpacity style={styles.sectionHeader} activeOpacity={0.7}>
                    <Text style={styles.sectionTitle}>HISTÓRICO</Text>
                    <Icon name="chevron-forward" size={20} color="#000" />
                </TouchableOpacity>

                <View style={styles.historyCard}>
                    <View style={styles.historyRow}>
                        <Text style={styles.historyText}>Discurso</Text>
                        <TouchableOpacity>
                            <Icon name="trash-outline" size={18} color="#555" />
                        </TouchableOpacity>
                    </View>
                    <View style={styles.historyDivider} />
                    <View style={styles.historyRow}>
                        <Text style={styles.historyText}>Tradução</Text>
                    </View>
                </View>

                {/* Conquistas */}
                <TouchableOpacity style={styles.sectionHeader} activeOpacity={0.7}>
                    <Text style={styles.sectionTitle}>CONQUISTAS</Text>
                    <Icon name="chevron-forward" size={20} color="#000" />
                </TouchableOpacity>

                <View style={styles.achievementsContainer}>
                    <View style={styles.achievementBadge}>
                        <IndigenaVetorizada width={100} height={100} />
                        <View style={styles.achievementLevel}>
                            <Text style={styles.achievementLevelText}>10</Text>
                        </View>
                    </View>
                </View>
            </ScrollView>
        </View>
    );
}