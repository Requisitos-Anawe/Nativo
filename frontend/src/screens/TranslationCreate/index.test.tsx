import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import TraslationCreate from './index';
import api from '../../services/api';
import { launchImageLibrary } from 'react-native-image-picker';
import { pick } from '@react-native-documents/picker';
import { Alert } from 'react-native';

// Mocks das APIs externas e navegação
jest.mock('../../services/api');
// Mock dos ícones 
jest.mock('react-native-vector-icons/Ionicons', () => 'Icon');
jest.mock('react-native-vector-icons/MaterialIcons', () => 'MaterialIcon');
jest.mock('@react-navigation/native', () => {
  return {
    useRoute: jest.fn(() => ({ params: {} })), 
    useNavigation: () => ({ setParams: jest.fn(), navigate: jest.fn() }),
    useFocusEffect: (cb: any) => {
      const ReactLocal = require('react');
      ReactLocal.useEffect(() => {
        cb();
      }, []);
    },
  };
});

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
}));

// Mocks das bibliotecas de mídia
jest.mock('react-native-image-picker', () => ({
  launchImageLibrary: jest.fn(),
}));

jest.mock('@react-native-documents/picker', () => ({
  pick: jest.fn(),
}));

// Mocks dos componentes filhos para evitar erros de renderização
jest.mock('../../components/AudioPlayer', () => {
  const { TouchableOpacity, Text } = require('react-native');
  // Criamos um botão falso no mock que repassa o evento onExcluir real
  return { AudioPlayer: ({ onExcluir }: any) => (
    <TouchableOpacity onPress={onExcluir}><Text>BotaoExcluirAudio</Text></TouchableOpacity>
  )};
});jest.mock('../../components/VideoPlayer', () => ({ VideoPlayer: () => null }));
jest.mock('../../components/FotoPlayer', () => ({ FotoPlayer: () => null }));
jest.spyOn(Alert, 'alert');

describe('TraslationCreate Screen - Media Uploads', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Configura retornos padrão para a API iniciar a tela
    (api.get as jest.Mock).mockImplementation((url) => {
      if (url === '/categorias') return Promise.resolve({ data: [{ id: 1, descricao: 'Geral' }] });
      if (url === '/idiomas') return Promise.resolve({ data: [{ id: 1, descricao: 'Português' }, { id: 2, descricao: 'Munduruku' }] });
      return Promise.resolve({ data: [] });
    });
  });

  it('deve selecionar um vídeo e anexar ao formulário', async () => {
    // Simula o retorno do ImagePicker para vídeo
    (launchImageLibrary as jest.Mock).mockResolvedValue({
      assets: [{ uri: 'file://fake-video.mp4', type: 'video/mp4', fileName: 'fake-video.mp4' }]
    });

    const { getByText } = render(<TraslationCreate />);
    
    // Espera a tela carregar os dados iniciais
    await waitFor(() => expect(getByText('Selecionar Vídeo')).toBeTruthy());

    // Clica para selecionar o vídeo
    fireEvent.press(getByText('Selecionar Vídeo'));

    // Verifica se a biblioteca nativa foi chamada
    await waitFor(() => {
      expect(launchImageLibrary).toHaveBeenCalledWith({ mediaType: 'video', quality: 1 });
    });
    
    // O texto do botão deve mudar indicando que o vídeo foi carregado
    await waitFor(() => expect(getByText('Alterar Vídeo')).toBeTruthy());
  });

  it('deve selecionar um áudio e anexar ao formulário', async () => {
    // Simula o retorno do DocumentPicker para áudio
    (pick as jest.Mock).mockResolvedValue([
      { uri: 'file://fake-audio.mp3', type: 'audio/mpeg', name: 'fake-audio.mp3' }
    ]);

    const { getByText } = render(<TraslationCreate />);
    
    await waitFor(() => expect(getByText('Selecionar Áudio')).toBeTruthy());

    // Clica para selecionar o áudio
    fireEvent.press(getByText('Selecionar Áudio'));

    await waitFor(() => {
      expect(pick).toHaveBeenCalledWith({ type: ['audio/*'] });
    });
    
    await waitFor(() => expect(getByText('Alterar Áudio')).toBeTruthy());
  });

  it('deve submeter o formulário contendo as mídias selecionadas', async () => {
    // Prepara os mocks de mídia
    (pick as jest.Mock).mockResolvedValue([
      { uri: 'file://fake-audio.mp3', type: 'audio/mpeg', name: 'fake-audio.mp3' }
    ]);
    (api.post as jest.Mock).mockResolvedValue({ data: { mensagem: 'Sucesso' } });

    const { getByText } = render(<TraslationCreate />);
    
    await waitFor(() => expect(getByText('Selecionar Áudio')).toBeTruthy());

    fireEvent.press(getByText('Selecionar Áudio'));
    await waitFor(() => expect(getByText('Alterar Áudio')).toBeTruthy());

    fireEvent.press(getByText('Adicionar'));

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith(expect.any(String), expect.any(FormData), expect.any(Object));
      
      const [url, , config] = (api.post as jest.Mock).mock.calls[0];

      expect(url).toBe('/traducao/cadastrar');
      expect(config.headers['Content-Type']).toBe('multipart/form-data');
    });
  });
  it('deve carregar os dados de uma tradução existente para edição', async () => {
    // Sobrescreve o mock apenas para este teste, fingindo que recebemos um ID na rota
    const { useRoute } = require('@react-navigation/native');
    useRoute.mockReturnValue({ params: { traducao_id: '123' } });

    // Simula o retorno da API para a tradução específica
    (api.get as jest.Mock).mockImplementation((url) => {
      if (url === '/categorias') return Promise.resolve({ data: [{ id: 1, descricao: 'Geral' }] });
      if (url === '/idiomas') return Promise.resolve({ data: [{ id: 1, descricao: 'Português' }] });
      if (url === '/traducao/123') return Promise.resolve({
        data: {
          discurso_categoria: 'Geral',
          idiomaDiscurso: 'Português',
          discurso: 'Texto do discurso',
          idioma: 'Português',
          texto: 'Texto da tradução'
        }
      });
      return Promise.resolve({ data: [] });
    });

    const { getByText, getByDisplayValue } = render(<TraslationCreate />);

    // Verifica se a tela mudou o título para o modo de edição
    await waitFor(() => expect(getByText('Editar Tradução')).toBeTruthy());
    
    // Verifica se os inputs foram preenchidos com os dados da API
    expect(getByDisplayValue('Texto do discurso')).toBeTruthy();
  });
  it('deve exibir mensagem de erro se a busca de categorias ou idiomas falhar', async () => {
    // Força o Axios a rejeitar a promessa com um erro simulado
    (api.get as jest.Mock).mockRejectedValueOnce({
      response: { data: { erro: 'Erro de conexão com o servidor' } }
    });

    const { getByText } = render(<TraslationCreate />);

    // Verifica se o componente de erro apareceu na tela com o texto correto
    await waitFor(() => {
      expect(getByText('Erro de conexão com o servidor')).toBeTruthy();
    });
  });
  it('deve submeter o formulário usando PUT ao editar uma tradução existente', async () => {
    const { useRoute } = require('@react-navigation/native');
    useRoute.mockReturnValueOnce({ params: { traducao_id: '123' } });

    // Mock das requisições iniciais de edição
    (api.get as jest.Mock).mockImplementation((url) => {
      if (url === '/categorias') return Promise.resolve({ data: [{ id: 1, descricao: 'Geral' }] });
      if (url === '/idiomas') return Promise.resolve({ data: [{ id: 1, descricao: 'Português' }] });
      if (url === '/traducao/123') return Promise.resolve({
        data: { discurso_categoria: 'Geral', idiomaDiscurso: 'Português', discurso: 'Sim', idioma: 'Português', texto: 'Sim' }
      });
      return Promise.resolve({ data: [] });
    });

    (api.put as jest.Mock).mockResolvedValueOnce({ data: { mensagem: 'Atualizado com sucesso' } });

    const { getByText } = render(<TraslationCreate />);

    // Espera carregar e clica em Atualizar
    await waitFor(() => expect(getByText('Atualizar')).toBeTruthy());
    fireEvent.press(getByText('Atualizar'));

    await waitFor(() => {
      expect(api.put).toHaveBeenCalledWith('/traducao/123/com-discurso', expect.any(FormData), expect.any(Object));
    });
  });
  it('deve permitir desvincular uma mídia selecionada clicando em excluir', async () => {
    const { useRoute } = require('@react-navigation/native');
    useRoute.mockReturnValue({ params: {} });

    (pick as jest.Mock).mockResolvedValueOnce([
      { uri: 'file://audio.mp3', type: 'audio/mpeg', name: 'audio.mp3' }
    ]);

    const { getByText } = render(<TraslationCreate />);
    
    await waitFor(() => expect(getByText('Selecionar Áudio')).toBeTruthy());
    fireEvent.press(getByText('Selecionar Áudio'));
    
    await waitFor(() => expect(getByText('BotaoExcluirAudio')).toBeTruthy());
    fireEvent.press(getByText('BotaoExcluirAudio'));

    await waitFor(() => {
      expect(getByText('Selecionar Áudio')).toBeTruthy();
    });
  });
});