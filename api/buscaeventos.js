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

  // Verificando se a requisição é do tipo GET (para buscar os eventos)
  if (req.method === 'GET') {
    try {
      // Consulta para buscar todos os eventos da tabela 'eventos'
      const query = 'SELECT nome, descricao, cep, endereco, link_ingresso, line_up, estado, tipo_evento FROM eventos ORDER BY data ASC';

      console.log('Executando query:', query);

      // Executando a query para obter os dados dos eventos
      const result = await pool.query(query);
      console.log('Resultado da query:', result.rows);

      // Retorna a lista de eventos em formato JSON
      res.status(200).json(result.rows);
    } catch (err) {
      // Tratamento de erro, se ocorrer algum problema na execução da query
      console.error('Erro ao executar query:', err);
      res.status(500).send('Erro ao buscar eventos.');
    }
  } else {
    // Caso o método da requisição não seja GET, retorna erro 405
    res.status(405).send('Método não permitido');
  }
};
