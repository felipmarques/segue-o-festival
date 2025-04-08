const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

module.exports = async (req, res) => {
  if (req.method === 'GET') {
    try {
      const query = `
        SELECT id, nome, descricao, cep, endereco, link_ingresso, line_up, estado, tipo_evento, data, local, imagem 
        FROM eventos
      `;

      const result = await pool.query(query);

      // Convertemos o campo 'imagem' de bytea para base64
      const eventos = result.rows.map(evento => {
        return {
          ...evento,
          imagem: evento.imagem
            ? `data:image/png;base64,${evento.imagem.toString('base64')}`
            : null
        };
      });

      res.status(200).json(eventos);
    } catch (err) {
      console.error('Erro ao buscar eventos:', err);
      res.status(500).send('Erro ao buscar eventos.');
    }
  } else {
    res.status(405).send('Método não permitido');
  }
};

