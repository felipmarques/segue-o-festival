const { Pool } = require('pg');

// Conexão com o banco de dados Neon usando a string de conexão configurada no ambiente
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false // Necessário para a conexão com o Neon
  }
});

module.exports = async (req, res) => {
  console.log('Requisição recebida:', req.body);

  // Verificando se a requisição é do tipo POST
  if (req.method === 'POST') {
    // Extraindo dados do corpo da requisição
    const { nome, descricao, cep, endereco, link_ingresso, line_up } = req.body;

    console.log('Valores recebidos para inserção:', {
      nome, descricao, cep, endereco, link_ingresso, line_up
    });

    try {
      // Verificando se o evento já existe no banco de dados (você pode modificar isso conforme sua lógica)
      const checkQuery = `SELECT 1 FROM eventos WHERE nome = $1 AND cep = $2`;
      const checkResult = await pool.query(checkQuery, [nome, cep]);

      // Caso o evento já exista, retorna erro
      if (checkResult.rowCount > 0) {
        console.warn(`Evento já cadastrado: ${nome}`);
        return res.status(400).send('Erro: Evento já está registrado.');
      }

      // Se o evento não for duplicado, insere os dados do novo evento
      const query = `
        INSERT INTO eventos (
          nome, descricao, cep, endereco, link_ingresso, line_up
        ) VALUES ($1, $2, $3, $4, $5, $6)
      `;

      // Valores a serem inseridos na tabela
      const values = [
        nome, 
        descricao, 
        cep, 
        endereco, 
        link_ingresso, 
        line_up
      ];

      console.log('Executando query:', query);
      console.log('Com valores:', values);

      // Executando a query para inserir os dados no banco
      const result = await pool.query(query, values);
      console.log('Resultado da query:', result);

      // Envia resposta de sucesso ao cliente
      res.status(200).send('Evento registrado com sucesso!');
    } catch (err) {
      // Tratamento de erro, se ocorrer algum problema na execução da query
      if (err.code === '23505') { 
        console.error('Erro de duplicidade de chave primária:', err);
        res.status(400).send('Erro: Evento já está registrado.');
      } else {
        console.error('Erro ao executar query:', err);
        res.status(500).send('Erro ao registrar evento.');
      }
    }
  } else {
    // Caso o método da requisição não seja POST, retorna erro 405
    res.status(405).send('Método não permitido');
  }
};
