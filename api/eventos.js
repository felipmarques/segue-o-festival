const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

module.exports = async (req, res) => {
  console.log('Requisição recebida:', req.body);

  if (req.method === 'POST') {
    const { nome, descricao, cep, endereco, link_ingresso, line_up } = req.body;
    const imagens = req.files ? req.files.fotos : [];

    console.log('Dados recebidos para inserção:', { 
      nome, descricao, cep, endereco, link_ingresso, line_up, imagens
    });

    try {
      // Converter imagens para BYTEA
      const imagensBytes = imagens.map(img => img.data);

      // Criar array de imagens em formato PostgreSQL
      const imagensArray = imagensBytes.length > 0 
        ? `{${imagensBytes.map(img => `'\\x${img.toString('hex')}'`).join(',')}}`
        : '{}';

      const query = `
        INSERT INTO eventos (nome, descricao, cep, endereco, link_ingresso, line_up, imagens)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
      `;

      const values = [nome, descricao, cep, endereco, link_ingresso, line_up, imagensArray];

      console.log('Executando query:', query);
      console.log('Com valores:', values);

      const result = await pool.query(query, values);
      console.log('Resultado da query:', result);

      res.status(200).send('Evento cadastrado com sucesso!');
    } catch (err) {
      console.error('Erro ao executar query:', err);
      res.status(500).send('Erro ao cadastrar evento.');
    }
  } else {
    res.status(405).send('Método não permitido');
  }
};
