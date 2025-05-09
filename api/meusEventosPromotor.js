const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

module.exports = async (req, res) => {
  if (req.method === 'GET') {
    const { cnpj } = req.query;

    if (!cnpj) {
      return res.status(400).json({ erro: 'Erro: CNPJ do usuário não fornecido.' });
    }

    try {
      const query = `
        SELECT e.* 
        FROM eventos e
        JOIN usuario_promotor u ON e.id_promotor = u.cnpj
        WHERE u.cnpj = $1
        ORDER BY e.data DESC;
      `;

      const result = await pool.query(query, [cnpj]);

      if (result.rows.length === 0) {
        return res.status(404).json({ erro: 'Nenhum evento encontrado para este usuário.' });
      }

      // Convertendo buffer da imagem para Base64 com prefixo correto
      const eventosComImagem = result.rows.map(evento => ({
        ...evento,
        imagem: evento.imagem ? `data:image/jpeg;base64,${evento.imagem.toString('base64')}` : null
      }));

      return res.status(200).json(eventosComImagem);
    } catch (error) {
      console.error('Erro ao buscar eventos:', error);
      return res.status(500).json({ erro: 'Erro ao recuperar eventos.' });
    }

    } else if (req.method === 'DELETE') {
    const { id } = req.query;

    if (!id) {
        return res.status(400).json({ erro: 'Erro: ID do evento não fornecido.' });
    }

    try {
        await pool.query("DELETE FROM eventos WHERE id_evento = $1", [id]);
        return res.status(200).json({ mensagem: "Evento removido com sucesso!" });
    } catch (error) {
        console.error("Erro ao remover evento:", error);
        return res.status(500).json({ erro: "Erro ao remover evento." });
    }
} else if (req.method === 'PUT') {
    let body = req.body;

    if (typeof body === 'string') {
        try {
            body = JSON.parse(body);
        } catch (err) {
            return res.status(400).json({ erro: 'JSON inválido no corpo da requisição.' });
        }
    }

    const { id, nome, descricao, data } = body;

    if (!id || !nome || !descricao || !data) {
        return res.status(400).json({ erro: 'Erro: Todos os campos são obrigatórios para edição.' });
    }

    try {
        await pool.query(
            "UPDATE eventos SET nome = $1, descricao = $2, data = $3 WHERE id_evento = $4",
            [nome, descricao, data, id]
        );
        return res.status(200).json({ mensagem: "Evento atualizado com sucesso!" });
    } catch (error) {
        console.error("Erro ao atualizar evento:", error);
        return res.status(500).json({ erro: "Erro ao atualizar evento." });
    }
} 
