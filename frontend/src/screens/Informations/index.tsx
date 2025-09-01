import React from 'react';
import { Text, TouchableOpacity } from 'react-native';
import ScreenContainer from '../../components/ScreenContainer';
import styles from './styles';
import DownloadFile from '../../components/DownloadFile';

export default function Informations() {

  return (
    <ScreenContainer>
      <Text style={styles.title} >Olá, bem vindo(a)</Text>

      <TouchableOpacity onPress={() => DownloadFile('https://drive.google.com/uc?export=download&id=176jdwMj0g_sQptlPF0SDREApmtjs82Jl')}>
        <Text style={styles.link}>Clique aqui para baixar o manual do aplicativo</Text>
      </TouchableOpacity>

      <Text style={styles.paragraphTitle} >O app:</Text>
      <Text style={styles.paragraph} >O aplicativo teve origem a partir de um Trabalho de Conclusão de Curso (TCC) da Universidade de Brasília (UnB), desenvolvido pela estudante Alexia Cardoso do curso de Engenharia de Software. O projeto foi orientado pelo professor Dr. Sergio Freitas e contou com a coorientação da professora Dra. Célia Higawa.</Text>
      <Text style={styles.paragraph} >Tem como propósito contribuir com a preservação e o ensino das línguas indígenas brasileiras. A ferramenta permite realizar traduções escritas de palavras e expressões entre o português e línguas indígenas, com foco inicial na língua Munduruku.</Text>
      <Text style={styles.paragraph} >O projeto prevê futuras melhorias, como a inclusão de áudios, imagens e novos idiomas, sempre priorizando a valorização das línguas indígenas e sua continuidade.</Text>

      <Text style={styles.paragraphTitle} >A aldeia:</Text>
      <Text style={styles.paragraph}>Este trabalho começou a partir do contato da professora Celia Kinuko Matsunaga Higawa, da Universidade de Brasília, com a Aldeia Munduruku de Bragança, a Aldeia demonstrou interesse em ter um aplicativo para ajudar na consulta e ensino da língua Munduruku. Conversando com os representantes da comunidade, foi definido que o aplicativo teria o formato de um tradutor, que pudesse ser usado no dia a dia para consultar palavras e frases, além de possibilitar ouvir a pronúncia correta delas (implementação futura).</Text>
    </ScreenContainer>
  );
}
