const { Pool } = require("pg");
const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

module.exports = async (req, res) => {
  const { method, query, body, url } = req;

  // Rota: buscar nome e CPF do usuário por email
  if (method === "GET" && url.startsWith("/api/buscarUsuario")) {
    const { email } = query;

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
        cpf: resultado.rows[0].cpf
      });
    } catch (error) {
      console.error("Erro ao buscar nome:", error);
      return res.status(500).json({ erro: "Erro interno do servidor" });
    }
  }

  // Rota: salvar evento para o usuário
  if (method === "POST" && url.startsWith("/api/eventos-salvos")) {
    const { cpf, evento_id } = body;

    if (!cpf || !evento_id) {
      return res.status(400).json({ erro: "CPF e ID do evento são obrigatórios" });
    }

    try {
      const existe = await pool.query(
        "SELECT 1 FROM eventos_salvos WHERE usuario_cpf = $1 AND evento_id = $2",
        [cpf, evento_id]
      );

      if (existe.rows.length > 0) {
        return res.status(409).json({ erro: "Evento já salvo" });
      }

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

  // Rota: buscar eventos salvos por CPF
  if (method === "GET" && url.startsWith("/api/eventos-salvos")) {
    const { cpf } = query;

    if (!cpf) {
      return res.status(400).json({ erro: "CPF é obrigatório" });
    }

    try {
      const resultado = await pool.query(
        SELECT e.id, e.nome, e.data, e.local, e.imagem 
         FROM eventos_salvos es
         JOIN eventos e ON es.evento_id = e.id
         WHERE es.usuario_cpf = $1,
        [cpf]
      );

      return res.status(200).json(resultado.rows);
    } catch (error) {
      console.error("Erro ao buscar eventos salvos:", error);
      return res.status(500).json({ erro: "Erro ao buscar eventos salvos" });
    }
  }

  return res.status(405).json({ erro: "Método não permitido" });
};
