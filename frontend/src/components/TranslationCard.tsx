import React from 'react';
import {StyleProp, Text, TouchableOpacity, View, ViewStyle} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';

type TranslationCardProps = {
  discurso?: string | null;
  traducao?: string | null;
  onDelete?: () => void;
  style?: StyleProp<ViewStyle>;
};

export default function TranslationCard({
  discurso,
  traducao,
  onDelete,
  style,
}: TranslationCardProps) {
  return (
    <View
      style={[
        {
          backgroundColor: '#f4f5f4',
          borderWidth: 1,
          borderColor: '#dcdcdc',
          borderRadius: 8,
          padding: 15,
          marginBottom: 14,
        },
        style,
      ]}>
      <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start'}}>
        {/* Columns container */}
        <View style={{flexDirection: 'row', flex: 1}}>
          {/* Left Column: Discurso */}
          <View style={{flex: 1}}>
            <View style={{flexDirection: 'row', alignItems: 'center', gap: 8}}>
              <Icon name="chatbubble-ellipses-outline" size={18} color="#042d1f" />
              <Text style={{fontWeight: 'bold', color: '#1A1A1A'}}>Discurso</Text>
            </View>
            <Text style={{marginTop: 6, color: '#1A1A1A'}}>
              {discurso || 'Discurso não informado'}
            </Text>
          </View>

          {/* Vertical Divider */}
          <View style={{width: 1, backgroundColor: '#e0e0e0', marginHorizontal: 12, alignSelf: 'stretch'}} />

          {/* Right Column: Tradução */}
          <View style={{flex: 1}}>
            <View style={{flexDirection: 'row', alignItems: 'center', gap: 8}}>
              <Icon name="language-outline" size={18} color="#042d1f" />
              <Text style={{fontWeight: 'bold', color: '#1A1A1A'}}>Tradução</Text>
            </View>
            <Text style={{marginTop: 6, color: '#1A1A1A'}}>
              {traducao || 'Tradução não informada'}
            </Text>
          </View>
        </View>

        {/* Action Button */}
        {onDelete && (
          <TouchableOpacity
            onPress={onDelete}
            style={{marginLeft: 8, padding: 4}}>
            <Icon name="trash-outline" size={18} color="#dc3545" />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}
