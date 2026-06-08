import React from 'react';
import { View, Text, TouchableOpacity, DimensionValue } from 'react-native';
import Video from 'react-native-video';

interface AudioPlayerProps {
  uri: string;
  name?: string;
  width?: DimensionValue;
  onExcluir?: () => void;
}

export const AudioPlayer = ({ uri, name = "Áudio selecionado", width = '100%', onExcluir }: AudioPlayerProps) => (
  <View style={{ width, padding: 16, backgroundColor: '#f0f0f0', borderRadius: 8, marginBottom: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: 1, borderColor: '#ddd' }}>
    <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: 8 }}>
      <Text style={{ fontSize: 18, marginRight: 8 }}>🎵</Text>
      <Text style={{ color: '#333', flex: 1 }} numberOfLines={1}>{name}</Text>
    </View>
    <Video source={{ uri }} paused={true} controls={true} style={{ width: 0, height: 0 }} />
    {onExcluir && (
      <TouchableOpacity 
        onPress={onExcluir} 
        style={{ backgroundColor: 'rgba(217, 83, 79, 0.9)', width: 28, height: 28, borderRadius: 14, justifyContent: 'center', alignItems: 'center' }}
      >
        <Text style={{ color: '#fff', fontWeight: 'bold' }}>X</Text>
      </TouchableOpacity>
    )}
  </View>
);