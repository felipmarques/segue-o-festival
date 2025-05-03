const { Pool } = require("pg");
const pool = new Pool({
  connectionString: process.env.DATABASE_URL // ou sua config local
});

module.exports = async (req, res) => {
  if (req.method === "GET") {
    const { email } = req.query;

    if (!email) {
      return res.status(400).json({ erro: "E-mail é obrigatório" });
    }

    try {
      const resultado = await pool.query("SELECT nome, cpf FROM usuarios WHERE email = $1", [email]);

      if (resultado.rows.length === 0) {
        return res.status(404).json({ erro: "Usuário não encontrado" });
      }

      return res.status(200).json({
        nome: resultado.rows[0].nome,
        cpf: resultado.rows[0].cpf // agora retorna também o CPF
      });
    } catch (error) {
      console.error("Erro ao buscar nome:", error);
      return res.status(500).json({ erro: "Erro interno do servidor" });
    }
  }

  // POST: salvar evento
  if (req.method === "POST") {
    const { cpf, evento_id } = req.body;

    if (!cpf || !evento_id) {
      return res.status(400).json({ erro: "CPF e ID do evento são obrigatórios" });
    }

    try {
      // Verifica se o evento já está salvo
      const existe = await pool.query(
        "SELECT 1 FROM eventos_salvos WHERE usuario_cpf = $1 AND evento_id = $2",
        [cpf, evento_id]
      );

      if (existe.rows.length > 0) {
        return res.status(409).json({ erro: "Evento já salvo" });
      }

      // Insere o novo evento salvo
      await pool.query(
        "INSERT INTO eventos_salvos (usuario_cpf, evento_id) VALUES ($1, $2)",
        [cpf, evento_id]
      );

      return res.status(201).json({ mensagem: "Evento salvo com sucesso" });
    } catch (error) {
      console.error("Erro ao salvar evento:", error);
      return res.status(500).json({ erro: "Erro ao salvar evento" });
    }
  }

  return res.status(405).json({ erro: "Método não permitido" });
};
