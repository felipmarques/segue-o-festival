const { Pool } = require('pg');

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

  // Verificando se todos os campos necessários estão presentes
  if (!nome || !descricao || !cep || !endereco || !link_ingresso || !line_up) {
    console.error('Erro: Campos obrigatórios não foram preenchidos.');
    return res.status(400).send('Todos os campos são obrigatórios.');
  }

  console.log('Dados recebidos para inserção:', { nome, descricao, cep, endereco, link_ingresso, line_up });

  try {
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
    console.log('Resultado da query:', result);
    res.status(200).send('Evento cadastrado com sucesso!');
  } catch (err) {
    console.error('Erro ao executar query:', err.message, err.stack);
    res.status(500).send('Erro ao cadastrar evento: ' + err.message);
  }
};

module.exports = handleEventCreation;

