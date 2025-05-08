const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

module.exports = async (req, res) => {
  if (req.method === 'GET') {
    const { cpf, cnpj } = req.query; // ✅ Permite buscas por CPF e CNPJ

    if (!cpf && !cnpj) {
      return res.status(400).send('Erro: CPF ou CNPJ do usuário não fornecido.');
    }

    try {
      let query, param;
      
      if (cpf) {
        // 🔹 Buscar eventos salvos pelo cliente
        query = `
          SELECT e.* 
          FROM eventos e
          JOIN eventos_salvos es ON e.id = es.evento_id
          WHERE es.cpf = $1
          ORDER BY e.data DESC;
        `;
        param = [cpf];
      } else {
        // 🔹 Buscar eventos cadastrados pelo promotor
        query = `
          SELECT e.* FROM eventos e
          WHERE e.id_promotor = $1
          ORDER BY e.data DESC;
        `;
        param = [cnpj];
      }

      const result = await pool.query(query, param);

      if (result.rows.length === 0) {
        return res.status(404).send('Nenhum evento encontrado.');
      }

      res.status(200).json(result.rows);
    } catch (error) {
      console.error('Erro ao buscar eventos:', error);
      res.status(500).send('Erro ao recuperar eventos.');
    }
  } else if (req.method === 'POST') {
    const { cpf, evento_id } = req.body;

    if (!cpf || !evento_id) {
      return res.status(400).send('Erro: CPF e ID do evento são obrigatórios.');
    }

    try {
      const checkQuery = `SELECT 1 FROM eventos_salvos WHERE cpf = $1 AND evento_id = $2`;
      const checkResult = await pool.query(checkQuery, [cpf, evento_id]);

      if (checkResult.rowCount > 0) {
        return res.status(409).send('Evento já salvo anteriormente.');
      }

      const insertQuery = `INSERT INTO eventos_salvos (cpf, evento_id) VALUES ($1, $2)`;
      await pool.query(insertQuery, [cpf, evento_id]);

      res.status(201).send('Evento salvo com sucesso!');
    } catch (error) {
      console.error('Erro ao salvar evento:", error);
      res.status(500).send('Erro ao salvar evento.');
    }
  } else {
    res.status(405).send('Método não permitido.');
  }
};
