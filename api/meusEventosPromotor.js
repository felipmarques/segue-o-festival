const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

module.exports = async (req, res) => {
  if (req.method === 'GET') {
    // 🔹 BUSCAR eventos do promotor
    const { cnpj } = req.query;

    if (!cnpj) {
      return res.status(400).send('Erro: CNPJ do usuário não fornecido.');
    }

    try {
      const query = `
        SELECT e.* 
        FROM eventos e
        JOIN usuario_promotor u ON e.id_promotor = u.cnpj
        WHERE u.cnpj = $1
        ORDER BY e.data DESC;
      `;

      const result = await pool.query(query, [cnpj]);

      if (result.rows.length === 0) {
        return res.status(404).send('Nenhum evento encontrado para este usuário.');
      }

      // Convertendo buffer da imagem para Base64 com prefixo correto
      const eventosComImagem = result.rows.map(evento => ({
        ...evento,
        imagem: evento.imagem ? `data:image/jpeg;base64,${evento.imagem.toString('base64')}` : null
      }));

      res.status(200).json(eventosComImagem);
    } catch (error) {
      console.error('Erro ao buscar eventos:', error);
      res.status(500).send('Erro ao recuperar eventos.');
    }
  } 

  else if (req.method === 'POST') {
    // 🔹 SALVAR evento para o usuário
    const { cpf, evento_id } = req.body;

    if (!cpf || !evento_id) {
      return res.status(400).send('Erro: CPF e ID do evento são obrigatórios.');
    }

    try {
      // Verifica se o evento já foi salvo pelo usuário
      const checkQuery = `SELECT 1 FROM eventos_salvos WHERE cpf = $1 AND evento_id = $2`;
      const checkResult = await pool.query(checkQuery, [cpf, evento_id]);

      if (checkResult.rowCount > 0) {
        return res.status(409).send('Evento já salvo anteriormente.');
      }

      // Insere o evento salvo na tabela eventos_salvos
      const insertQuery = `INSERT INTO eventos_salvos (cpf, evento_id) VALUES ($1, $2)`;
      await pool.query(insertQuery, [cpf, evento_id]);

      res.status(201).send('Evento salvo com sucesso!');
    } catch (error) {
      console.error('Erro ao salvar evento:', error);
      res.status(500).send('Erro ao salvar evento.');
    }
  } 
  
  else {
    res.status(405).send('Método não permitido.');
  }
};
