const { Pool } = require('pg');

// Conexão com o banco de dados Neon usando a string de conexão do ambiente
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

module.exports = async (req, res) => {
  console.log('Requisição recebida:', req.method);

  if (req.method === 'GET') {
    const { id_evento } = req.query;

    if (!id_evento) {
      return res.status(400).json({ erro: 'Parâmetro id_evento é obrigatório' });
    }

    try {
      const query = `
        SELECT 
          nome,
          descricao,
          cep,
          endereco,
          link_ingresso,
          line_up,
          estado,
          tipo_evento,
          encode(imagem, 'base64') AS imagem,
          TO_CHAR(data, 'YYYY-MM-DD"T"HH24:MI:SS"Z"') AS data
        FROM eventos
        WHERE id_evento = $1
      `;

      console.log('Executando query com id_evento:', id_evento);
      const result = await pool.query(query, [id_evento]);

      if (result.rows.length === 0) {
        return res.status(404).json({ erro: 'Evento não encontrado' });
      }

      const evento = result.rows[0];

      res.status(200).json(evento);
    } catch (err) {
      console.error('Erro ao buscar evento:', err);
      res.status(500).json({ erro: 'Erro interno do servidor' });
    }
  } else {
    res.status(405).send('Método não permitido');
  }
};





