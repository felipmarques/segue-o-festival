import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: "Método não permitido." });
  }

  const { email, senha } = req.body;

  if (!email || !senha) {
    return res.status(400).json({ message: "Email e senha são obrigatórios." });
  }

  try {
    // Consulta na tabela usuario_Promotor verificando email e senha
    const queryUsuarioPromotor = `
      SELECT * FROM usuario_Promotor 
      WHERE email = $1 AND senha = $2
    `;
    
    const resultUsuarioPromotor = await pool.query(queryUsuarioPromotor, [email, senha]);

    if (resultUsuarioPromotor.rowCount > 0) {
      return res.status(200).json({
        message: "Login bem-sucedido",
        usuario: resultUsuarioPromotor.rows[0], // Retorna id e email
      });
    }

    return res.status(401).json({ message: "Credenciais inválidas." });

  } catch (err) {
    console.error("Erro durante o login:", err);
    return res.status(500).json({ message: "Erro no servidor." });
  }
}



