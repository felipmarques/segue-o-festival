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

const handleEventCreation = async (req, res) => {
  console.log('Função handleEventCreation chamada');

  // Adicionar logs antes de processar qualquer coisa
  console.log('Requisição recebida:', req.body);

  // Extrair dados do formulário
  const { nome, descricao, cep, endereco, link_ingresso, line_up } = req.body;

  // Verificando se todos os campos necessários estão presentes
  if (!nome || !descricao || !cep || !endereco || !link_ingresso || !line_up) {
    console.error('Erro: Campos obrigatórios não foram preenchidos.');
    return res.status(400).send('Todos os campos são obrigatórios.');
  }

  console.log('Dados recebidos para inserção:', { nome, descricao, cep, endereco, link_ingresso, line_up });

  try {
    // Logando antes de executar a query para garantir que tudo está correto
    console.log('Iniciando a execução da query no banco de dados...');

    // Query de inserção no banco de dados
    const query = `
      INSERT INTO eventos (nome, descricao, cep, endereco, link_ingresso, line_up)
      VALUES ($1, $2, $3, $4, $5, $6)
    `;

    const values = [nome, descricao, cep, endereco, link_ingresso, line_up];

    console.log('Executando query:', query);
    console.log('Com valores:', values);

    // Executando a query para inserir o evento
    const result = await pool.query(query, values);

    // Logando o resultado da query
    console.log('Resultado da query:', result);

    res.status(200).send('Evento cadastrado com sucesso!');
  } catch (err) {
    // Logando o erro completo
    console.error('Erro ao executar query:', err.message, err.stack);
    res.status(500).send('Erro ao cadastrar evento: ' + err.message);
  }
};

// Definindo a função como o export de módulo
module.exports = handleEventCreation;

