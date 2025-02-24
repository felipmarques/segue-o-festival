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
    const { 
      nome, telefone, email, cep, rua, numero, complemento, cnpj 
    } = req.body;

    console.log('Valores recebidos para inserção:', {
      nome, telefone, email, cep, rua, numero, complemento, cnpj
    });

    try {
      // Verificando se o CNPJ já existe na tabela usuario_promotor
      const checkQuery = `SELECT 1 FROM usuario_promotor WHERE cnpj = $1`;
      const checkResult = await pool.query(checkQuery, [cnpj]);

      // Caso o CNPJ já esteja registrado, retorna erro
      if (checkResult.rowCount > 0) {
        console.warn(`CNPJ já cadastrado: ${cnpj}`);
        return res.status(400).send('Erro: CNPJ já está registrado.');
      }

      // Se o CNPJ não for duplicado, insere os dados do novo promotor
      const query = `
        INSERT INTO usuario_promotor (
          nome_responsavel, cnpj, telefone, rua, numero, bairro, cidade, estado, cep
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      `;

      // Valores a serem inseridos na tabela
      const values = [
        nome, 
        cnpj, 
        telefone, 
        rua, 
        numero, 
        complemento || '', // Se o complemento não for fornecido, usa uma string vazia
        '',  // Cidade
        '',  // Estado
        cep
      ];

      console.log('Executando query:', query);
      console.log('Com valores:', values);

      // Executando a query para inserir os dados no banco
      const result = await pool.query(query, values);
      console.log('Resultado da query:', result);

      // Envia resposta de sucesso ao cliente
      res.status(200).send('Usuário promotor registrado com sucesso!');
    } catch (err) {
      // Tratamento de erro, se ocorrer algum problema na execução da query
      if (err.code === '23505') { 
        console.error('Erro de duplicidade de chave primária:', err);
        res.status(400).send('Erro: CNPJ já está registrado.');
      } else {
        console.error('Erro ao executar query:', err);
        res.status(500).send('Erro ao registrar usuário promotor.');
      }
    }
  } else {
    // Caso o método da requisição não seja POST, retorna erro 405
    res.status(405).send('Método não permitido');
  }
};

