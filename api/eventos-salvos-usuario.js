const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

module.exports = async (req, res) => {
  // Configuração de CORS mais completa
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  // Handle preflight requests
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
        SELECT e.* FROM eventos e
        JOIN eventos_salvos es ON e.id_evento = es.evento_id
        WHERE es.usuario_cpf = $1
        ORDER BY es.criado_em DESC
      `;
      
      const eventosSalvosResult = await pool.query(eventosSalvosQuery, [cpf]);
      
      const eventosComImagem = eventosSalvosResult.rows.map(evento => ({
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
  else if (req.method === 'POST') {
    try {
      const { usuario_cpf, evento_id } = req.body;
      
      if (!usuario_cpf || !evento_id) {
        return res.status(400).json({ error: 'CPF e ID do evento são obrigatórios' });
      }

      // Verifica se já está salvo
      const existe = await pool.query(
        'SELECT * FROM eventos_salvos WHERE usuario_cpf = $1 AND evento_id = $2',
        [usuario_cpf, evento_id]
      );

      if (existe.rows.length > 0) {
        return res.status(400).json({ error: 'Evento já está salvo' });
      }

      // Salva novo
      await pool.query(
        'INSERT INTO eventos_salvos (usuario_cpf, evento_id) VALUES ($1, $2)',
        [usuario_cpf, evento_id]
      );

      res.status(201).json({ success: true });
    } catch (err) {
      console.error('Erro ao salvar evento:', err);
      res.status(500).json({ error: 'Erro ao salvar evento' });
    }
  }
  else if (req.method === 'DELETE') {
    try {
      // Recebe parâmetros do corpo da requisição
      const { usuario_cpf, evento_id } = req.body;
      
      if (!usuario_cpf || !evento_id) {
        return res.status(400).json({ error: 'CPF e ID do evento são obrigatórios' });
      }

      const result = await pool.query(
        'DELETE FROM eventos_salvos WHERE usuario_cpf = $1 AND evento_id = $2 RETURNING *',
        [usuario_cpf, evento_id]
      );

      if (result.rowCount === 0) {
        return res.status(404).json({ error: 'Evento não encontrado nos salvos' });
      }

      res.status(200).json({ success: true });
    } catch (err) {
      console.error('Erro ao remover evento:', err);
      res.status(500).json({ error: 'Erro ao remover evento' });
    }
  } else {
    res.status(405).json({ error: 'Método não permitido' });
  }
};
