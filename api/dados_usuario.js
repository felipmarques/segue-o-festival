const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

module.exports = async (req, res) => {
  if (req.method === 'GET') {
    const { email_usuario } = req.query;

    if (!email_usuario) {
      return res.status(400).json({ erro: 'Parâmetro email_usuario é obrigatório' });
    }

    try {
      const query = `
        SELECT nome, cpf, data_nascimento, telefone, email_usuario
        FROM usuario
        WHERE email_usuario = $1
      `;
      const result = await pool.query(query, [email_usuario]);

      if (result.rows.length === 0) {
        return res.status(404).json({ erro: 'Usuário não encontrado' });
      }

      res.status(200).json(result.rows[0]);
    } catch (err) {
      console.error('Erro ao buscar dados do usuário:', err);
      res.status(500).json({ erro: 'Erro interno do servidor' });
    }
  } else {
    res.status(405).send('Método não permitido');
  }
};
