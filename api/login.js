const { Pool } = require('pg');

// Configuração do Neon (use suas credenciais no .env)
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

export default async function handler(req, res) {
  if (req.method === 'POST') {
    const { identificador, senha } = req.body;

    // Verificação simples dos campos
    if (!identificador || !senha) {
      return res.status(400).json({ message: "Identificador e senha são obrigatórios." });
    }

    try {
      // Consulta na tabela usuario
      const queryUsuario = `
        SELECT * FROM usuario 
        WHERE (cpf = $1 OR email_usuario = $1) AND senha_usuario = $2
      `;
      const resultUsuario = await pool.query(queryUsuario, [identificador, senha]);

      if (resultUsuario.rowCount > 0) {
        const usuario = resultUsuario.rows[0];
        return res.status(200).json({
          message: "Login bem-sucedido",
          email: usuario.email_usuario,
          cpf: usuario.cpf
        });
      }

      // Se não encontrar na tabela usuario
      return res.status(401).json({ message: "Credenciais inválidas." });
    } catch (err) {
      console.error("Erro durante o login:", err);
      return res.status(500).json({ message: "Erro no servidor." });
    }
  } else {
    return res.status(405).json({ message: "Método não permitido." });
  }
}
