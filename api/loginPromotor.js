const { Pool } = require('pg');
const jwt = require('jsonwebtoken');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

export default async function handler(req, res) {
  if (req.method === 'POST') {
    const { email, senha } = req.body;

    if (!email || !senha) {
      return res.status(400).json({ message: "Email e senha são obrigatórios." });
    }

    try {
      // Consulta na tabela usuario_Promotor
      const queryUsuarioPromotor = `
        SELECT * FROM usuario_Promotor 
        WHERE email = $1 AND senha = $2
      `;
      
      // Verificando o usuário
      const resultUsuarioPromotor = await pool.query(queryUsuarioPromotor, [email, senha]);

      if (resultUsuarioPromotor.rowCount > 0) {
        const usuario = resultUsuarioPromotor.rows[0];

        // Gerando o token JWT
        const token = jwt.sign(
          { id: usuario.id, email: usuario.email },
          process.env.JWT_SECRET, // Use a chave secreta no seu .env
          { expiresIn: '1h' } // O token expira em 1 hora
        );

        return res.status(200).json({
          message: "Login bem-sucedido",
          usuario: {
            id: usuario.id,
            nome: usuario.nome,
            email: usuario.email,
          },
          token: token, // Envia o token no retorno
        });
      } else {
        return res.status(401).json({ message: "Credenciais inválidas." });
      }
    } catch (err) {
      console.error("Erro durante o login:", err);
      return res.status(500).json({ message: "Erro no servidor." });
    }
  } else {
    return res.status(405).json({ message: "Método não permitido." });
  }
}

