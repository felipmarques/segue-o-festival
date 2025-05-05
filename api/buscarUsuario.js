const { Pool } = require("pg");
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

module.exports = async (req, res) => {
  const { method, query, body } = req;
  const acao = query.acao;

  // Buscar usuário por e-mail
  if (method === "GET" && acao === "buscarUsuario") {
    const { email } = query;

    if (!email) {
      return res.status(400).json({ erro: "E-mail é obrigatório" });
    }

    try {
      const resultado = await pool.query(
        "SELECT nome, cpf FROM usuario WHERE email_usuario = $1",
        [email]
      );

      if (resultado.rows.length === 0) {
        return res.status(404).json({ erro: "Usuário não encontrado" });
      }

      return res.status(200).json(resultado.rows[0]);
    } catch (error) {
      return res.status(500).json({ erro: "Erro ao buscar usuário" });
    }
  }

  // Salvar evento
  if (method === "POST" && acao === "salvarEvento") {
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
      return res.status(500).json({ erro: "Erro ao salvar evento" });
    }
  }

  // Buscar eventos salvos
  if (method === "GET" && acao === "eventosSalvos") {
    const { cpf } = query;

    if (!cpf) {
      return res.status(400).json({ erro: "CPF é obrigatório" });
    }

    try {
      const resultado = await pool.query(
        `SELECT e.id_evento, e.nome, e.data, e.local, e.imagem 
         FROM eventos_salvos es
         JOIN eventos e ON es.evento_id = e.id_evento
         WHERE es.usuario_cpf = $1`,
        [cpf]
      );

      return res.status(200).json(resultado.rows);
    } catch (error) {
      return res.status(500).json({ erro: "Erro ao buscar eventos salvos" });
    }
  }

  return res.status(405).json({ erro: "Ação ou método não permitido" });
};
