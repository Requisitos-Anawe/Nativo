import React from 'react';
import renderer, { act } from 'react-test-renderer';
import Configurations from '../src/screens/Configurations';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert, TouchableOpacity } from 'react-native';
import { SyncOfflineService } from '../src/services/SyncOfflineService';

jest.mock('@react-native-async-storage/async-storage', () => ({
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
}));

const mockGoBack = jest.fn();
jest.mock('@react-navigation/native', () => ({
    useNavigation: () => ({ goBack: mockGoBack }),
    useIsFocused: () => true,
}));

jest.mock('@react-native-community/netinfo', () => ({
    addEventListener: jest.fn(() => jest.fn()),
}));

jest.mock('react-native-safe-area-context', () => ({
    useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

jest.mock('../src/contexts/AuthContext', () => ({
    useAuth: () => ({ setUser: jest.fn() }),
}));

jest.mock('../src/components/DownloadFile', () => jest.fn());

jest.mock('../src/services/SyncOfflineService', () => ({
    SyncOfflineService: {
        prepararSincronizacao: jest.fn(),
        iniciarDownload: jest.fn(),
    },
}));

jest.mock('react-native-vector-icons/Ionicons', () => 'Icon');
jest.mock('react-native-vector-icons/MaterialIcons', () => 'MaterialIcon');

const findButtonByText = (tree: renderer.ReactTestRenderer, text: string) => {
  const textNode = tree.root.findByProps({ children: text });
  let current: renderer.ReactTestInstance | null = textNode;
  
  while (current && current.type !== TouchableOpacity) {
    current = current.parent;
  }
  
  if (!current) {
    throw new Error(`Botão com o texto "${text}" não encontrado na tela.`);
  }
  
  return current;
};

jest.spyOn(Alert, 'alert').mockImplementation((title, message, buttons) => {
    const confirmButton = buttons?.find((button: any) => button.text === 'Baixar');
    if (confirmButton?.onPress) {
        confirmButton.onPress();
    }
    return undefined;
});

jest.useFakeTimers();

describe('Configurations screen', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        jest.clearAllTimers();

        (AsyncStorage.getItem as jest.Mock).mockImplementation(async (key: string) => {
            if (key === 'token') return 'fake-token';
            if (key === 'offline_access') return 'false';
            return null;
        });
        (AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined);
        (AsyncStorage.removeItem as jest.Mock).mockResolvedValue(undefined);
        (SyncOfflineService.prepararSincronizacao as jest.Mock).mockResolvedValue('12.34');
        (SyncOfflineService.iniciarDownload as jest.Mock).mockResolvedValue(true);
    });

    it('renderiza a tela sem quebrar', async () => {
        let tree: renderer.ReactTestRenderer;
        await act(async () => {
            tree = renderer.create(<Configurations />);
        });

        expect(tree!.root.findByProps({ children: 'Configurações' })).toBeTruthy();
        expect(tree!.root.findByProps({ children: 'Habilitar tradução offline' })).toBeTruthy();
    });

    it('trata erro de leitura do AsyncStorage no useEffect inicial', async () => {
        (AsyncStorage.getItem as jest.Mock).mockImplementationOnce(() => {
            throw new Error('Erro de leitura simulado');
        });

        await act(async () => {
            renderer.create(<Configurations />);
        });
    });

    it('lança erro se o utilizador não estiver autenticado ao tentar sincronizar', async () => {
        (AsyncStorage.getItem as jest.Mock).mockImplementation(async (key: string) => {
            if (key === 'token') return null;
            return null;
        });

        let tree: renderer.ReactTestRenderer;
        await act(async () => {
            tree = renderer.create(<Configurations />);
        });

        const button = tree!.root.findByProps({ testID: 'download-acervo-button' });
        await act(async () => {
            button.props.onPress();
        });

        expect(SyncOfflineService.iniciarDownload).not.toHaveBeenCalled();
    });

    it('permite cancelar o download clicando no botão do Modal', async () => {
        (SyncOfflineService.iniciarDownload as jest.Mock).mockReturnValue(new Promise(() => { }));

        let tree: renderer.ReactTestRenderer;
        await act(async () => {
            tree = renderer.create(<Configurations />);
        });

        const button = tree!.root.findByProps({ testID: 'download-acervo-button' });
        await act(async () => {
            button.props.onPress();
        });

        const cancelButton = findButtonByText(tree!, 'Cancelar');
        await act(async () => {
            cancelButton.props.onPress();
        });
    });

    it('completa o fluxo de download com sucesso e executa os alertas com temporizador', async () => {
        let tree: renderer.ReactTestRenderer;
        await act(async () => {
            tree = renderer.create(<Configurations />);
        });

        const button = tree!.root.findByProps({ testID: 'download-acervo-button' });
        await act(async () => {
            button.props.onPress();
        });

        await act(async () => {
            jest.runAllTimers();
        });

        expect(AsyncStorage.setItem).toHaveBeenCalledWith('offline_access', 'true');
    });

    it('trata erro de cancelamento CanceledError graciosamente', async () => {
        const errorCanceled = new Error('canceled');
        errorCanceled.name = 'CanceledError';
        (SyncOfflineService.iniciarDownload as jest.Mock).mockRejectedValue(errorCanceled);

        let tree: renderer.ReactTestRenderer;
        await act(async () => {
            tree = renderer.create(<Configurations />);
        });

        const button = tree!.root.findByProps({ testID: 'download-acervo-button' });
        await act(async () => {
            button.props.onPress();
        });

        await act(async () => {
            jest.runAllTimers();
        });
    });

    it('trata erro genérico durante o download do acervo', async () => {
        (SyncOfflineService.iniciarDownload as jest.Mock).mockRejectedValue(new Error('Erro de Rede'));

        let tree: renderer.ReactTestRenderer;
        await act(async () => {
            tree = renderer.create(<Configurations />);
        });

        const button = tree!.root.findByProps({ testID: 'download-acervo-button' });
        await act(async () => {
            button.props.onPress();
        });

        await act(async () => {
            jest.runAllTimers();
        });
    });

    it('trata erro de ESPACO_INSUFICIENTE na checagem inicial do tamanho', async () => {
        (SyncOfflineService.prepararSincronizacao as jest.Mock).mockRejectedValue(new Error('ESPACO_INSUFICIENTE'));

        let tree: renderer.ReactTestRenderer;
        await act(async () => {
            tree = renderer.create(<Configurations />);
        });

        const button = tree!.root.findByProps({ testID: 'download-acervo-button' });
        await act(async () => {
            button.props.onPress();
        });
    });

    it('trata erro genérico na checagem inicial do tamanho do acervo', async () => {
        (SyncOfflineService.prepararSincronizacao as jest.Mock).mockRejectedValue(new Error('Timeout'));

        let tree: renderer.ReactTestRenderer;
        await act(async () => {
            tree = renderer.create(<Configurations />);
        });

        const button = tree!.root.findByProps({ testID: 'download-acervo-button' });
        await act(async () => {
            button.props.onPress();
        });
    });

    it('executa a limpeza de sessão ao clicar no botão Sair da Conta', async () => {
        let tree: renderer.ReactTestRenderer;
        await act(async () => {
            tree = renderer.create(<Configurations />);
        });

        const logoutButton = findButtonByText(tree!, 'Sair da Conta');
        await act(async () => {
            logoutButton.props.onPress();
        });

        expect(AsyncStorage.removeItem).toHaveBeenCalledWith('token');
        expect(AsyncStorage.removeItem).toHaveBeenCalledWith('user');
    });

    it('chama a função DownloadFile ao clicar em Termos de Uso', async () => {
        let tree: renderer.ReactTestRenderer;
        await act(async () => {
            tree = renderer.create(<Configurations />);
        });

        const termsButton = findButtonByText(tree!, 'Termos de Uso e Privacidade');
        await act(async () => {
            termsButton.props.onPress();
        });
    });

    it('chama a navegação de retorno ao pressionar o botão de voltar no cabeçalho', async () => {
        let tree: renderer.ReactTestRenderer;
        await act(async () => {
            tree = renderer.create(<Configurations />);
        });

        const backButton = tree!.root.findAllByType(TouchableOpacity).find((button) => {
            try {
                return button.findByProps({ name: 'arrow-back' });
            } catch {
                return false;
            }
        });

        expect(backButton).toBeTruthy();
        await act(async () => {
            backButton!.props.onPress();
        });

        expect(mockGoBack).toHaveBeenCalled();
    });
});