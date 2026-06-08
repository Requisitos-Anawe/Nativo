import React from 'react';
import { View, Image, TouchableOpacity, Text, DimensionValue } from 'react-native';

interface FotoPlayerProps {
  uri: string;
  width?: DimensionValue;
  height?: number;
  onExcluir?: () => void;
}

export const FotoPlayer = ({ uri, width = '100%', height = 200, onExcluir }: FotoPlayerProps) => (
  <View style={{ width, height, marginBottom: 16, position: 'relative', borderRadius: 8, overflow: 'hidden', backgroundColor: '#eee' }}>
    <Image source={{ uri }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
    {onExcluir && (
      <TouchableOpacity 
        onPress={onExcluir} 
        style={{ position: 'absolute', top: 8, right: 8, backgroundColor: 'rgba(0,0,0,0.6)', width: 30, height: 30, borderRadius: 15, justifyContent: 'center', alignItems: 'center', zIndex: 10 }}
      >
        <Text style={{ color: '#fff', fontWeight: 'bold' }}>X</Text>
      </TouchableOpacity>
    )}
  </View>
);