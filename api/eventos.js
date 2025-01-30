const { Pool } = require('pg');
const multer = require('multer');

// Configuração do multer para aceitar o upload de arquivos
const upload = multer();

// Configuração do pool de conexões do PostgreSQL (Neon)
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

module.exports = async (req, res) => {
  console.log('Requisição recebida:', req.body);

  if (req.method === 'POST') {
    const { nome, descricao, cep, endereco, link_ingresso, line_up } = req.body;
    const imagens = req.files ? req.files.map(file => file.buffer) : [];

    console.log('Dados recebidos para inserção:', { 
      nome, descricao, cep, endereco, link_ingresso, line_up, imagens
    });

    try {
      // Verificar se o nome do evento já está cadastrado
      const checkQuery = `SELECT 1 FROM eventos WHERE nome = $1`;
      const checkResult = await pool.query(checkQuery, [nome]);

      if (checkResult.rowCount > 0) {
        console.warn(`Evento já cadastrado: ${nome}`);
        return res.status(400).send('Erro: Evento já está registrado.');
      }

      // Converter imagens para BYTEA
      const imagensArray = imagens.length > 0 
        ? `{${imagens.map(img => `'\\x${img.toString('hex')}'`).join(',')}}`
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
      if (err.code === '23505') {
        console.error('Erro de duplicidade de chave primária:', err);
        res.status(400).send('Erro: Evento já está registrado.');
      } else {
        console.error('Erro ao executar query:', err);
        res.status(500).send('Erro ao cadastrar evento.');
      }
    }
  } else {
    res.status(405).send('Método não permitido');
  }
};

// Middleware para lidar com o upload de arquivos
module.exports = (req, res) => {
  upload.array('fotos', 5)(req, res, async (err) => {
    if (err) {
      console.error('Erro no upload de arquivos:', err.message, err.stack);
      res.status(500).send('Erro no upload de arquivos: ' + err.message);
    } else {
      try {
        await module.exports(req, res);
      } catch (err) {
        console.error('Erro ao processar a requisição:', err.message, err.stack);
        res.status(500).send('Erro ao processar a requisição: ' + err.message);
      }
    }
  });
};

