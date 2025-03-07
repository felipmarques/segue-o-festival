const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

export default async function handler(req, res) {
  if (req.method === 'POST') {
    const { identificador, senha } = req.body;

    if (!identificador || !senha) {
      return res.status(400).json({ message: "Identificador e senha são obrigatórios." });
    }

    try {
      // Consulta na tabela usuarioPromotor
      const queryUsuarioPromotor = `
        SELECT * FROM usuarioPromotor 
        WHERE (cnpj = $1 OR telefone = $1 OR email = $1) AND senha_promotor = $2
      `;
      const resultUsuarioPromotor = await pool.query(queryUsuarioPromotor, [identificador, senha]);

      if (resultUsuarioPromotor.rowCount > 0) {
        return res.status(200).json({
          message: "Login bem-sucedido",
          usuario: resultUsuarioPromotor.rows[0],
        });
      }

      // Se não encontrar na tabela usuarioPromotor
      return res.status(401).json({ message: "Credenciais inválidas." });
    } catch (err) {
      console.error("Erro durante o login:", err);
      return res.status(500).json({ message: "Erro no servidor." });
    }
  } else {
    return res.status(405).json({ message: "Método não permitido." });
  }
}
