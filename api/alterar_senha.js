const { Pool } = require('pg');
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

export default async function handler(req, res) {
  if (req.method === 'PUT') {
    const { email, senhaAtual, novaSenha, confirmacaoSenha } = req.body;

    // Validações básicas
    if (!email || !senhaAtual || !novaSenha || !confirmacaoSenha) {
      return res.status(400).json({ message: "Todos os campos são obrigatórios." });
    }

    if (novaSenha !== confirmacaoSenha) {
      return res.status(400).json({ message: "A nova senha e a confirmação não coincidem." });
    }

    // Verificar força da senha (opcional)
    const senhaRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?#&])[A-Za-z\d@$!%*?#&]{8,}$/;
    if (!senhaRegex.test(novaSenha)) {
      return res.status(400).json({ 
        message: "A senha deve conter no mínimo 8 caracteres, incluindo letra maiúscula, minúscula, número e caractere especial."
      });
    }

    try {
      // 1. Verificar se o usuário existe e a senha atual está correta
      const usuarioQuery = `
        SELECT * FROM usuario 
        WHERE email_usuario = $1 AND senha_usuario = $2
      `;
      const usuarioResult = await pool.query(usuarioQuery, [email, senhaAtual]);

      if (usuarioResult.rowCount === 0) {
        return res.status(401).json({ message: "E-mail ou senha atual incorretos." });
      }

      // 2. Atualizar a senha no banco de dados
      const updateQuery = `
        UPDATE usuario 
        SET senha_usuario = $1
        WHERE email_usuario = $2
        RETURNING email_usuario, cpf
      `;
      const updateResult = await pool.query(updateQuery, [novaSenha, email]);

      if (updateResult.rowCount > 0) {
        return res.status(200).json({ 
          message: "Senha atualizada com sucesso!",
          email: updateResult.rows[0].email_usuario
        });
      }

      return res.status(400).json({ message: "Não foi possível atualizar a senha." });

    } catch (err) {
      console.error("Erro durante a atualização da senha:", err);
      return res.status(500).json({ message: "Erro no servidor ao atualizar senha." });
    }
  } else {
    return res.status(405).json({ message: "Método não permitido." });
  }
}
