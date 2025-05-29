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
    uf
  } = req.body;

  try {
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

    if (result.rowCount === 0) {
      return res.status(404).json({ success: false, message: 'Usuário não encontrado' });
    }

    return res.status(200).json({
      success: true,
      message: 'Perfil atualizado com sucesso',
      usuario: result.rows[0]
    });

  } catch (error) {
    console.error('Erro ao atualizar perfil:', error);
    return res.status(500).json({ success: false, message: 'Erro interno do servidor' });
  }
}
