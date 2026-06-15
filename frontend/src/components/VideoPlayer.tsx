import React from 'react';
import { View, TouchableOpacity, Text, DimensionValue } from 'react-native';
import Video from 'react-native-video';

interface VideoPlayerProps {
  uri: string;
  width?: DimensionValue;
  height?: number;
  onExcluir?: () => void;
}

export const VideoPlayer = ({ uri, width = '100%', height = 220, onExcluir }: VideoPlayerProps) => (
  <View style={{ width, height, marginBottom: 6, marginTop: 20, position: 'relative', borderRadius: 8, overflow: 'hidden', backgroundColor: '#000' }}>
    <Video source={{ uri }} style={{ width: '100%', height: '100%' }} controls={true} paused={true} resizeMode="contain" />
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