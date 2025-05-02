const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

module.exports = async (req, res) => {
  if (req.method === 'GET') {
    const { email } = req.query;

    if (!email) {
      return res.status(400).json({ message: 'Email é obrigatório' });
    }

    try {
      const query = `
        SELECT nome, cpf, data_nascimento, email_usuario, telefone
        FROM usuario
        WHERE email_usuario = $1
      `;
      const result = await pool.query(query, [email]);

      if (result.rowCount === 0) {
        return res.status(404).json({ message: 'Usuário não encontrado' });
      }

      return res.status(200).json(result.rows[0]);
    } catch (err) {
      console.error('Erro ao consultar o usuário:', err);
      return res.status(500).json({ message: 'Erro interno do servidor' });
    }

  } else {
    res.status(405).send('Método não permitido');
  }
  console.log('Email recebido:', email);
};
