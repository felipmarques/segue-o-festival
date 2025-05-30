const { Pool } = require("pg");
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

module.exports = async (req, res) => {
  const { method, query, body } = req;

  console.log(`[${new Date().toISOString()}] ${method} ${req.url}`);

  try {
    switch (method) {
      case 'GET':
        // Buscar eventos salvos por CPF
        if (query.cpf) {
          const result = await pool.query(
            `SELECT e.* FROM eventos e
             JOIN eventos_salvos es ON e.id_evento = es.evento_id
             WHERE es.usuario_cpf = $1`,
            [query.cpf]
          );
          
          const eventos = result.rows.map(evento => ({
            ...evento,
            imagem: evento.imagem ? evento.imagem.toString('base64') : null
          }));
          
          return res.status(200).json({
            success: true,
            data: eventos
          });
        }
        break;

      case 'POST':
        // Salvar novo evento
        const { cpf, evento_id } = body;
        
        if (!cpf || !evento_id) {
          return res.status(400).json({
            success: false,
            error: "CPF e ID do evento são obrigatórios"
          });
        }

        // Verifica se já está salvo
        const exists = await pool.query(
          "SELECT id FROM eventos_salvos WHERE usuario_cpf = $1 AND evento_id = $2",
          [cpf, evento_id]
        );

        if (exists.rows.length > 0) {
          return res.status(409).json({
            success: false,
            error: "Evento já está salvo"
          });
        }

        // Insere novo registro
        await pool.query(
          "INSERT INTO eventos_salvos (usuario_cpf, evento_id, criado_em) VALUES ($1, $2, NOW())",
          [cpf, evento_id]
        );

        return res.status(201).json({
          success: true,
          message: "Evento salvo com sucesso"
        });

      case 'DELETE':
        // Remover evento salvo
        if (query.cpf && query.evento_id) {
          const result = await pool.query(
            "DELETE FROM eventos_salvos WHERE usuario_cpf = $1 AND evento_id = $2 RETURNING *",
            [query.cpf, query.evento_id]
          );

          if (result.rows.length === 0) {
            return res.status(404).json({
              success: false,
              error: "Evento salvo não encontrado"
            });
          }

          return res.status(200).json({
            success: true,
            message: "Evento removido dos salvos"
          });
        }
        break;

      default:
        return res.status(405).json({
          success: false,
          error: "Método não permitido"
        });
    }

    return res.status(400).json({
      success: false,
      error: "Parâmetros inválidos"
    });

  } catch (error) {
    console.error("Erro na API eventos-salvos:", error);
    return res.status(500).json({
      success: false,
      error: "Erro interno do servidor"
    });
  }
};
