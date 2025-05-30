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

  const {
    cpf,
    nome,
    data_nascimento,
    email_usuario,
    telefone,
    sexo,
    endereco,
    cep,
    numero,
    complemento,
    municipio,
    uf,
    novaSenha,
    confirmarSenha
  } = req.body;

  try {
    // Verificação de senha (se foi fornecida)
    if (novaSenha || confirmarSenha) {
      if (novaSenha !== confirmarSenha) {
        return res.status(400).json({ success: false, message: 'As senhas não coincidem' });
      }
      if (novaSenha.length < 6) {
        return res.status(400).json({ success: false, message: 'A senha deve ter pelo menos 6 caracteres' });
      }
    }

    // Inicia a transação
    await pool.query('BEGIN');

    // Atualiza os dados básicos do usuário
    const result = await pool.query(
      `UPDATE usuario SET
        nome = $1,
        data_nascimento = $2,
        telefone = $3,
        sexo = $4,
        endereco = $5,
        cep = $6,
        numero = $7,
        complemento = $8,
        municipio = $9,
        uf = $10
      WHERE cpf = $11 AND email_usuario = $12
      RETURNING *`,
      [
        nome,
        data_nascimento,
        telefone,
        sexo,
        endereco,
        cep,
        numero,
        complemento,
        municipio,
        uf,
        cpf,
        email_usuario
      ]
    );

    // Se foi fornecida uma nova senha, atualiza também
    if (novaSenha) {
      await pool.query(
        'UPDATE usuario SET senha = $1 WHERE cpf = $2',
        [novaSenha, cpf]
      );
    }

    // Commit da transação
    await pool.query('COMMIT');

    if (result.rowCount === 0) {
      return res.status(404).json({ success: false, message: 'Usuário não encontrado' });
    }

    return res.status(200).json({
      success: true,
      message: 'Perfil atualizado com sucesso',
      usuario: result.rows[0]
    });

  } catch (error) {
    // Rollback em caso de erro
    await pool.query('ROLLBACK');
    console.error('Erro ao atualizar perfil:', error);
    return res.status(500).json({ success: false, message: 'Erro interno do servidor' });
  }
}
