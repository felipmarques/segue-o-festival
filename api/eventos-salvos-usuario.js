const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

module.exports = async (req, res) => {
  // Configuração de CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'GET') {
    try {
      const { cpf } = req.query;
      
      if (!cpf) {
        return res.status(400).json({ error: 'CPF do usuário é obrigatório' });
      }

      const eventosSalvosQuery = `
        SELECT evento_id 
        FROM eventos_salvos 
        WHERE usuario_cpf = $1
        ORDER BY criado_em DESC
      `;
      const eventosSalvosResult = await pool.query(eventosSalvosQuery, [cpf]);
      
      if (eventosSalvosResult.rows.length === 0) {
        return res.status(200).json([]);
      }

      const eventosIds = eventosSalvosResult.rows.map(row => row.evento_id);
      
      const eventosQuery = `
        SELECT id_evento, nome, descricao, cep, endereco, link_ingresso, 
               line_up, estado, tipo_evento, imagem, data
        FROM eventos
        WHERE id_evento = ANY($1::int[])
      `;
      
      const eventosResult = await pool.query(eventosQuery, [eventosIds]);

      const eventosComImagem = eventosResult.rows.map(evento => ({
        id_evento: evento.id_evento,
        titulo: evento.nome,
        descricao: evento.descricao,
        endereco: `${evento.endereco}, ${evento.estado}`,
        data: new Date(evento.data).toLocaleDateString('pt-BR'),
        imagemUrl: evento.imagem ? `data:image/jpeg;base64,${evento.imagem.toString('base64')}` : null,
        link_ingresso: evento.link_ingresso,
        tipo_evento: evento.tipo_evento
      }));

      res.status(200).json(eventosComImagem);
    } catch (err) {
      console.error('Erro ao buscar eventos salvos:', err);
      res.status(500).json({ error: 'Erro interno ao buscar eventos salvos' });
    }
  } 
  else if (req.method === 'DELETE') {
    try {
      const { eventoId, cpf } = req.body;
      
      if (!eventoId || !cpf) {
        return res.status(400).json({ 
          error: 'Dados incompletos',
          details: 'ID do evento e CPF são obrigatórios' 
        });
      }

      const deleteQuery = `
        DELETE FROM eventos_salvos 
        WHERE usuario_cpf = $1 AND evento_id = $2
        RETURNING *`;
      
      const result = await pool.query(deleteQuery, [cpf, eventoId]);

      if (result.rowCount === 0) {
        return res.status(404).json({ 
          error: 'Não encontrado',
          details: 'Evento não encontrado na lista de salvos deste usuário' 
        });
      }

      res.status(200).json({ 
        success: true,
        message: 'Evento removido dos salvos com sucesso',
        removedEvent: result.rows[0]
      });
    } catch (err) {
      console.error('Erro ao remover evento:', err);
      res.status(500).json({ 
        error: 'Erro interno',
        details: 'Falha ao remover evento dos salvos' 
      });
    }
  } else {
    res.status(405).json({ error: 'Método não permitido' });
  }
};
