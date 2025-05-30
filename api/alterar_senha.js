const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

export default async function handler(req, res) {
  if (req.method !== 'PUT') {
    return res.status(405).json({ success: false, message: 'Método não permitido' });
  }

  const { email, novaSenha } = req.body;

  if (!email || !novaSenha) {
    return res.status(400).json({ success: false, message: 'E-mail e nova senha são obrigatórios' });
  }

  try {
    // Atualização direta da senha no banco de dados
    const result = await pool.query(
      'UPDATE usuario SET senha_usuario = $1 WHERE email_usuario = $2 RETURNING email_usuario, nome',
      [novaSenha, email]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ success: false, message: 'Usuário não encontrado' });
    }

    return res.status(200).json({
      success: true,
      message: 'Senha atualizada com sucesso',
      usuario: result.rows[0]
    });

  } catch (error) {
    console.error('Erro ao atualizar senha:', error);
    return res.status(500).json({ success: false, message: 'Erro interno do servidor' });
  }
}
