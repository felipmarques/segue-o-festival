const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

module.exports = async (req, res) => {
  const { cpf, nome, data_nascimento, email_usuario, senha_usuario, telefone } = req.body;

  try {
    const query = `
      INSERT INTO usuario (cpf, nome, data_nascimento, email_usuario, senha_usuario, telefone)
      VALUES ($1, $2, $3, $4, $5, $6)
    `;
    const values = [cpf, nome, data_nascimento, email_usuario, senha_usuario, telefone];
    await pool.query(query, values);
    res.status(200).send('Usuário registrado com sucesso!');
  } catch (err) {
    console.error(err);
    res.status(500).send('Erro ao registrar usuário.');
  }
};
