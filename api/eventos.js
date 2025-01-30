const express = require('express');
const multer = require('multer');
const { Pool } = require('pg');

const app = express();
const upload = multer();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.post('/eventos', upload.array('fotos', 5), async (req, res) => {
  console.log('Requisição recebida:', req.body);

  if (req.method === 'POST') {
    const { nome, descricao, cep, endereco, link_ingresso, line_up } = req.body;
    const imagens = req.files ? req.files.map(file => file.buffer) : [];

    console.log('Dados recebidos para inserção:', { 
      nome, descricao, cep, endereco, link_ingresso, line_up, imagens
    });

    try {
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
      console.error('Erro ao executar query:', err);
      res.status(500).send('Erro ao cadastrar evento.');
    }
  } else {
    res.status(405).send('Método não permitido');
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
