const { Pool } = require('pg');
const multer = require('multer');

// Configurando o multer para aceitar o upload de arquivos
const upload = multer();

// Configuração do pool de conexões do PostgreSQL (Neon)
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

// Função principal para lidar com o POST do evento
const handleEventCreation = async (req, res) => {
  console.log('Requisição recebida:', req.body);

  // Extrair dados do formulário
  const { nome, descricao, cep, endereco, link_ingresso, line_up } = req.body;
  const imagens = req.files ? req.files.map((file) => file.buffer) : [];

  console.log('Dados recebidos para inserção:', { nome, descricao, cep, endereco, link_ingresso, line_up, imagens });

  try {
    // Convertendo as imagens para o formato BYTEA
    const imagensArray = imagens.length > 0
      ? `{${imagens.map((img) => `'\\x${img.toString('hex')}'`).join(',')}}`
      : '{}';

    const query = `
      INSERT INTO eventos (nome, descricao, cep, endereco, link_ingresso, line_up, imagens)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
    `;

    const values = [nome, descricao, cep, endereco, link_ingresso, line_up, imagensArray];

    console.log('Executando query:', query);
    console.log('Com valores:', values);

    // Executando a query para inserir o evento
    const result = await pool.query(query, values);
    console.log('Resultado da query:', result);
    res.status(200).send('Evento cadastrado com sucesso!');
  } catch (err) {
    console.error('Erro ao executar query:', err.message, err.stack);
    res.status(500).send('Erro ao cadastrar evento: ' + err.message);
  }
};

// Middleware para lidar com o upload de arquivos
const handleFileUpload = (req, res) => {
  upload.array('fotos', 5)(req, res, async (err) => {
    if (err) {
      console.error('Erro no upload de arquivos:', err.message, err.stack);
      res.status(500).send('Erro no upload de arquivos: ' + err.message);
    } else {
      // Após o upload de arquivos, chama a função principal para processar o evento
      await handleEventCreation(req, res);
    }
  });
};

// Exporta o middleware para a função de upload
module.exports = handleFileUpload;
