import React from 'react';
import renderer, { act } from 'react-test-renderer';
import UsuariosTab from '../src/screens/Administracao/UsuariosTab';

const mockApiGet = jest.fn();
const mockUseAuth = jest.fn();

jest.mock('../src/contexts/AuthContext', () => ({
  useAuth: () => mockUseAuth(),
}));

jest.mock('../src/services/api', () => ({
  __esModule: true,
  default: {
    get: (...args: any[]) => mockApiGet(...args),
  },
}));

jest.mock('react-native-vector-icons/Ionicons', () => 'Icon');

const renderUsuariosTab = async () => {
  let component: renderer.ReactTestRenderer;

  await act(async () => {
    component = renderer.create(<UsuariosTab />);
  });

  return component!;
};

describe('Tela de Gestão de Usuários (UsuariosTab)', () => {
  beforeEach(() => {
    mockApiGet.mockReset();
    mockUseAuth.mockReturnValue({ user: { id: '1', cargo: 'Admin' } });
  });

  it('deve carregar a lista de usuários sem quebrar', async () => {
    mockApiGet.mockResolvedValue({
      data: {
        data: [
          { id: '1', nome: 'Ana Silva', email: 'ana@email.com', perfil: 'admin' },
          { id: '2', nome: 'Bruno Costa', email: 'bruno@email.com', perfil: 'professor' },
        ],
      },
    });

    const component = await renderUsuariosTab();

    expect(component.toJSON()).toBeTruthy();
    expect(mockApiGet).toHaveBeenCalledWith('/usuarios?limit=1000');
  });

  it('deve renderizar o estado vazio quando não houver usuários', async () => {
    mockApiGet.mockResolvedValue({ data: { data: [] } });

    const component = await renderUsuariosTab();

    expect(component.toJSON()).toBeTruthy();
  });

  it('deve montar o componente com usuário administrador sem quebrar', async () => {
    mockApiGet.mockResolvedValue({
      data: {
        data: [{ id: '1', nome: 'Admin', email: 'admin@email.com', perfil: 'admin' }],
      },
    });

    const component = await renderUsuariosTab();

    expect(component.toJSON()).toBeTruthy();
  });
});