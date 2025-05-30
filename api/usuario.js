const { Pool } = require('pg');
const bcrypt = require('bcrypt');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

module.exports = async (req, res) => {
  // Configura CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, PUT');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'GET') {
    const { email } = req.query;

    if (!email) {
      return res.status(400).json({ success: false, message: 'Email é obrigatório' });
    }

    try {
      const query = `
        SELECT nome, cpf, data_nascimento, sexo, endereco, cep, numero,
               complemento, municipio, uf, email_usuario AS email
        FROM usuario
        WHERE email_usuario = $1
      `;
      const result = await pool.query(query, [email]);

      if (result.rowCount === 0) {
        return res.status(404).json({ success: false, message: 'Usuário não encontrado' });
      }

      return res.status(200).json({ success: true, usuario: result.rows[0] });
    } catch (err) {
      console.error('Erro ao consultar o usuário:', err);
      return res.status(500).json({ success: false, message: 'Erro interno do servidor' });
    }
  }

  if (req.method === 'PUT') {
    const {
      nome,
      cpf,
      data_nascimento, // Esperado no formato YYYY-MM-DD
      sexo,
      endereco,
      cep,
      numero,
      complemento,
      municipio,
      uf,
      email_usuario,
      novaSenha,
      confirmarSenha
    } = req.body;

    console.log("🔵 Dados recebidos no PUT:", req.body);

    // Validação de senha (se fornecida)
    if (novaSenha || confirmarSenha) {
      if (novaSenha !== confirmarSenha) {
        return res.status(400).json({ success: false, message: 'As senhas não coincidem' });
      }
      
      const senhaRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?#&])[A-Za-z\d@$!%*?#&]{8,}$/;
      if (!senhaRegex.test(novaSenha)) {
        return res.status(400).json({
          success: false,
          message: 'A senha deve ter no mínimo 8 caracteres, com pelo menos uma letra maiúscula, uma minúscula, um número e um caractere especial.'
        });
      }
    }

    // Validações básicas
    if (!/^\d{11}$/.test(cpf.replace(/\D/g, ''))) {
      return res.status(400).json({ success: false, message: 'CPF deve conter 11 dígitos numéricos.' });
    }

    if (!/^\d{8}$/.test(cep.replace(/\D/g, ''))) {
      return res.status(400).json({ success: false, message: 'CEP deve conter 8 dígitos numéricos.' });
    }

    try {
      await pool.query('BEGIN');

      // Atualiza dados básicos
      const updateQuery = `
        UPDATE usuario
        SET nome = $1, 
            cpf = $2, 
            data_nascimento = $3, 
            sexo = $4, 
            endereco = $5,
            cep = $6, 
            numero = $7, 
            complemento = $8, 
            municipio = $9, 
            uf = $10
        WHERE email_usuario = $11
        RETURNING *
      `;

      const values = [
        nome,
        cpf.replace(/\D/g, ''),
        data_nascimento, // Já no formato correto
        sexo,
        endereco,
        cep.replace(/\D/g, ''),
        numero,
        complemento,
        municipio,
        uf,
        email_usuario
      ];

      const result = await pool.query(updateQuery, values);

      // Atualiza senha se fornecida
      if (novaSenha) {
        const hashedPassword = await bcrypt.hash(novaSenha, 10);
        await pool.query(
          'UPDATE usuario SET senha_usuario = $1 WHERE email_usuario = $2',
          [hashedPassword, email_usuario]
        );
      }

      await pool.query('COMMIT');

      if (result.rowCount === 0) {
        return res.status(404).json({ success: false, message: 'Usuário não encontrado' });
      }

      return res.status(200).json({ 
        success: true, 
        message: 'Dados atualizados com sucesso!',
        usuario: result.rows[0]
      });

    } catch (err) {
      await pool.query('ROLLBACK');
      console.error('Erro ao atualizar o usuário:', err);
      return res.status(500).json({ success: false, message: 'Erro interno ao atualizar o usuário.' });
    }
  }

  return res.status(405).json({ success: false, message: 'Método não permitido' });
};
