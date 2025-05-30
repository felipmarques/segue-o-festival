const { Pool } = require('pg');
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// Função para validar UUID (caso seus ids_evento sejam UUID)
const isValidId = (id) => {
  return typeof id === 'string' && id.length > 0;
};

module.exports = async (req, res) => {
  try {
    // Verifica o método HTTP primeiro
    if (!['GET', 'POST'].includes(req.method)) {
      return res.status(405).json({ erro: 'Método não permitido' });
    }

    // Validação do usuário logado
    let usuario;
    try {
      usuario = JSON.parse(req.headers['usuario-logado'] || 'null');
    } catch (e) {
      return res.status(400).json({ erro: 'Header de usuário inválido' });
    }

    const cpf = usuario?.cpf;
    if (!cpf) {
      return res.status(401).json({ erro: 'Usuário não autenticado' });
    }

    if (req.method === 'GET') {
      // LISTAR EVENTOS SALVOS
      try {
        const resultUsuario = await pool.query(
          'SELECT eventos_salvos FROM usuario WHERE cpf = $1',
          [cpf]
        );

        if (resultUsuario.rowCount === 0) {
          return res.status(404).json({ erro: 'Usuário não encontrado' });
        }

        const idsEventos = resultUsuario.rows[0]?.eventos_salvos || [];
        
        // Se não há eventos salvos, retorna array vazio
        if (!Array.isArray(idsEventos) {
          return res.status(500).json({ erro: 'Formato inválido de eventos salvos' });
        }

        if (idsEventos.length === 0) {
          return res.json([]);
        }

        // Valida os IDs antes de usar na query
        const idsValidos = idsEventos.filter(isValidId);
        if (idsValidos.length === 0) {
          return res.json([]);
        }

        const resultEventos = await pool.query(
          'SELECT * FROM eventos WHERE id_evento = ANY($1)',
          [idsValidos]
        );

        const eventos = resultEventos.rows.map(evento => ({
          ...evento,
          imagem: evento.imagem?.toString('base64') || null
        }));

        return res.status(200).json(eventos);
      } catch (err) {
        console.error('Erro ao buscar eventos salvos:', err);
        return res.status(500).json({ erro: 'Erro ao buscar eventos salvos' });
      }

    } else if (req.method === 'POST') {
      // SALVAR/REMOVER EVENTO
      try {
        const { id_evento, acao } = req.body;

        // Validação dos parâmetros
        if (!isValidId(id_evento)) {
          return res.status(400).json({ erro: 'ID do evento inválido' });
        }

        if (!['salvar', 'remover'].includes(acao)) {
          return res.status(400).json({ erro: 'Ação inválida' });
        }

        // Usa transação para garantir consistência
        const client = await pool.connect();
        try {
          await client.query('BEGIN');

          // 1. Pega a lista atual de eventos salvos
          const result = await client.query(
            'SELECT eventos_salvos FROM usuario WHERE cpf = $1 FOR UPDATE',
            [cpf]
          );

          if (result.rowCount === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ erro: 'Usuário não encontrado' });
          }

          let eventosSalvos = result.rows[0]?.eventos_salvos || [];

          // Garante que eventosSalvos é um array
          if (!Array.isArray(eventosSalvos)) {
            eventosSalvos = [];
          }

          // 2. Atualiza a lista
          if (acao === 'salvar') {
            if (!eventosSalvos.includes(id_evento)) {
              eventosSalvos = [...eventosSalvos, id_evento];
            }
          } else {
            eventosSalvos = eventosSalvos.filter(id => id !== id_evento);
          }

          // 3. Salva no banco
          await client.query(
            'UPDATE usuario SET eventos_salvos = $1 WHERE cpf = $2',
            [eventosSalvos, cpf]
          );

          await client.query('COMMIT');
          return res.status(200).json({ sucesso: true });
        } catch (err) {
          await client.query('ROLLBACK');
          throw err;
        } finally {
          client.release();
        }
      } catch (err) {
        console.error('Erro ao atualizar eventos salvos:', err);
        return res.status(500).json({ erro: 'Erro ao atualizar eventos salvos' });
      }
    }
  } catch (err) {
    console.error('Erro geral no endpoint:', err);
    return res.status(500).json({ erro: 'Erro interno no servidor' });
  }
};
