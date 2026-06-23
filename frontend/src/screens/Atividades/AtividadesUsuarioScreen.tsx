import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';

import {
  ExercicioAtividade,
  PraticaAtividadeResumo,
  ResultadoAtividade,
} from '../../interfaces/PraticaAtividadeInterface';

import {
  buscarAtividadePratica,
  listarAtividadesPratica,
  reiniciarAtividadePratica,
  submeterAtividadePratica,
} from '../../services/PraticaAtividadeService';

import { useAuth } from '../../contexts/AuthContext';
import { obterInsigniasUsuario } from '../../services/InsigniaService';

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
  blue: '#0065FF',
  yellow: '#F3C400',
  success: '#00C334',
  gray: '#D9D9D9',
};

const FONT = {
  title: 'InterDisplay-SemiBold',
  body: 'Inter',
};

const LETRAS = ['A', 'B', 'C', 'D'];

type ModoTela = 'lista' | 'exercicio' | 'resultado';

const coresAlternativas = [
  {border: '#FF0000', circle: '#FF7A80'},
  {border: '#0065FF', circle: '#8DB7FF'},
  {border: '#00B72F', circle: '#87EB99'},
  {border: '#F3C400', circle: '#FFE77A'},
];

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

  if (anyError?.message === 'Network Error') {
    return 'Falha na conexão. Verifique sua internet e tente novamente.';
  }

  return 'Não foi possível concluir a operação. Tente novamente.';
};

export default function AtividadesUsuarioScreen() {
  const { user } = useAuth();
  const [modo, setModo] = useState<ModoTela>('lista');
  const [atividades, setAtividades] = useState<PraticaAtividadeResumo[]>([]);
  const [exercicio, setExercicio] = useState<ExercicioAtividade | null>(null);
  const [resultado, setResultado] = useState<ResultadoAtividade | null>(null);
  const [indiceQuestao, setIndiceQuestao] = useState(0);
  const [respostas, setRespostas] = useState<number[]>([]);
  const [respostaSelecionada, setRespostaSelecionada] = useState<number | null>(
    null,
  );

  const [carregando, setCarregando] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const questaoAtual = exercicio?.questoes[indiceQuestao];

  const progresso = useMemo(() => {
    if (!exercicio || exercicio.total_questoes === 0) {
      return 0;
    }

    return (indiceQuestao + 1) / exercicio.total_questoes;
  }, [exercicio, indiceQuestao]);

  const carregarLista = useCallback(async () => {
    try {
      setCarregando(true);
      setErro(null);

      const response = await listarAtividadesPratica();
      setAtividades(response.dados);
    } catch (err) {
      setErro(mensagemErroApi(err));
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    carregarLista();
  }, [carregarLista]);

  const abrirAtividade = async (atividade: PraticaAtividadeResumo) => {
    if (atividade.concluida && atividade.resultado) {
      setResultado(atividade.resultado);
      setModo('resultado');
      return;
    }

    try {
      setCarregando(true);
      setErro(null);

      const response = await buscarAtividadePratica(atividade.id);

      if (response.status === 'concluida') {
        setResultado(response.dados as ResultadoAtividade);
        setModo('resultado');
        return;
      }

      const dados = response.dados as ExercicioAtividade;

      setExercicio(dados);
      setIndiceQuestao(0);
      setRespostas([]);
      setRespostaSelecionada(null);
      setModo('exercicio');
    } catch (err) {
      Alert.alert('Erro', mensagemErroApi(err));
    } finally {
      setCarregando(false);
    }
  };

  const voltarLista = async () => {
    setModo('lista');
    setExercicio(null);
    setResultado(null);
    setIndiceQuestao(0);
    setRespostas([]);
    setRespostaSelecionada(null);
    await carregarLista();
  };

  const avancarOuSubmeter = async () => {
    if (!exercicio || respostaSelecionada === null) {
      Alert.alert('Resposta obrigatória', 'Selecione uma alternativa.');
      return;
    }

    const novasRespostas = [...respostas];
    novasRespostas[indiceQuestao] = respostaSelecionada;

    const ultimaQuestao = indiceQuestao === exercicio.questoes.length - 1;

    if (!ultimaQuestao) {
      setRespostas(novasRespostas);
      setIndiceQuestao(indiceQuestao + 1);
      setRespostaSelecionada(novasRespostas[indiceQuestao + 1] ?? null);
      return;
    }

    try {
      setEnviando(true);
      setErro(null);

      const response = await submeterAtividadePratica(
        exercicio.id,
        novasRespostas,
      );

      setResultado(response.dados);
      setModo('resultado');
      await carregarLista();

      if (user?.id) {
        try {
          const data = await obterInsigniasUsuario(user.id);
          const conquistadaAgora = data.insignias.find(i => i.limite === data.total_atividades && i.adquirida);
          if (conquistadaAgora) {
            Alert.alert(
              "🎉 Nova Insígnia Conquistada!",
              `Parabéns! Você desbloqueou a insígnia:\n\n"${conquistadaAgora.titulo}" - ${conquistadaAgora.descricao}`
            );
          }
        } catch (badgeErr) {
          console.error("Erro ao verificar nova insígnia:", badgeErr);
        }
      }
    } catch (err) {
      const mensagem = mensagemErroApi(err);

      Alert.alert(
        'Falha na conexão',
        `${mensagem}\n\nSua resposta foi mantida nesta tela. Tente novamente quando o sinal for restabelecido.`,
      );

      setRespostas(novasRespostas);
    } finally {
      setEnviando(false);
    }
  };

  const tentarNovamenteLocal = async () => {
  if (!resultado) {
    return;
  }

  try {
    setCarregando(true);
    setErro(null);

    const response = await reiniciarAtividadePratica(resultado.atividade_id);

    setExercicio(response.dados as ExercicioAtividade);
    setResultado(null);
    setIndiceQuestao(0);
    setRespostas([]);
    setRespostaSelecionada(null);
    setModo('exercicio');
  } catch (err) {
    Alert.alert('Erro', mensagemErroApi(err));
  } finally {
    setCarregando(false);
  }

    const atividade = atividades.find(item => item.id === resultado.atividade_id);

    if (!atividade) {
      voltarLista();
      return;
    }

    abrirAtividade({
      ...atividade,
      concluida: false,
      resultado: null,
    });
  };

  const renderLista = () => (
    <ScrollView style={styles.screen} contentContainerStyle={{ flexGrow: 1, paddingBottom: 120 }} showsVerticalScrollIndicator={false}>
      <View style={styles.brandArea}>
        <View>
          <Text style={styles.brandTitle}>Atividades</Text>
          <Text style={styles.brandSubtitle}>
            Pratique vocabulários e acompanhe seus resultados.
          </Text>
        </View>

        <View style={styles.mascotePlaceholder}>
          <Icon name="school-outline" size={52} color={COLORS.green} />
        </View>
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
          <TouchableOpacity style={styles.outlineButton} onPress={carregarLista}>
            <Text style={styles.outlineButtonText}>Tentar novamente</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      {!carregando && !erro && atividades.length === 0 ? (
        <View style={styles.centerBox}>
          <Text style={styles.emptyTitle}>Nenhuma atividade disponível</Text>
          <Text style={styles.muted}>
            Quando houver atividades liberadas, elas aparecerão aqui.
          </Text>
        </View>
      ) : null}

      {atividades.map(atividade => (
        <Pressable
          key={atividade.id}
          style={styles.activityCard}
          onPress={() => abrirAtividade(atividade)}>
          <View style={styles.activityTextArea}>
            <Text style={styles.activityTitle}>{atividade.titulo}</Text>
            <Text style={styles.activityMeta}>
              {atividade.total_questoes} Questões • Atualizada em{' '}
              {formatarData(atividade.data_atualizacao || atividade.data_criacao)}
            </Text>

            {atividade.concluida ? (
              <Text style={styles.concluidaText}>
                Concluída • {atividade.resultado?.percentual ?? 0}% de acerto
              </Text>
            ) : (
              <Text style={styles.pendenteText}>Pendente</Text>
            )}
          </View>

          <Icon
            name={atividade.concluida ? 'stats-chart-outline' : 'play-outline'}
            size={24}
            color={COLORS.cinnamon}
          />
        </Pressable>
      ))}
    </ScrollView>
  );

  const renderExercicio = () => {
    if (!exercicio || !questaoAtual) {
      return null;
    }

    return (
      <View style={styles.container}>
        <View style={styles.exerciseHeader}>
          <TouchableOpacity onPress={voltarLista} style={styles.backButton}>
            <Icon name="arrow-back" size={32} color={COLORS.white} />
          </TouchableOpacity>

          <Text style={styles.exerciseTitle}>{exercicio.titulo}</Text>

          <Text style={styles.exerciseCounter}>
            {indiceQuestao + 1}/{exercicio.total_questoes}
          </Text>

          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, {width: `${progresso * 100}%`}]} />
          </View>
        </View>

        <ScrollView style={styles.exerciseBody}>
          <View style={styles.questionBox}>
            <Text style={styles.questionText}>{questaoAtual.enunciado}</Text>
          </View>

          <View style={styles.alternativesArea}>
            {questaoAtual.alternativas.map((alternativa, index) => {
              const selecionada = respostaSelecionada === index;
              const paleta = coresAlternativas[index] || coresAlternativas[0];

              return (
                <TouchableOpacity
                  key={`${indiceQuestao}-${index}`}
                  style={[
                    styles.optionCard,
                    {
                      borderColor: selecionada ? paleta.border : COLORS.white,
                    },
                  ]}
                  onPress={() => setRespostaSelecionada(index)}>
                  <View style={[styles.optionCircle, {backgroundColor: paleta.circle}]}>
                    <Text style={styles.optionLetter}>{LETRAS[index]}</Text>
                  </View>

                  <Text style={styles.optionText}>{alternativa}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </ScrollView>

        <TouchableOpacity
          disabled={enviando}
          style={[styles.nextButton, enviando && styles.disabledButton]}
          onPress={avancarOuSubmeter}>
          {enviando ? (
            <ActivityIndicator color={COLORS.lightGreen} />
          ) : (
            <Text style={styles.nextButtonText}>
              {indiceQuestao === exercicio.total_questoes - 1
                ? 'Finalizar Atividade'
                : 'Próxima Questão'}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    );
  };

  const renderResultado = () => {
    if (!resultado) {
      return null;
    }

    return (
      <ScrollView style={styles.resultScreen} contentContainerStyle={styles.resultContent}>
        <View style={styles.resultIcon}>
          <Icon name="extension-puzzle" size={44} color="#E99600" />
        </View>

        <Text style={styles.resultTitle}>{resultado.atividade_titulo}</Text>
        <Text style={styles.resultSubtitle}>Atividade Concluída!</Text>

        <View style={styles.percentCircle}>
          <Text style={styles.percentText}>{resultado.percentual}%</Text>
          <Text style={styles.percentLabel}>de acerto</Text>
        </View>

        <View style={styles.statsCard}>
          <View style={styles.statBox}>
            <Text style={[styles.statNumber, {color: COLORS.success}]}>
              {resultado.acertos}
            </Text>
            <Text style={styles.statLabel}>Acertos</Text>
          </View>

          <View style={styles.statDivider} />

          <View style={styles.statBox}>
            <Text style={[styles.statNumber, {color: COLORS.error}]}>
              {resultado.erros}
            </Text>
            <Text style={styles.statLabel}>Erros</Text>
          </View>

          <View style={styles.statDivider} />

          <View style={styles.statBox}>
            <Text style={styles.statNumber}>{resultado.total}</Text>
            <Text style={styles.statLabel}>Total</Text>
          </View>
        </View>

        <Text style={styles.encouragement}>
          Bom esforço! Você está aprendendo!
        </Text>

        <TouchableOpacity style={styles.nextButton} onPress={tentarNovamenteLocal}>
          <Text style={styles.nextButtonText}>Tentar Novamente</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.outlineLargeButton} onPress={voltarLista}>
          <Text style={styles.outlineLargeButtonText}>Voltar às Atividades</Text>
        </TouchableOpacity>
      </ScrollView>
    );
  };

  return (
    <View style={styles.container}>
      {modo === 'lista' ? renderLista() : null}
      {modo === 'exercicio' ? renderExercicio() : null}
      {modo === 'resultado' ? renderResultado() : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.ivory,
  },
  screen: {
    flex: 1,
    paddingHorizontal: 28,
    paddingTop: 40,
  },
  brandArea: {
    minHeight: 150,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    marginBottom: 18,
  },
  brandTitle: {
    color: COLORS.green,
    fontSize: 42,
    fontFamily: FONT.title,
  },
  brandSubtitle: {
    color: COLORS.muted,
    fontSize: 14,
    maxWidth: 220,
    marginTop: 4,
    fontFamily: FONT.body,
  },
  mascotePlaceholder: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: COLORS.cream,
    alignItems: 'center',
    justifyContent: 'center',
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
  errorText: {
    color: COLORS.error,
    fontFamily: FONT.body,
    textAlign: 'center',
  },
  emptyTitle: {
    color: COLORS.black,
    fontSize: 18,
    fontFamily: FONT.title,
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
  concluidaText: {
    color: COLORS.success,
    fontSize: 12,
    marginTop: 6,
    fontFamily: FONT.title,
  },
  pendenteText: {
    color: COLORS.cinnamon,
    fontSize: 12,
    marginTop: 6,
    fontFamily: FONT.title,
  },
  exerciseHeader: {
    minHeight: 160,
    backgroundColor: COLORS.green,
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
    paddingTop: 46,
    paddingHorizontal: 28,
  },
  backButton: {
    position: 'absolute',
    left: 28,
    top: 58,
    zIndex: 2,
  },
  exerciseTitle: {
    color: COLORS.white,
    fontSize: 28,
    textAlign: 'center',
    fontFamily: FONT.title,
  },
  exerciseCounter: {
    position: 'absolute',
    right: 28,
    top: 62,
    color: COLORS.lightGreen,
    fontSize: 20,
    fontFamily: FONT.title,
  },
  progressTrack: {
    height: 20,
    backgroundColor: '#2A5D4B',
    borderRadius: 20,
    marginTop: 26,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: COLORS.lightGreen,
    borderRadius: 20,
  },
  exerciseBody: {
    flex: 1,
    paddingHorizontal: 28,
    paddingTop: 42,
  },
  questionBox: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 22,
    alignItems: 'center',
    elevation: 4,
  },
  questionText: {
    color: COLORS.black,
    fontSize: 22,
    textAlign: 'center',
    fontFamily: FONT.title,
  },
  alternativesArea: {
    marginTop: 72,
    gap: 20,
  },
  optionCard: {
    minHeight: 86,
    backgroundColor: COLORS.white,
    borderRadius: 14,
    borderWidth: 3,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 32,
    elevation: 4,
  },
  optionCircle: {
    width: 54,
    height: 54,
    borderRadius: 27,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 20,
  },
  optionLetter: {
    color: COLORS.black,
    fontSize: 24,
    fontFamily: FONT.title,
  },
  optionText: {
    color: COLORS.black,
    fontSize: 24,
    fontFamily: FONT.title,
  },
  nextButton: {
    backgroundColor: COLORS.green,
    borderRadius: 18,
    paddingVertical: 22,
    alignItems: 'center',
    marginHorizontal: 28,
    marginBottom: 120,
  },
  nextButtonText: {
    color: COLORS.lightGreen,
    fontSize: 26,
    fontFamily: FONT.title,
  },
  disabledButton: {
    opacity: 0.7,
  },
  resultScreen: {
    flex: 1,
    backgroundColor: COLORS.ivory,
  },
  resultContent: {
    paddingHorizontal: 28,
    paddingTop: 70,
    paddingBottom: 120,
    alignItems: 'center',
  },
  resultIcon: {
    width: 116,
    height: 116,
    borderRadius: 58,
    backgroundColor: COLORS.cream,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resultTitle: {
    marginTop: 48,
    color: COLORS.black,
    fontSize: 40,
    textAlign: 'center',
    fontFamily: FONT.title,
  },
  resultSubtitle: {
    color: COLORS.muted,
    fontSize: 24,
    marginTop: 18,
    fontFamily: FONT.body,
  },
  percentCircle: {
    width: 230,
    height: 230,
    borderRadius: 115,
    borderWidth: 22,
    borderColor: '#E99600',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 84,
  },
  percentText: {
    color: '#E99600',
    fontSize: 48,
    fontFamily: FONT.title,
  },
  percentLabel: {
    color: COLORS.muted,
    fontSize: 20,
    fontFamily: FONT.body,
  },
  statsCard: {
    width: '100%',
    minHeight: 120,
    backgroundColor: COLORS.white,
    borderRadius: 12,
    marginTop: 70,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    elevation: 4,
  },
  statBox: {
    alignItems: 'center',
    flex: 1,
  },
  statNumber: {
    color: COLORS.black,
    fontSize: 34,
    fontFamily: FONT.title,
  },
  statLabel: {
    color: '#B0B0B0',
    fontSize: 18,
    fontFamily: FONT.title,
  },
  statDivider: {
    height: 60,
    width: 2,
    backgroundColor: '#BDBDBD',
  },
  encouragement: {
    color: COLORS.black,
    fontSize: 20,
    marginTop: 50,
    marginBottom: 58,
    textAlign: 'center',
    fontFamily: FONT.title,
  },
  outlineButton: {
    borderWidth: 1,
    borderColor: COLORS.green,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
    marginVertical: 12,
  },
  outlineButtonText: {
    color: COLORS.green,
    fontFamily: FONT.title,
  },
  outlineLargeButton: {
    borderWidth: 2,
    borderColor: COLORS.green,
    borderRadius: 18,
    paddingVertical: 20,
    alignItems: 'center',
    width: '100%',
    marginBottom: 40,
  },
  outlineLargeButtonText: {
    color: COLORS.green,
    fontSize: 26,
    fontFamily: FONT.title,
  },
});