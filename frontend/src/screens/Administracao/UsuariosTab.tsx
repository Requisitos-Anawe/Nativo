import React, { useMemo, useState, useEffect } from 'react';
import {
  Alert,
  FlatList,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ActivityIndicator,
  Image
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import api from '../../services/api'; 
import { useAuth } from '../../contexts/AuthContext';

type Cargo = 'Admin' | 'Moderador' | 'Professor' | 'Usuário' | 'Banido';
type ModalTipo = 'atribuir' | 'revogar' | 'banir' | 'desbanir' | null;

type Usuario = {
  id: string;
  nome: string;
  email: string;
  cargo: Cargo;
  iniciais: string;
  isCurrentUser?: boolean;
  foto_perfil?: string;
};

const FILTROS: Array<'Todos' | Cargo> = ['Todos', 'Admin', 'Moderador', 'Professor', 'Usuário', 'Banido'];
const CARGOS_EDITAVEIS: Array<'Admin' | 'Moderador' | 'Professor'> = ['Admin', 'Moderador', 'Professor'];

const cargoBadgeStyle: Record<Cargo, { backgroundColor: string; color: string }> = {
  Admin: { backgroundColor: '#0d3f2b', color: '#d8fbe8' },
  Moderador: { backgroundColor: '#9a6b45', color: '#fff3e8' },
  Professor: { backgroundColor: '#2b76c9', color: '#eef6ff' },
  Usuário: { backgroundColor: '#9d9d9d', color: '#ffffff' },
  Banido: { backgroundColor: '#cc3b2e', color: '#fff2ef' },
};

const avatarColorStyle: Record<Cargo, { bg: string; text: string }> = {
  Admin: { bg: '#d8fbe8', text: '#0d3f2b' },
  Moderador: { bg: '#fff3e8', text: '#9a6b45' },
  Professor: { bg: '#eef6ff', text: '#2b76c9' },
  Usuário: { bg: '#e0e0e0', text: '#6f6f6f' },
  Banido: { bg: '#fde7e4', text: '#c53226' },
};

const actionLabels: Record<Exclude<ModalTipo, null>, { title: string; primary: string; accent: string }> = {
  atribuir: { title: 'Atribuir Cargo', primary: 'Confirmar', accent: '#0d3f2b' },
  revogar: { title: 'Revogar privilégios?', primary: 'Revogar', accent: '#c47c52' },
  banir: { title: 'Banir usuário?', primary: 'Confirmar Banimento', accent: '#d43d2c' },
  desbanir: { title: 'Desbanir usuário?', primary: 'Desbanir', accent: '#2eaf5d' },
};

export default function UsuariosTab() {
  const { user } = useAuth();
  const [busca, setBusca] = useState('');
  const [filtroAtivo, setFiltroAtivo] = useState<'Todos' | Cargo>('Todos');
  const [menuAbertoUserId, setMenuAbertoUserId] = useState<string | null>(null);
  const [modalTipo, setModalTipo] = useState<ModalTipo>(null);
  const [usuarioSelecionado, setUsuarioSelecionado] = useState<Usuario | null>(null);
  const [novoCargo, setNovoCargo] = useState<Cargo>('Professor');
  const [motivoBanimento, setMotivoBanimento] = useState('');
  
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchUsuarios = async () => {
    try {
      setLoading(true);
      const response = await api.get('/usuarios?limit=1000');
      const usuariosRecebidos = response.data.data;
      
      const usuariosFormatados = usuariosRecebidos.map((u: any) => {
        const nomePartes = (u.nome || 'U N').split(' ');
        const iniciais = nomePartes.length > 1 
          ? (nomePartes[0][0] + nomePartes[1][0]).toUpperCase()
          : (nomePartes[0][0]).toUpperCase();

        let cargoFinal: Cargo = 'Usuário';
        if (u.status === 'banido') {
          cargoFinal = 'Banido';
        } else if (u.perfil === 'admin' || u.perfil === 'administrador') {
          cargoFinal = 'Admin';
        } else if (u.perfil === 'moderador') {
          cargoFinal = 'Moderador';
        } else if (u.perfil === 'professor') {
          cargoFinal = 'Professor';
        }

        return {
          id: u.id,
          nome: u.nome,
          email: u.email,
          cargo: cargoFinal,
          iniciais: iniciais,
          isCurrentUser: u.id === user?.id,
          foto_perfil: u.foto_perfil || u.foto || u.avatar || u.imagem || u.photoURL
        };
      });

      setUsuarios(usuariosFormatados);
    } catch (error) {
      console.error("Erro ao buscar usuários:", error);
      Alert.alert('Erro', 'Não foi possível carregar a lista de usuários.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsuarios();
  }, []);

  const usuariosFiltrados = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    return usuarios.filter((usuario) => {
      const bateBusca = !termo || usuario.nome.toLowerCase().includes(termo) || usuario.email.toLowerCase().includes(termo);
      const bateFiltro = filtroAtivo === 'Todos' || usuario.cargo === filtroAtivo;
      return bateBusca && bateFiltro;
    });
  }, [busca, filtroAtivo, usuarios]);

  const openModal = (usuario: Usuario, tipo: Exclude<ModalTipo, null>) => {
    setUsuarioSelecionado(usuario);
    setModalTipo(tipo);
    setNovoCargo(usuario.cargo === 'Banido' ? 'Usuário' : usuario.cargo === 'Usuário' ? 'Professor' : usuario.cargo);
    setMotivoBanimento('');
  };

  const closeModal = () => {
    setModalTipo(null);
    setUsuarioSelecionado(null);
    setMotivoBanimento('');
  };

  const toggleMenuAcoes = (usuarioId: string) => {
    setMenuAbertoUserId((current) => (current === usuarioId ? null : usuarioId));
  };

  const abrirModalPorAcao = (usuario: Usuario, tipo: Exclude<ModalTipo, null>) => {
    setMenuAbertoUserId(null);
    openModal(usuario, tipo);
  };

  const hasOtherActiveAdmin = () => usuarios.some((usuario) => usuario.cargo === 'Admin' && usuario.id !== usuarioSelecionado?.id);

  const updateUsuario = (id: string, patch: Partial<Usuario>) => {
    setUsuarios((current) => current.map((usuario) => (usuario.id === id ? { ...usuario, ...patch } : usuario)));
  };

  const handleAtribuir = async () => {
    if (!usuarioSelecionado) return;
    if (usuarioSelecionado.isCurrentUser && novoCargo === 'Admin' && !hasOtherActiveAdmin()) {
      Alert.alert('Ação bloqueada', 'A plataforma não pode ficar sem outro administrador ativo.');
      return;
    }

    try {
      const perfilEnviado = novoCargo === 'Usuário' ? 'padrão' : novoCargo.toLowerCase();
      await api.put(`/usuarios/${usuarioSelecionado.id}/perfil`, { perfil: perfilEnviado });
      
      updateUsuario(usuarioSelecionado.id, { cargo: novoCargo });
      closeModal();
    } catch (error) {
      Alert.alert('Erro', 'Falha ao atribuir o cargo.');
    }
  };

  const handleRevogar = async () => {
    if (!usuarioSelecionado) return;
    if (usuarioSelecionado.isCurrentUser && usuarioSelecionado.cargo === 'Admin' && !hasOtherActiveAdmin()) {
      Alert.alert('Ação bloqueada', 'A plataforma não pode ficar sem supervisão administrativa.');
      return;
    }

    try {
      await api.put(`/usuarios/${usuarioSelecionado.id}/perfil`, { perfil: 'padrão' });
      updateUsuario(usuarioSelecionado.id, { cargo: 'Usuário' });
      closeModal();
    } catch (error) {
      Alert.alert('Erro', 'Falha ao revogar privilégios.');
    }
  };

  const handleBanir = async () => {
    if (!usuarioSelecionado) return;
    if (usuarioSelecionado.isCurrentUser) {
      Alert.alert('Ação bloqueada', 'Você não pode banir a sua própria conta.');
      return;
    }

    try {
      await api.put(`/usuarios/${usuarioSelecionado.id}/status`, { 
        status: 'banido',
        motivo: motivoBanimento
      });
      updateUsuario(usuarioSelecionado.id, { cargo: 'Banido' });
      closeModal();
    } catch (error) {
      Alert.alert('Erro', 'Falha ao banir o usuário.');
    }
  };

  const handleDesbanir = async () => {
    if (!usuarioSelecionado) return;

    try {
      await api.put(`/usuarios/${usuarioSelecionado.id}/status`, { status: 'ativo' });
      updateUsuario(usuarioSelecionado.id, { cargo: 'Usuário' });
      closeModal();
    } catch (error) {
      Alert.alert('Erro', 'Falha ao desbanir o usuário.');
    }
  };

  return (
    <View style={styles.container}>
      {loading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color="#0d3f2b" />
          <Text style={{ marginTop: 10, color: '#666' }}>Carregando usuários...</Text>
        </View>
      ) : (
        <>
          <View style={styles.stickyHeader}>
            <TextInput
              style={styles.searchInput}
              placeholder="Buscar por nome ou e-mail"
              placeholderTextColor="#9b9b9b"
              value={busca}
              onChangeText={setBusca}
            />

            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filtersScroll}>
              {FILTROS.map((filtro) => {
                const isActive = filtroAtivo === filtro;
                return (
                  <TouchableOpacity
                    key={filtro}
                    style={[styles.filterBadge, isActive && styles.filterBadgeActive]}
                    onPress={() => setFiltroAtivo(filtro)}
                    activeOpacity={0.85}
                  >
                    <Text style={[styles.filterText, isActive && styles.filterTextActive]}>{filtro === 'Banido' ? 'Banidos' : filtro}</Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            <Text style={styles.resultCount}>{usuariosFiltrados.length} usuários encontrados</Text>
          </View>

          {/* LISTA DE USUÁRIOS */}
          <FlatList
            data={usuariosFiltrados}
            keyExtractor={(item) => item.id}
            onScrollBeginDrag={() => setMenuAbertoUserId(null)}
            ListFooterComponent={<View style={{ height: 320 }} />}
            renderItem={({ item }) => (
              <View style={[styles.userCard, menuAbertoUserId === item.id && styles.userCardWithMenu]}>
                
                {/* LÓGICA DO AVATAR: Foto real OU Letras coloridas */}
                {item.foto_perfil ? (
                  <Image source={{ uri: item.foto_perfil }} style={styles.avatarImage} />
                ) : (
                  <View style={[styles.avatar, { backgroundColor: avatarColorStyle[item.cargo].bg }]}>
                    <Text style={[styles.avatarText, { color: avatarColorStyle[item.cargo].text }]}>{item.iniciais}</Text>
                  </View>
                )}

                <View style={styles.userInfo}>
                  <View style={styles.nameRow}>
                    <Text style={styles.userName}>{item.nome}</Text>
                    {item.isCurrentUser ? <Text style={styles.currentUserTag}>você</Text> : null}
                    <View style={[styles.roleChip, { backgroundColor: cargoBadgeStyle[item.cargo].backgroundColor }]}>
                      <Text style={[styles.roleChipText, { color: cargoBadgeStyle[item.cargo].color }]}>{item.cargo}</Text>
                    </View>
                  </View>
                  <Text style={styles.userEmail}>{item.email}</Text>
                </View>

                <TouchableOpacity
                  accessibilityRole="button"
                  onPress={() => toggleMenuAcoes(item.id)}
                  style={styles.menuButton}
                  activeOpacity={0.8}
                >
                  <Icon name="ellipsis-vertical" size={18} color="#6f6f6f" />
                </TouchableOpacity>

                {/* MENU DE AÇÕES */}
                {menuAbertoUserId === item.id ? (
                  <View style={styles.acoesMenu}>
                    {item.cargo === 'Banido' ? (
                      <TouchableOpacity 
                        style={styles.acaoItem} 
                        activeOpacity={0.8} 
                        onPress={() => abrirModalPorAcao(item, 'desbanir')}
                      >
                        <Icon name="person-add-outline" size={18} color="#2eaf5d" />
                        <Text style={[styles.acaoItemText, styles.acaoItemSuccess]}>Desbanir Usuário</Text>
                      </TouchableOpacity>
                    ) : (
                      <>
                        {/* Lógica Inteligente: Atribuir vs Alterar */}
                        <TouchableOpacity 
                          style={styles.acaoItem} 
                          activeOpacity={0.8} 
                          onPress={() => abrirModalPorAcao(item, 'atribuir')}
                        >
                          <Icon name={item.cargo === 'Usuário' ? 'add-circle-outline' : 'create-outline'} size={18} color="#0d3f2b" />
                          <Text style={styles.acaoItemText}>
                            {item.cargo === 'Usuário' ? 'Atribuir Cargo' : 'Alterar Permissão'}
                          </Text>
                        </TouchableOpacity>

                        <View style={styles.acaoDivider} />

                        {/* O botão de Revogar SÓ aparece se a pessoa já tiver um cargo especial */}
                        {item.cargo !== 'Usuário' && (
                          <>
                            <TouchableOpacity 
                              style={styles.acaoItem} 
                              activeOpacity={0.8} 
                              onPress={() => abrirModalPorAcao(item, 'revogar')}
                            >
                              <Icon name="shield-outline" size={18} color="#c47c52" />
                              <Text style={[styles.acaoItemText, styles.acaoItemWarning]}>Revogar Cargo</Text>
                            </TouchableOpacity>

                            <View style={styles.acaoDivider} />
                          </>
                        )}

                        {/* Banir sempre aparece para usuários não-banidos */}
                        <TouchableOpacity 
                          style={styles.acaoItem} 
                          activeOpacity={0.8} 
                          onPress={() => abrirModalPorAcao(item, 'banir')}
                        >
                          <Icon name="person-remove-outline" size={18} color="#d43d2c" />
                          <Text style={[styles.acaoItemText, styles.acaoItemDanger]}>Banir Usuário</Text>
                        </TouchableOpacity>
                      </>
                    )}
                  </View>
                ) : null}
              </View>
            )}
            ListEmptyComponent={(
              <View style={styles.emptyState}>
                <Text style={styles.emptyTitle}>Nenhum usuário encontrado</Text>
                <Text style={styles.emptyText}>Ajuste o filtro ou a busca para localizar outro perfil.</Text>
              </View>
            )}
          />
        </>
      )}

      {/* MODAL DE CONFIRMAÇÃO */}
      <Modal visible={modalTipo !== null && usuarioSelecionado !== null} transparent animationType="fade" onRequestClose={closeModal}>
        <Pressable style={styles.modalOverlay} onPress={closeModal}>
          <View style={styles.modalContent} onStartShouldSetResponder={() => true}>
            {usuarioSelecionado && modalTipo ? (
              <>
                <View style={[styles.modalAlert, modalTipo === 'banir' && styles.modalAlertDanger, modalTipo === 'desbanir' && styles.modalAlertSuccess]}>
                  <Icon
                    name={modalTipo === 'banir' ? 'warning-outline' : modalTipo === 'revogar' ? 'shield-outline' : modalTipo === 'desbanir' ? 'person-add-outline' : 'person-outline'}
                    size={22}
                    color={modalTipo === 'banir' ? '#c53226' : modalTipo === 'revogar' ? '#c47c52' : modalTipo === 'desbanir' ? '#2eaf5d' : '#0d3f2b'}
                  />
                  <Text style={styles.modalAlertText}>{modalTipo === 'banir' ? 'Bloquear acesso' : modalTipo === 'desbanir' ? 'Recuperar acesso' : 'Gestão de acesso'}</Text>
                </View>

                <Text style={styles.modalTitle}>{actionLabels[modalTipo].title}</Text>
                <Text style={styles.modalSubtitle}>
                  {modalTipo === 'atribuir' && `Selecione um novo nível para ${usuarioSelecionado.nome}.`}
                  {modalTipo === 'revogar' && `O cargo atual de ${usuarioSelecionado.nome} será rebaixado para Usuário comum.`}
                  {modalTipo === 'banir' && 'A conta será inativada. O administrador poderá desbanir depois pelo mesmo fluxo.'}
                  {modalTipo === 'desbanir' && `A conta de ${usuarioSelecionado.nome} voltará a acessar a plataforma como usuário comum.`}
                </Text>

                {modalTipo === 'atribuir' ? (
                  <View style={styles.optionsGroup}>
                    {CARGOS_EDITAVEIS.map((cargo) => (
                      <TouchableOpacity
                        key={cargo}
                        style={[styles.optionCard, novoCargo === cargo && styles.optionCardActive]}
                        onPress={() => setNovoCargo(cargo)}
                        activeOpacity={0.85}
                      >
                        <View style={[styles.radio, novoCargo === cargo && styles.radioActive]}>
                          {novoCargo === cargo ? <View style={styles.radioDot} /> : null}
                        </View>
                        <View style={styles.optionTextWrap}>
                          <Text style={styles.optionTitle}>{cargo}</Text>
                          <Text style={styles.optionDescription}>
                            {cargo === 'Moderador'
                              ? 'Pode gerenciar denúncias e publicações'
                              : cargo === 'Professor'
                                ? 'Pode criar atividades e conteúdo'
                                : 'Acesso total ao painel de administração'}
                          </Text>
                        </View>
                      </TouchableOpacity>
                    ))}
                  </View>
                ) : null}

                {modalTipo === 'banir' ? (
                  <View style={styles.reasonBox}>
                    <Text style={styles.reasonLabel}>Motivo (opcional)</Text>
                    <TextInput
                      style={styles.reasonInput}
                      placeholder="Descreva o motivo do banimento..."
                      placeholderTextColor="#9d9d9d"
                      multiline
                      value={motivoBanimento}
                      onChangeText={setMotivoBanimento}
                    />
                  </View>
                ) : null}

                <View style={styles.modalActions}>
                  <TouchableOpacity style={styles.secondaryButton} onPress={closeModal} activeOpacity={0.85}>
                    <Text style={styles.secondaryButtonText}>Cancelar</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.primaryButton, { backgroundColor: actionLabels[modalTipo].accent }]}
                    onPress={modalTipo === 'atribuir' ? handleAtribuir : modalTipo === 'revogar' ? handleRevogar : modalTipo === 'banir' ? handleBanir : handleDesbanir}
                    activeOpacity={0.85}
                  >
                    <Text style={styles.primaryButtonText}>{actionLabels[modalTipo].primary}</Text>
                  </TouchableOpacity>
                </View>
              </>
            ) : null}
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  stickyHeader: {
    paddingBottom: 10,
    zIndex: 10,
  },
  searchInput: {
    backgroundColor: '#fff',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#ececec',
    color: '#222',
  },
  filtersScroll: {
    marginBottom: 10,
  },
  filterBadge: {
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 999,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#dedede',
    marginRight: 10,
  },
  filterBadgeActive: {
    backgroundColor: '#0d3f2b',
    borderColor: '#0d3f2b',
  },
  filterText: {
    color: '#555',
    fontWeight: '600',
  },
  filterTextActive: {
    color: '#fff',
  },
  resultCount: {
    color: '#8b8b8b',
    marginBottom: 14,
    fontSize: 13,
  },
  userCard: {
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    overflow: 'visible',
    zIndex: 1,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  userCardWithMenu: {
    zIndex: 200,
    elevation: 2,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarImage: {
    width: 44,
    height: 44,
    borderRadius: 22,
    marginRight: 12,
  },
  avatarText: {
    fontWeight: '800',
  },
  userInfo: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  userName: {
    fontSize: 15,
    fontWeight: '800',
    color: '#1d1d1d',
  },
  currentUserTag: {
    color: '#0d3f2b',
    fontWeight: '700',
    fontSize: 12,
  },
  roleChip: {
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 4,
  },
  roleChipText: {
    fontSize: 12,
    fontWeight: '800',
  },
  userEmail: {
    color: '#808080',
    fontSize: 12,
    marginTop: 3,
  },
  menuButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f4f4f4',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  acoesMenu: {
    position: 'absolute',
    right: 8,
    top: 56,
    width: 230,
    backgroundColor: '#fff',
    borderRadius: 16,
    paddingVertical: 8,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
    zIndex: 300,
  },
  acaoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  acaoItemText: {
    fontSize: 18,
    color: '#202020',
    fontWeight: '700',
  },
  acaoItemWarning: {
    color: '#c47c52',
  },
  acaoItemDanger: {
    color: '#d43d2c',
  },
  acaoItemSuccess: {
    color: '#2eaf5d',
  },
  acaoDivider: {
    height: 1,
    marginHorizontal: 12,
    backgroundColor: '#ededed',
  },
  emptyState: {
    marginTop: 48,
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1d1d1d',
    marginBottom: 4,
  },
  emptyText: {
    color: '#8c8c8c',
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.48)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 18,
  },
  modalContent: {
    width: '100%',
    maxWidth: 420,
    borderRadius: 28,
    backgroundColor: '#fff',
    padding: 18,
  },
  modalAlert: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 18,
    backgroundColor: '#eef8f2',
    marginBottom: 14,
    gap: 8,
  },
  modalAlertDanger: {
    backgroundColor: '#fbeceb',
  },
  modalAlertSuccess: {
    backgroundColor: '#ecf8ef',
  },
  modalAlertText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#1d1d1d',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#111',
    marginBottom: 8,
  },
  modalSubtitle: {
    color: '#6f6f6f',
    lineHeight: 20,
    marginBottom: 18,
  },
  optionsGroup: {
    gap: 10,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ececec',
    borderRadius: 18,
    padding: 14,
    backgroundColor: '#fafafa',
  },
  optionCardActive: {
    borderColor: '#0d3f2b',
    backgroundColor: '#f0f8f4',
  },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: '#c8c8c8',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  radioActive: {
    borderColor: '#0d3f2b',
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#0d3f2b',
  },
  optionTextWrap: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#1d1d1d',
  },
  optionDescription: {
    fontSize: 12,
    color: '#777',
    marginTop: 2,
    lineHeight: 17,
  },
  reasonBox: {
    marginTop: 16,
  },
  reasonLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1d1d1d',
    marginBottom: 8,
  },
  reasonInput: {
    minHeight: 92,
    borderWidth: 1,
    borderColor: '#e6e6e6',
    borderRadius: 18,
    padding: 14,
    textAlignVertical: 'top',
    backgroundColor: '#fafafa',
    color: '#222',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 18,
  },
  secondaryButton: {
    flex: 1,
    borderRadius: 16,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: '#dddddd',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  secondaryButtonText: {
    color: '#4b4b4b',
    fontWeight: '800',
  },
  primaryButton: {
    flex: 1,
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#fff',
    fontWeight: '800',
  },
});