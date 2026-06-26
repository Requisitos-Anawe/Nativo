
import { db } from '../database/sqlite';

export const TraducaoLocalRepository = {
  buscarTextoOffline: async (palavra: string) => {
    return new Promise((resolve, reject) => {
      db.transaction(tx => {
        tx.executeSql(
          `SELECT t.id, t.texto as traducao, d.texto as original
           FROM traducao t
           INNER JOIN discurso d ON t.discurso_id = d.id
           WHERE d.texto LIKE ? OR t.texto LIKE ?`,
          [`%${palavra}%`, `%${palavra}%`],
          (_, results) => {
            let traducoesEncontradas = [];
            for (let i = 0; i < results.rows.length; ++i) {
              traducoesEncontradas.push(results.rows.item(i));
            }
            resolve(traducoesEncontradas);
          },
          (_, error) => {
            reject(error);
            return false;
          }
        );
      });
    });
  }
};