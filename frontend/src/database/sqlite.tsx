import { enablePromise, openDatabase } from 'react-native-sqlite-storage';

enablePromise(true);

export const db = openDatabase(
  {
    name: 'acervo_nativo.db',
    location: 'default',
  },
  () => console.log('Banco de dados local iniciado com sucesso!'),
  (erro) => console.error('Erro ao iniciar o banco de dados local:', erro)
);