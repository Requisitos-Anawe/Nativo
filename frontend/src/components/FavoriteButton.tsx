import React, {useEffect, useState} from 'react';
import {ActivityIndicator, Alert, TouchableOpacity} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';

import {alternarFavorito, statusFavorito} from '../services/FavoritoService';

type FavoriteButtonProps = {
  traducaoId: string;
  favoritadoInicial?: boolean;
};

export default function FavoriteButton({
  traducaoId,
  favoritadoInicial,
}: FavoriteButtonProps) {
  const [favoritado, setFavoritado] = useState(Boolean(favoritadoInicial));
  const [carregando, setCarregando] = useState(false);

  useEffect(() => {
    let ativo = true;

    async function carregarStatus() {
      if (favoritadoInicial !== undefined || !traducaoId) {
        return;
      }

      try {
        const response = await statusFavorito(traducaoId);
        if (ativo) {
          setFavoritado(Boolean(response.favoritado));
        }
      } catch {
        // Não bloqueia a tela caso o status não possa ser consultado.
      }
    }

    carregarStatus();

    return () => {
      ativo = false;
    };
  }, [traducaoId, favoritadoInicial]);

  const alternar = async () => {
    if (carregando || !traducaoId) {
      return;
    }

    const estadoAnterior = favoritado;
    setFavoritado(!estadoAnterior);
    setCarregando(true);

    try {
      const response = await alternarFavorito(traducaoId);
      setFavoritado(Boolean(response.favoritado));
    } catch (error: any) {
      setFavoritado(estadoAnterior);
      Alert.alert(
        'Erro',
        error.response?.data?.erro || 'Não foi possível atualizar o favorito.',
      );
    } finally {
      setCarregando(false);
    }
  };

  return (
    <TouchableOpacity onPress={alternar} disabled={carregando} style={{padding: 4}}>
      {carregando ? (
        <ActivityIndicator size="small" />
      ) : (
        <Icon
          name={favoritado ? 'heart' : 'heart-outline'}
          size={24}
          color={favoritado ? '#A62A22' : '#042d1f'}
        />
      )}
    </TouchableOpacity>
  );
}
