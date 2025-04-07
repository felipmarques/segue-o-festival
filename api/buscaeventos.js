const { Pool } = require('pg');

// Conexão com o banco de dados Neon usando a string de conexão configurada no ambiente
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false // Necessário para a conexão com o Neon
  }
});

module.exports = async (req, res) => {
  console.log('Requisição recebida:', req.method);

  if (req.method === 'GET') {
    try {
      // Inclui a coluna "imagem" na query
      const query = `
        SELECT id, nome, descricao, cep, endereco, link_ingresso, line_up, estado, tipo_evento, imagem
        FROM eventos
      `;

      console.log('Executando query:', query);

      const result = await pool.query(query);

      // Converte o campo de imagem para base64, se existir
      const eventos = result.rows.map(evento => {
        let imagemBase64 = null;

        if (evento.imagem) {
          const base64 = evento.imagem.toString('base64');
          imagemBase64 = `data:image/png;base64,${base64}`;
        }

        return {
          id: evento.id,
          nome: evento.nome,
          descricao: evento.descricao,
          cep: evento.cep,
          endereco: evento.endereco,
          link_ingresso: evento.link_ingresso,
          line_up: evento.line_up,
          estado: evento.estado,
          tipo: evento.tipo_evento,
          imagem: imagemBase64
        };
      });

      res.status(200).json(eventos);
    } catch (err) {
      console.error('Erro ao executar query:', err);
      res.status(500).send('Erro ao buscar eventos.');
    }
  } else {
    res.status(405).send('Método não permitido');
  }
};

