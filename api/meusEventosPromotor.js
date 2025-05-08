const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

module.exports = async (req, res) => {
  if (req.method === 'GET') {
    const { cnpj } = req.query;

    if (!cnpj) {
      return res.status(400).json({ erro: 'Erro: CNPJ do usuário não fornecido.' });
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
        return res.status(404).json({ erro: 'Nenhum evento encontrado para este usuário.' });
      }

      // Convertendo buffer da imagem para Base64 com prefixo correto
      const eventosComImagem = result.rows.map(evento => ({
        ...evento,
        imagem: evento.imagem ? `data:image/jpeg;base64,${evento.imagem.toString('base64')}` : null
      }));

      return res.status(200).json(eventosComImagem);
    } catch (error) {
      console.error('Erro ao buscar eventos:', error);
      return res.status(500).json({ erro: 'Erro ao recuperar eventos.' });
    }

  } else if (req.method === 'POST') {
    let body = req.body;

    // Garante que seja um objeto (em ambientes onde req.body pode vir como string)
    if (typeof body === 'string') {
      try {
        body = JSON.parse(body);
      } catch (err) {
        return res.status(400).json({ erro: 'JSON inválido no corpo da requisição.' });
      }
    }

    const { cpf, evento_id } = body;

    if (!cpf || !evento_id) {
      return res.status(400).json({ erro: 'Erro: CPF e ID do evento são obrigatórios.' });
    }

    try {
      const checkQuery = `SELECT 1 FROM eventos_salvos WHERE cpf = $1 AND evento_id = $2`;
      const checkResult = await pool.query(checkQuery, [cpf, evento_id]);

      if (checkResult.rowCount > 0) {
        return res.status(409).json({ erro: 'Evento já salvo anteriormente.' });
      }

      const insertQuery = `INSERT INTO eventos_salvos (cpf, evento_id) VALUES ($1, $2)`;
      await pool.query(insertQuery, [cpf, evento_id]);

      return res.status(201).json({ mensagem: 'Evento salvo com sucesso!' });
    } catch (error) {
      console.error('Erro ao salvar evento:', error);
      return res.status(500).json({ erro: 'Erro ao salvar evento.' });
    }

  } else {
    return res.status(405).json({ erro: 'Método não permitido.' });
  }
};
