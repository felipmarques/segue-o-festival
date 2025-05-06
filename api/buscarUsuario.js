const { Pool } = require("pg");
const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

module.exports = async (req, res) => {
  const { method, query, body, url } = req;

  // Rota: buscar nome e CPF do usuário por e-mail
  if (method === "GET" && url.startsWith("/api/buscarUsuario")) {
    const { email } = query;

    if (!email) {
      console.log('Erro: E-mail não fornecido');
      return res.status(400).json({ erro: "E-mail é obrigatório" });
    }

    try {
      console.log('Buscando usuário com e-mail:', email);
      const resultado = await pool.query("SELECT nome, cpf FROM usuario WHERE email_usuario = $1", [email]); // Corrigido para 'email_usuario'

      if (resultado.rows.length === 0) {
        console.log('Erro: Usuário não encontrado');
        return res.status(404).json({ erro: "Usuário não encontrado" });
      }

      console.log('Usuário encontrado:', resultado.rows[0]);
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
 if (method === "POST" && url.startsWith("/api/eventossalvos")) {
  const { email, evento_id } = body;

  if (!email || !evento_id) {
    console.log('Erro: E-mail ou ID do evento não fornecido');
    return res.status(400).json({ erro: "E-mail e ID do evento são obrigatórios" });
  }

  try {
    console.log(`Buscando CPF do usuário com e-mail: ${email}`);
    const resultadoUsuario = await pool.query(
      "SELECT cpf FROM usuario WHERE email_usuario = $1",
      [email]
    );

    if (resultadoUsuario.rows.length === 0) {
      console.log("Erro: Usuário não encontrado");
      return res.status(404).json({ erro: "Usuário não encontrado" });
    }

    const cpf = resultadoUsuario.rows[0].cpf;

    // Verifica se já foi salvo
    const existe = await pool.query(
      "SELECT 1 FROM eventos_salvos WHERE usuario_cpf = $1 AND evento_id = $2",
      [cpf, evento_id]
    );

    if (existe.rows.length > 0) {
      console.log('Erro: Evento já foi salvo');
      return res.status(409).json({ erro: "Evento já salvo" });
    }

    // Salva o evento
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
}

  // Rota: buscar eventos salvos por CPF
  if (method === "GET" && url.startsWith("/api/eventossalvos")) {
    const { cpf } = query;

    if (!cpf) {
      console.log('Erro: CPF não fornecido');
      return res.status(400).json({ erro: "CPF é obrigatório" });
    }

    try {
      console.log('Buscando eventos salvos para o CPF:', cpf);
      const resultado = await pool.query(
        `SELECT e.id_evento, e.nome, e.data, e.local, e.imagem 
         FROM eventos_salvos es
         JOIN eventos e ON es.evento_id = e.id_evento
         WHERE es.usuario_cpf = $1`, // Garantir que a tabela e os nomes de colunas estejam corretos
        [cpf]
      );

      console.log('Eventos encontrados:', resultado.rows);
      return res.status(200).json(resultado.rows);
    } catch (error) {
      console.error("Erro ao buscar eventos salvos:", error);
      return res.status(500).json({ erro: "Erro ao buscar eventos salvos" });
    }
  }

  return res.status(405).json({ erro: "Método não permitido" });
};
