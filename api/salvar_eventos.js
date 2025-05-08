const { Pool } = require("pg");
const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

module.exports = async (req, res) => {
  const { method, body } = req;

  if (method !== "POST") {
    return res.status(405).json({ erro: "Método não permitido" });
  }

  const { cpf, evento_id } = body;

  if (!cpf || !evento_id) {
    console.log('Erro: CPF ou ID do evento não fornecido');
    return res.status(400).json({ erro: "CPF e ID do evento são obrigatórios" });
  }

  try {
    const existe = await pool.query(
      "SELECT 1 FROM eventos_salvos WHERE usuario_cpf = $1 AND evento_id = $2",
      [cpf, evento_id]
    );

    if (existe.rows.length > 0) {
      console.log('Erro: Evento já foi salvo');
      return res.status(409).json({ erro: "Evento já salvo" });
    }

    await pool.query(
      "INSERT INTO eventos_salvos (usuario_cpf, evento_id) VALUES ($1, $2)",
      [cpf, evento_id]
    );

    console.log("Evento salvo com sucesso");
    return res.status(201).json({ mensagem: "Evento salvo com sucesso" });

  } catch (error) {
    console.error("Erro ao salvar evento:", error);
    return res.status(500).json({ erro: "Erro ao salvar evento" });
  }
};
