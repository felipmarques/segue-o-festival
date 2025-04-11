
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

module.exports = async (req, res) => {
  if (req.method === 'GET') {
    const { id_evento } = req.query;

    if (!id_evento) {
      return res.status(400).json({ erro: 'Parâmetro id_evento é obrigatório' });
    }

    try {
      const query = `
        SELECT nome, descricao, cep, endereco, link_ingresso, line_up, estado, tipo_evento, 
               encode(imagem, 'base64') as imagem, data
        FROM eventos
        WHERE id_evento = $1
      `;
      const result = await pool.query(query, [id_evento]);

      if (result.rows.length === 0) {
        return res.status(404).json({ erro: 'Evento não encontrado' });
      }

      return res.status(200).json(result.rows[0]);
    } catch (error) {
      console.error('Erro ao buscar evento:', error);
      return res.status(500).json({ erro: 'Erro interno do servidor' });
    }
  } else {
    res.status(405).send('Método não permitido');
  }
};
