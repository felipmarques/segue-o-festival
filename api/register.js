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
    const { cpf, nome, data_nascimento, email_usuario, senha_usuario, telefone } = req.body;

    // Adicionando logs para verificar os valores recebidos
    console.log('Valores recebidos para inserção:', {
      cpf, nome, data_nascimento, email_usuario, senha_usuario, telefone
    });

    try {
      const query = `
        INSERT INTO usuario (cpf, nome, data_nascimento, email_usuario, senha_usuario, telefone)
        VALUES ($1, $2, $3, $4, $5, $6)
      `;
      const values = [cpf, nome, data_nascimento, email_usuario, senha_usuario, telefone];
      console.log('Executando query:', query);
      console.log('Com valores:', values);
      
      await pool.query(query, values);
      res.status(200).send('Usuário registrado com sucesso!');
    } catch (err) {
      console.error('Erro ao executar query:', err);
      res.status(500).send('Erro ao registrar usuário.');
    }
  } else {
    res.status(405).send('Método não permitido');
  }
};
