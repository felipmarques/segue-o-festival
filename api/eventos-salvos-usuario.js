const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

module.exports = async (req, res) => {
  if (req.method === 'GET') {
    try {
      const { cpf } = req.query;
      
      if (!cpf) {
        return res.status(400).json({ error: 'CPF do usuário é obrigatório' });
      }

      // Busca os eventos salvos pelo usuário
      const eventosSalvosQuery = `
        SELECT evento_id 
        FROM eventos_salvos 
        WHERE usuario_cpf = $1
      `;
      const eventosSalvosResult = await pool.query(eventosSalvosQuery, [cpf]);
      
      if (eventosSalvosResult.rows.length === 0) {
        return res.status(200).json([]);
      }

      // Busca os detalhes dos eventos salvos
      const eventosIds = eventosSalvosResult.rows.map(row => row.evento_id);
      
      const eventosQuery = `
        SELECT id_evento, nome, descricao, cep, endereco, link_ingresso, 
               line_up, estado, tipo_evento, imagem, data
        FROM eventos
        WHERE id_evento = ANY($1::int[])
      `;
      
      const eventosResult = await pool.query(eventosQuery, [eventosIds]);

      // Formata os dados para o frontend
      const eventosComImagem = eventosResult.rows.map(evento => ({
        ...evento,
        imagemUrl: evento.imagem ? `data:image/jpeg;base64,${evento.imagem.toString('base64')}` : null,
        titulo: evento.nome,
        data: new Date(evento.data).toLocaleDateString('pt-BR'),
        endereco: `${evento.endereco}, ${evento.estado}`
      }));

      res.status(200).json(eventosComImagem);
    } catch (err) {
      console.error('Erro ao buscar eventos salvos:', err);
      res.status(500).send('Erro ao buscar eventos salvos.');
    }
  } else {
    res.status(405).send('Método não permitido');
  }
};
