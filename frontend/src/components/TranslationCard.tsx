import React from 'react';
import {Text, TouchableOpacity, View} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';

type TranslationCardProps = {
  discurso?: string | null;
  traducao?: string | null;
  onDelete?: () => void;
};

export default function TranslationCard({
  discurso,
  traducao,
  onDelete,
}: TranslationCardProps) {
  return (
    <View
      style={{
        backgroundColor: '#f4f5f4',
        borderWidth: 1,
        borderColor: '#dcdcdc',
        borderRadius: 8,
        padding: 15,
        marginBottom: 14,
      }}>
      {onDelete && (
        <TouchableOpacity
          onPress={onDelete}
          style={{alignSelf: 'flex-end', padding: 4}}>
          <Icon name="trash-outline" size={18} color="#555" />
        </TouchableOpacity>
      )}

      <View style={{flexDirection: 'row', alignItems: 'center', gap: 8}}>
        <Icon name="chatbubble-ellipses-outline" size={18} color="#042d1f" />
        <Text style={{fontWeight: 'bold', color: '#1A1A1A'}}>Discurso</Text>
      </View>
      <Text style={{marginTop: 6, color: '#1A1A1A'}}>
        {discurso || 'Discurso não informado'}
      </Text>

      <View style={{height: 1, backgroundColor: '#e0e0e0', marginVertical: 12}} />

      <View style={{flexDirection: 'row', alignItems: 'center', gap: 8}}>
        <Icon name="language-outline" size={18} color="#042d1f" />
        <Text style={{fontWeight: 'bold', color: '#1A1A1A'}}>Tradução</Text>
      </View>
      <Text style={{marginTop: 6, color: '#1A1A1A'}}>
        {traducao || 'Tradução não informada'}
      </Text>
    </View>
  );
}
