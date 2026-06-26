// src/services/SyncOfflineService.ts
import { db } from '../database/sqlite';
import api from './api';
import RNFS from 'react-native-fs'; // Para checar espaço
import NetInfo from '@react-native-community/netinfo';

export const SyncOfflineService = {

    prepararSincronizacao: async () => {
        try {
            const fsInfo = await RNFS.getFSInfo();
            const espacoLivreMB = fsInfo.freeSpace / (1024 * 1024);

            const respostaHead = await api.head('/sync/banco_traducoes');
            const tamanhoBytes = respostaHead.headers['content-length'] || 5000000; // Fallback 5MB
            const tamanhoMB = Number(tamanhoBytes) / (1024 * 1024);

            if (espacoLivreMB < tamanhoMB + 50) {
                throw new Error('ESPACO_INSUFICIENTE');
            }

            return tamanhoMB.toFixed(2); //retorna o tamanho para a tela exibir
        } catch (erro) {
            throw erro;
        }
    },

    iniciarDownload: async (onProgress: (porcentagem: number) => void) => {
        return new Promise(async (resolve, reject) => {
            try {
                const unsubscribeNet = NetInfo.addEventListener(state => {
                    if (!state.isConnected) {
                        unsubscribeNet();
                        reject(new Error('QUEDA_CONEXAO'));
                    }
                });

                const resposta = await api.get('/sync/banco_traducoes', {
                    onDownloadProgress: (progressEvent) => {
                        if (progressEvent.total) {
                            const porcentagem = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                            onProgress(porcentagem); //atualiza a barra visual na tela
                        }
                    }
                });

                const { discursos, traducoes } = resposta.data;
                const database = await db;

                await database.executeSql('CREATE TABLE IF NOT EXISTS discurso (id TEXT PRIMARY KEY, texto TEXT, idioma TEXT, categoria TEXT)');
                await database.executeSql('CREATE TABLE IF NOT EXISTS traducao (id TEXT PRIMARY KEY, discurso_id TEXT, texto TEXT, idioma TEXT)');

                await database.executeSql('DELETE FROM discurso;');
                await database.executeSql('DELETE FROM traducao;');

                for (const d of discursos) {
                    await database.executeSql(
                        'INSERT INTO discurso (id, texto, idioma, categoria) VALUES (?, ?, ?, ?)',
                        [d.id, d.texto, d.idioma, d.discurso_categoria]
                    );
                }

                for (const t of traducoes) {
                    await database.executeSql(
                        'INSERT INTO traducao (id, discurso_id, texto, idioma) VALUES (?, ?, ?, ?)',
                        [t.id, t.discurso_id, t.texto, t.idioma]
                    );
                }

                await database.executeSql('CREATE TABLE IF NOT EXISTS sync_meta (id INTEGER PRIMARY KEY, data_atualizacao TEXT)');
                await database.executeSql('DELETE FROM sync_meta;');
                await database.executeSql('INSERT INTO sync_meta (data_atualizacao) VALUES (?)', [new Date().toISOString()]);

                unsubscribeNet();
                resolve(true);

            } catch (erro) {
                reject(erro);
            }
        });
    }
};