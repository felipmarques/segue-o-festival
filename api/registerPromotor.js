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
    const { 
      nome, telefone, email, cep, rua, numero, complemento, cnpj 
    } = req.body;

    console.log('Valores recebidos para inserção:', {
      nome, telefone, email, cep, rua, numero, complemento, cnpj
    });

    try {
      const query = `
        INSERT INTO usuario_promotor (
          nome_responsavel, cnpj, telefone, rua, numero, bairro, cidade, estado, cep
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      `;

      const values = [
        nome, 
        cnpj, 
        telefone, 
        rua, 
        numero, 
        complemento || '', 
        '', 
        '', 
        cep
      ];

      console.log('Executando query:', query);
      console.log('Com valores:', values);

      const result = await pool.query(query, values);
      console.log('Resultado da query:', result);

      res.status(200).send('Usuário promotor registrado com sucesso!');
    } catch (err) {
      console.error('Erro ao executar query:', err);
      res.status(500).send('Erro ao registrar usuário promotor.');
    }
  } else {
    res.status(405).send('Método não permitido');
  }
};
