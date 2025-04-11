const { Pool } = require('pg');

// Conexão com o banco de dados Neon usando a string de conexão configurada no ambiente
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

module.exports = async (req, res) => {
  console.log('Requisição recebida:', req.method);

  if (req.method === 'GET') {
    try {
      const query = `
        SELECT id_evento, nome, descricao, cep, endereco, link_ingresso, line_up, estado, tipo_evento, imagem, data
        FROM eventos
      `;
      console.log('Executando query:', query);

      const result = await pool.query(query);

      // Converte buffer da imagem para base64 (se existir imagem)
      const eventosComImagem = result.rows.map(evento => ({
        ...evento,
        imagem: evento.imagem ? evento.imagem.toString('base64') : null
      }));

      res.status(200).json(eventosComImagem);
    } catch (err) {
      console.error('Erro ao executar query:', err);
      res.status(500).send('Erro ao buscar eventos.');
    }
  } else {
    res.status(405).send('Método não permitido');
  }
};

