import { db } from '../database/sqlite';

export const TraducaoLocalRepository = {
  buscarTextoOffline: async (palavra: string) => {
    try {
      const database = await db;
      const [results] = await database.executeSql(
        `SELECT t.id, t.texto as traducao, d.texto as original
         FROM traducao t
         INNER JOIN discurso d ON t.discurso_id = d.id
         WHERE d.texto LIKE ? OR t.texto LIKE ?`,
        [`%${palavra}%`, `%${palavra}%`]
      );

      let traducoesEncontradas = [];
      for (let i = 0; i < results.rows.length; ++i) {
        traducoesEncontradas.push(results.rows.item(i));
      }
      
      return traducoesEncontradas;
      
    } catch (error: any) {
      const mensagemErro = error?.message || String(error || '');

      if (mensagemErro.includes('no such table') || mensagemErro.includes('does not exist')) {
        return [];
      }

      console.error("ERRO DETALHADO DO SQLITE:", error);
      throw error;
    }
  }
};