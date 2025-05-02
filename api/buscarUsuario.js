const { Pool } = require("pg");
const pool = new Pool({
  connectionString: process.env.DATABASE_URL // ou sua config local
});

module.exports = async (req, res) => {
  const { email } = req.query;

  if (!email) {
    return res.status(400).json({ erro: "E-mail é obrigatório" });
  }

  try {
    const resultado = await pool.query("SELECT nome FROM usuarios WHERE email = $1", [email]);

    if (resultado.rows.length === 0) {
      return res.status(404).json({ erro: "Usuário não encontrado" });
    }

    return res.status(200).json({ nome: resultado.rows[0].nome });
  } catch (error) {
    console.error("Erro ao buscar nome:", error);
    return res.status(500).json({ erro: "Erro interno do servidor" });
  }
};
