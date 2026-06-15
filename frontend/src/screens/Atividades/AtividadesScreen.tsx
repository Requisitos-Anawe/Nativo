import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';

import {
  Atividade,
  AtividadePayload,
  ProfessorOption,
  QuestaoAtividade,
} from '../../interfaces/AtividadeInterface';

import {
  atualizarAtividade,
  criarAtividade,
  excluirAtividade,
  listarAtividades,
  listarProfessores,
} from '../../services/AtividadeService';

const COLORS = {
  black: '#171918',
  green: '#043222',
  lightGreen: '#ffffff',
  cream: '#F6E9D9',
  cinnamon: '#B67150',
  ivory: '#F6F3F4',
  white: '#FFFFFF',
  error: '#D84B35',
  muted: '#777777',
};

const FONT = {
  title: 'InterDisplay-SemiBold',
  body: 'Inter',
};

const LETRAS = ['A', 'B', 'C', 'D'];

type ModoTela = 'lista' | 'formulario' | 'detalhe';

type FormState = {
  titulo: string;
  descricao: string;
  questoes: QuestaoAtividade[];
  professores_ids: string[];
};

const criarQuestaoVazia = (): QuestaoAtividade => ({
  enunciado: '',
  alternativas: ['', '', '', ''],
  alternativa_correta: 0,
});

const criarFormularioVazio = (): FormState => ({
  titulo: '',
  descricao: '',
  questoes: [criarQuestaoVazia()],
  professores_ids: [],
});

const montarFormulario = (atividade: Atividade): FormState => ({
  titulo: atividade.titulo || '',
  descricao: atividade.descricao || '',
  questoes:
    atividade.questoes && atividade.questoes.length > 0
      ? atividade.questoes.map(questao => ({
          enunciado: questao.enunciado || '',
          alternativas: [...questao.alternativas, '', '', '', ''].slice(0, 4),
          alternativa_correta: questao.alternativa_correta ?? 0,
        }))
      : [criarQuestaoVazia()],
  professores_ids: atividade.professores_associados || [],
});

const formatarData = (data?: string): string => {
  if (!data) {
    return 'sem data';
  }

  const date = new Date(data);

  if (Number.isNaN(date.getTime())) {
    return data;
  }

  return date.toLocaleDateString('pt-BR');
};

const mensagemErroApi = (erro: unknown): string => {
  const anyError = erro as any;
  const data = anyError?.response?.data;

  if (typeof data?.erro === 'string') {
    return data.erro;
  }

  if (typeof data?.message === 'string') {
    return data.message;
  }

  return 'Não foi possível concluir a operação. Tente novamente.';
};

export default function AtividadesScreen() {
  const [modo, setModo] = useState<ModoTela>('lista');
  const [atividades, setAtividades] = useState<Atividade[]>([]);
  const [professores, setProfessores] = useState<ProfessorOption[]>([]);
  const [atividadeSelecionada, setAtividadeSelecionada] =
    useState<Atividade | null>(null);

  const [formulario, setFormulario] = useState<FormState>(
    criarFormularioVazio(),
  );

  const [carregando, setCarregando] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [erroFormulario, setErroFormulario] = useState<string | null>(null);
  const [cursor, setCursor] = useState<string | null>(null);

  const isEdicao = Boolean(atividadeSelecionada);

  const tituloTela = useMemo(() => {
    if (modo === 'formulario') {
      return isEdicao ? 'Editar Atividade' : 'Nova Atividade';
    }

    if (modo === 'detalhe') {
      return 'Detalhes';
    }

    return 'Atividades';
  }, [isEdicao, modo]);

  const carregarProfessores = useCallback(async () => {
    try {
      const dados = await listarProfessores();
      setProfessores(dados);
    } catch {
      setProfessores([]);
    }
  }, []);

  const carregarAtividades = useCallback(async (reset = true) => {
    try {
      setCarregando(true);
      setErro(null);

      const resposta = await listarAtividades(20, reset ? null : cursor);

      setAtividades(atuais =>
        reset ? resposta.dados : [...atuais, ...resposta.dados],
      );

      setCursor(resposta.paginacao?.proximo_cursor || null);
    } catch (err) {
      setErro(mensagemErroApi(err));
    } finally {
      setCarregando(false);
    }
  }, [cursor]);

  useEffect(() => {
    carregarAtividades(true);
    carregarProfessores();
  }, [carregarAtividades, carregarProfessores]);

  const abrirCriacao = () => {
    setAtividadeSelecionada(null);
    setFormulario(criarFormularioVazio());
    setErroFormulario(null);
    setModo('formulario');
  };

  const abrirEdicao = (atividade: Atividade) => {
    setAtividadeSelecionada(atividade);
    setFormulario(montarFormulario(atividade));
    setErroFormulario(null);
    setModo('formulario');
  };

  const abrirDetalhe = (atividade: Atividade) => {
    setAtividadeSelecionada(atividade);
    setModo('detalhe');
  };

  const voltarLista = () => {
    setModo('lista');
    setAtividadeSelecionada(null);
    setFormulario(criarFormularioVazio());
    setErroFormulario(null);
  };

  const atualizarQuestao = (
    indice: number,
    atualizacao: Partial<QuestaoAtividade>,
  ) => {
    setFormulario(atual => ({
      ...atual,
      questoes: atual.questoes.map((questao, index) =>
        index === indice ? {...questao, ...atualizacao} : questao,
      ),
    }));
  };

  const atualizarAlternativa = (
    indiceQuestao: number,
    indiceAlternativa: number,
    valor: string,
  ) => {
    setFormulario(atual => ({
      ...atual,
      questoes: atual.questoes.map((questao, index) => {
        if (index !== indiceQuestao) {
          return questao;
        }

        const alternativas = [...questao.alternativas];
        alternativas[indiceAlternativa] = valor;

        return {...questao, alternativas};
      }),
    }));
  };

  const adicionarQuestao = () => {
    setFormulario(atual => ({
      ...atual,
      questoes: [...atual.questoes, criarQuestaoVazia()],
    }));
  };

  const removerQuestao = (indice: number) => {
    setFormulario(atual => {
      if (atual.questoes.length === 1) {
        return atual;
      }

      return {
        ...atual,
        questoes: atual.questoes.filter((_, index) => index !== indice),
      };
    });
  };

  const alternarProfessor = (professorId: string) => {
    setFormulario(atual => {
      const selecionado = atual.professores_ids.includes(professorId);

      return {
        ...atual,
        professores_ids: selecionado
          ? atual.professores_ids.filter(id => id !== professorId)
          : [...atual.professores_ids, professorId],
      };
    });
  };

  const validarFormulario = (): string | null => {
    if (!formulario.titulo.trim()) {
      return 'Informe o nome da atividade.';
    }

    if (formulario.questoes.length === 0) {
      return 'Adicione pelo menos uma questão.';
    }

    for (let i = 0; i < formulario.questoes.length; i += 1) {
      const questao = formulario.questoes[i];
      const alternativas = questao.alternativas.map(item => item.trim());

      if (!questao.enunciado.trim()) {
        return `Informe o enunciado da questão ${i + 1}.`;
      }

      if (alternativas.filter(Boolean).length < 2) {
        return `A questão ${i + 1} precisa ter pelo menos duas alternativas.`;
      }

      const normalizadas = alternativas
        .filter(Boolean)
        .map(item => item.toLowerCase());

      if (new Set(normalizadas).size !== normalizadas.length) {
        return `A questão ${i + 1} possui alternativas duplicadas.`;
      }

      if (!alternativas[questao.alternativa_correta]) {
        return `Marque uma alternativa correta válida na questão ${i + 1}.`;
      }
    }

    return null;
  };

  const montarPayload = (): AtividadePayload => ({
    titulo: formulario.titulo.trim(),
    descricao: formulario.descricao.trim() || null,
    questoes: formulario.questoes.map(questao => ({
      enunciado: questao.enunciado.trim(),
      alternativas: questao.alternativas.map(item => item.trim()).filter(Boolean),
      alternativa_correta: questao.alternativa_correta,
    })),
    professores_ids: formulario.professores_ids,
  });

  const salvar = async () => {
    const erroValidacao = validarFormulario();

    if (erroValidacao) {
      setErroFormulario(erroValidacao);
      return;
    }

    try {
      setSalvando(true);
      setErroFormulario(null);

      const payload = montarPayload();

      if (atividadeSelecionada) {
        await atualizarAtividade(atividadeSelecionada.id, payload);
      } else {
        await criarAtividade(payload);
      }

      await carregarAtividades(true);
      voltarLista();
    } catch (err) {
      setErroFormulario(mensagemErroApi(err));
    } finally {
      setSalvando(false);
    }
  };

  const confirmarExclusao = (atividade: Atividade) => {
    Alert.alert(
      'Excluir atividade',
      'Deseja realmente excluir esta atividade? Esta ação não poderá ser desfeita.',
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: () => removerAtividade(atividade.id),
        },
      ],
    );
  };

  const removerAtividade = async (atividadeId: string) => {
    try {
      await excluirAtividade(atividadeId);
      await carregarAtividades(true);
      voltarLista();
    } catch (err) {
      Alert.alert('Erro', mensagemErroApi(err));
    }
  };

  const renderHeader = () => (
    <View style={styles.header}>
      {modo !== 'lista' ? (
        <TouchableOpacity onPress={voltarLista} style={styles.backButton}>
          <Icon name="arrow-back" size={32} color={COLORS.white} />
        </TouchableOpacity>
      ) : null}

      <Text style={styles.headerTitle}>{tituloTela}</Text>
    </View>
  );

  const renderLista = () => (
    <View style={styles.screen}>
      <View style={styles.brandArea}>
        <Text style={styles.brandTitle}>Atividades</Text>
      </View>

      {carregando && atividades.length === 0 ? (
        <View style={styles.centerBox}>
          <ActivityIndicator color={COLORS.green} />
          <Text style={styles.muted}>Carregando atividades...</Text>
        </View>
      ) : null}

      {erro ? (
        <View style={styles.centerBox}>
          <Text style={styles.errorText}>{erro}</Text>
          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => carregarAtividades(true)}>
            <Text style={styles.secondaryButtonText}>Tentar novamente</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      {!carregando && !erro && atividades.length === 0 ? (
        <View style={styles.centerBox}>
          <Text style={styles.emptyTitle}>Nenhuma atividade cadastrada</Text>
          <Text style={styles.muted}>
            Crie uma atividade para começar a organizar seus exercícios.
          </Text>
        </View>
      ) : null}

      {atividades.map(atividade => (
        <Pressable
          key={atividade.id}
          style={styles.activityCard}
          onPress={() => abrirDetalhe(atividade)}>
          <View style={styles.activityTextArea}>
            <Text style={styles.activityTitle}>{atividade.titulo}</Text>
            <Text style={styles.activityMeta}>
              {atividade.questoes?.length || 0} Questões • Atualizada em{' '}
              {formatarData(atividade.data_atualizacao || atividade.data_criacao)}
            </Text>
          </View>

          <View style={styles.cardActions}>
            <TouchableOpacity onPress={() => abrirEdicao(atividade)}>
              <Icon name="pencil" size={20} color={COLORS.cinnamon} />
            </TouchableOpacity>

            <TouchableOpacity onPress={() => confirmarExclusao(atividade)}>
              <Icon name="trash-outline" size={20} color={COLORS.error} />
            </TouchableOpacity>
          </View>
        </Pressable>
      ))}

      {cursor ? (
        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={() => carregarAtividades(false)}>
          <Text style={styles.secondaryButtonText}>Carregar mais</Text>
        </TouchableOpacity>
      ) : null}

      <TouchableOpacity style={styles.createButton} onPress={abrirCriacao}>
        <Text style={styles.createButtonText}>+ Criar Atividade</Text>
      </TouchableOpacity>
    </View>
  );

  const renderFormulario = () => (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.formScreen}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <Text style={styles.label}>Nome da Atividade *</Text>

        <TextInput
          value={formulario.titulo}
          onChangeText={titulo => setFormulario(atual => ({...atual, titulo}))}
          placeholder="Ex: Vocabulário básico Guarani"
          placeholderTextColor={COLORS.muted}
          style={styles.input}
        />

        {formulario.questoes.map((questao, indiceQuestao) => (
          <View key={`questao-${indiceQuestao}`} style={styles.questionCard}>
            <View style={styles.questionHeader}>
              <Text style={styles.questionTitle}>Questão {indiceQuestao + 1}</Text>

              {formulario.questoes.length > 1 ? (
                <TouchableOpacity onPress={() => removerQuestao(indiceQuestao)}>
                  <Icon name="trash-outline" size={22} color={COLORS.error} />
                </TouchableOpacity>
              ) : null}
            </View>

            <Text style={styles.label}>Enunciado *</Text>

            <TextInput
              value={questao.enunciado}
              onChangeText={enunciado =>
                atualizarQuestao(indiceQuestao, {enunciado})
              }
              placeholder="Escreva o enunciado da questão..."
              placeholderTextColor={COLORS.muted}
              style={styles.input}
            />

            <Text style={styles.label}>
              Alternativas * <Text style={styles.inlineMuted}>(marque a correta)</Text>
            </Text>

            {questao.alternativas.map((alternativa, indiceAlternativa) => {
              const correta = questao.alternativa_correta === indiceAlternativa;

              return (
                <View
                  key={`q-${indiceQuestao}-alt-${indiceAlternativa}`}
                  style={styles.alternativeRow}>
                  <TouchableOpacity
                    style={[
                      styles.letterCircle,
                      correta && styles.letterCircleSelected,
                    ]}
                    onPress={() =>
                      atualizarQuestao(indiceQuestao, {
                        alternativa_correta: indiceAlternativa,
                      })
                    }>
                    <Text style={styles.letterText}>
                      {LETRAS[indiceAlternativa]}
                    </Text>
                  </TouchableOpacity>

                  <TextInput
                    value={alternativa}
                    onChangeText={valor =>
                      atualizarAlternativa(
                        indiceQuestao,
                        indiceAlternativa,
                        valor,
                      )
                    }
                    placeholder={`Alternativa ${LETRAS[indiceAlternativa]}`}
                    placeholderTextColor={COLORS.muted}
                    style={[
                      styles.alternativeInput,
                      correta && styles.alternativeInputSelected,
                    ]}
                  />
                </View>
              );
            })}
          </View>
        ))}

        <TouchableOpacity style={styles.addQuestionButton} onPress={adicionarQuestao}>
          <Text style={styles.addQuestionText}>+ Adicionar Questão</Text>
        </TouchableOpacity>

        <Text style={styles.label}>Professores adicionais</Text>

        <Text style={styles.helpText}>
          Você já está associado automaticamente. Selecione apenas professores
          colaboradores.
        </Text>

        {professores.length === 0 ? (
          <Text style={styles.muted}>Nenhum professor adicional disponível.</Text>
        ) : (
          <View style={styles.professorList}>
            {professores.map(professor => {
              const selecionado = formulario.professores_ids.includes(professor.id);

              return (
                <TouchableOpacity
                  key={professor.id}
                  style={[
                    styles.professorChip,
                    selecionado && styles.professorChipSelected,
                  ]}
                  onPress={() => alternarProfessor(professor.id)}>
                  <Text
                    style={[
                      styles.professorChipText,
                      selecionado && styles.professorChipTextSelected,
                    ]}>
                    {professor.nome}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {erroFormulario ? (
          <Text style={styles.formError}>{erroFormulario}</Text>
        ) : null}

        <TouchableOpacity
          disabled={salvando}
          style={[styles.saveButton, salvando && styles.disabledButton]}
          onPress={salvar}>
          {salvando ? (
            <ActivityIndicator color={COLORS.lightGreen} />
          ) : (
            <Text style={styles.saveButtonText}>
              {isEdicao ? 'Salvar Alterações' : 'Salvar Atividade'}
            </Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );

  const renderDetalhe = () => {
    if (!atividadeSelecionada) {
      return null;
    }

    return (
      <ScrollView style={styles.formScreen} showsVerticalScrollIndicator={false}>
        <View style={styles.detailCard}>
          <Text style={styles.detailTitle}>{atividadeSelecionada.titulo}</Text>

          <Text style={styles.activityMeta}>
            {atividadeSelecionada.questoes?.length || 0} questões • Atualizada em{' '}
            {formatarData(
              atividadeSelecionada.data_atualizacao ||
                atividadeSelecionada.data_criacao,
            )}
          </Text>

          {atividadeSelecionada.descricao ? (
            <Text style={styles.detailDescription}>
              {atividadeSelecionada.descricao}
            </Text>
          ) : null}

          {atividadeSelecionada.questoes.map((questao, indice) => (
            <View key={`detalhe-${indice}`} style={styles.detailQuestion}>
              <Text style={styles.questionTitle}>Questão {indice + 1}</Text>
              <Text style={styles.detailEnunciado}>{questao.enunciado}</Text>

              {questao.alternativas.map((alternativa, altIndex) => (
                <View key={`detalhe-${indice}-${altIndex}`} style={styles.detailAlt}>
                  <Text
                    style={[
                      styles.detailAltText,
                      questao.alternativa_correta === altIndex &&
                        styles.detailAltTextCorrect,
                    ]}>
                    {LETRAS[altIndex]}. {alternativa}
                  </Text>
                </View>
              ))}
            </View>
          ))}
        </View>

        <TouchableOpacity
          style={styles.addQuestionButton}
          onPress={() => abrirEdicao(atividadeSelecionada)}>
          <Text style={styles.addQuestionText}>Editar Atividade</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => confirmarExclusao(atividadeSelecionada)}>
          <Text style={styles.deleteButtonText}>Excluir Atividade</Text>
        </TouchableOpacity>
      </ScrollView>
    );
  };

  return (
    <View style={styles.container}>
      {renderHeader()}

      {modo === 'lista' ? renderLista() : null}
      {modo === 'formulario' ? renderFormulario() : null}
      {modo === 'detalhe' ? renderDetalhe() : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.ivory,
  },
  header: {
    minHeight: 126,
    backgroundColor: COLORS.green,
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 24,
  },
  backButton: {
    position: 'absolute',
    left: 28,
    top: 54,
  },
  headerTitle: {
    color: COLORS.white,
    fontSize: 28,
    fontFamily: FONT.title,
  },
  screen: {
    flex: 1,
    paddingHorizontal: 28,
    paddingTop: 28,
  },
  brandArea: {
    minHeight: 120,
    justifyContent: 'flex-end',
  },
  brandTitle: {
    color: COLORS.green,
    fontSize: 44,
    fontFamily: FONT.title,
  },
  centerBox: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 18,
    marginVertical: 12,
    alignItems: 'center',
    gap: 8,
  },
  muted: {
    color: COLORS.muted,
    fontFamily: FONT.body,
  },
  emptyTitle: {
    color: COLORS.black,
    fontSize: 18,
    fontFamily: FONT.title,
  },
  errorText: {
    color: COLORS.error,
    fontFamily: FONT.body,
    textAlign: 'center',
  },
  activityCard: {
    backgroundColor: COLORS.white,
    borderRadius: 10,
    padding: 16,
    marginBottom: 18,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 4,
    shadowColor: COLORS.black,
    shadowOpacity: 0.15,
    shadowRadius: 6,
  },
  activityTextArea: {
    flex: 1,
  },
  activityTitle: {
    color: COLORS.black,
    fontSize: 20,
    fontFamily: FONT.title,
  },
  activityMeta: {
    color: COLORS.muted,
    fontSize: 12,
    marginTop: 8,
    fontFamily: FONT.body,
  },
  cardActions: {
    flexDirection: 'row',
    gap: 12,
  },
  createButton: {
    backgroundColor: COLORS.green,
    borderRadius: 14,
    paddingVertical: 18,
    alignItems: 'center',
    marginTop: 'auto',
    marginBottom: 28,
  },
  createButtonText: {
    color: COLORS.lightGreen,
    fontSize: 20,
    fontFamily: FONT.title,
  },
  formScreen: {
    flex: 1,
    padding: 28,
  },
  label: {
    color: COLORS.black,
    fontSize: 18,
    marginBottom: 10,
    marginTop: 14,
    fontFamily: FONT.title,
  },
  input: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    minHeight: 54,
    paddingHorizontal: 18,
    fontSize: 16,
    color: COLORS.black,
    fontFamily: FONT.body,
    elevation: 4,
  },
  questionCard: {
    backgroundColor: COLORS.white,
    borderRadius: 14,
    padding: 18,
    marginTop: 22,
    elevation: 4,
  },
  questionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  questionTitle: {
    color: COLORS.black,
    fontSize: 22,
    fontFamily: FONT.title,
  },
  inlineMuted: {
    color: COLORS.muted,
    fontFamily: FONT.body,
  },
  alternativeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 12,
  },
  letterCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.ivory,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
  },
  letterCircleSelected: {
    backgroundColor: '#80E892',
  },
  letterText: {
    color: COLORS.black,
    fontSize: 18,
    fontFamily: FONT.title,
  },
  alternativeInput: {
    flex: 1,
    backgroundColor: COLORS.ivory,
    borderRadius: 12,
    minHeight: 52,
    paddingHorizontal: 16,
    color: COLORS.black,
    fontSize: 16,
    fontFamily: FONT.body,
    elevation: 3,
  },
  alternativeInputSelected: {
    borderWidth: 2,
    borderColor: '#16C93A',
    backgroundColor: '#C7F4CC',
  },
  addQuestionButton: {
    borderWidth: 2,
    borderColor: COLORS.green,
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 20,
  },
  addQuestionText: {
    color: COLORS.green,
    fontSize: 20,
    fontFamily: FONT.title,
  },
  helpText: {
    color: COLORS.muted,
    marginBottom: 12,
    fontFamily: FONT.body,
  },
  professorList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  professorChip: {
    borderWidth: 1,
    borderColor: COLORS.green,
    borderRadius: 18,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  professorChipSelected: {
    backgroundColor: COLORS.green,
  },
  professorChipText: {
    color: COLORS.green,
    fontFamily: FONT.body,
  },
  professorChipTextSelected: {
    color: COLORS.white,
  },
  formError: {
    color: COLORS.error,
    marginTop: 16,
    fontFamily: FONT.body,
  },
  saveButton: {
    backgroundColor: COLORS.green,
    borderRadius: 16,
    paddingVertical: 20,
    alignItems: 'center',
    marginTop: 28,
    marginBottom: 32,
  },
  saveButtonText: {
    color: COLORS.lightGreen,
    fontSize: 22,
    fontFamily: FONT.title,
  },
  disabledButton: {
    opacity: 0.6,
  },
  secondaryButton: {
    borderWidth: 1,
    borderColor: COLORS.green,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
    marginVertical: 12,
  },
  secondaryButtonText: {
    color: COLORS.green,
    fontFamily: FONT.title,
  },
  deleteButton: {
    borderWidth: 1,
    borderColor: COLORS.error,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 32,
  },
  deleteButtonText: {
    color: COLORS.error,
    fontFamily: FONT.title,
  },
  detailCard: {
    backgroundColor: COLORS.white,
    borderRadius: 14,
    padding: 18,
    elevation: 4,
  },
  detailTitle: {
    color: COLORS.black,
    fontSize: 26,
    fontFamily: FONT.title,
  },
  detailDescription: {
    color: COLORS.black,
    fontSize: 15,
    marginTop: 14,
    fontFamily: FONT.body,
  },
  detailQuestion: {
    marginTop: 22,
  },
  detailEnunciado: {
    color: COLORS.black,
    fontSize: 16,
    marginVertical: 8,
    fontFamily: FONT.body,
  },
  detailAlt: {
    backgroundColor: COLORS.ivory,
    borderRadius: 10,
    padding: 12,
    marginTop: 8,
  },
  detailAltText: {
    color: COLORS.black,
    fontFamily: FONT.body,
  },
  detailAltTextCorrect: {
    color: COLORS.green,
    fontFamily: FONT.title,
  },
});