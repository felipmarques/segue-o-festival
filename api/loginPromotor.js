import { Pool } from 'pg';
import bcrypt from 'bcrypt';

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
    // Buscar o usuário pelo email
    const queryUsuarioPromotor = `
      SELECT * FROM usuario_Promotor 
      WHERE email = $1
    `;
    const resultUsuarioPromotor = await pool.query(queryUsuarioPromotor, [email]);

    // Verificar se o usuário existe
    if (resultUsuarioPromotor.rowCount === 0) {
      return res.status(401).json({ message: "Credenciais inválidas." });
    }

    const usuario = resultUsuarioPromotor.rows[0];

    // Comparar a senha informada com a senha hashada no banco
    const senhaValida = await bcrypt.compare(senha, usuario.senha);

    if (!senhaValida) {
      return res.status(401).json({ message: "Credenciais inválidas." });
    }

    return res.status(200).json({
      message: "Login bem-sucedido",
      usuario: { id: usuario.id, email: usuario.email }, // Retornando apenas dados essenciais
    });

  } catch (err) {
    console.error("Erro durante o login:", err);
    return res.status(500).json({ message: "Erro no servidor." });
  }
}


