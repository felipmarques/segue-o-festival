const { Pool } = require('pg');
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

module.exports = async (req, res) => {
  // Pega o CPF do usuário logado do header (como você já faz)
  const usuario = JSON.parse(req.headers['usuario-logado'] || 'null');
  const cpf = usuario?.cpf;

  if (!cpf) {
    return res.status(401).json({ erro: 'Usuário não autenticado' });
  }

  if (req.method === 'GET') {
    // LISTAR EVENTOS SALVOS
    try {
      // 1. Pega os IDs dos eventos salvos do usuário
      const resultUsuario = await pool.query(
        'SELECT eventos_salvos FROM usuario WHERE cpf = $1',
        [cpf]
      );
      
      const idsEventos = resultUsuario.rows[0]?.eventos_salvos || [];
      if (idsEventos.length === 0) {
        return res.json([]);
      }

      // 2. Busca os eventos completos
      const resultEventos = await pool.query(
        'SELECT * FROM eventos WHERE id_evento = ANY($1)',
        [idsEventos]
      );

      // Converte imagem para base64 (como você já faz)
      const eventos = resultEventos.rows.map(evento => ({
        ...evento,
        imagem: evento.imagem ? evento.imagem.toString('base64') : null
      }));

      res.status(200).json(eventos);
    } catch (err) {
      console.error('Erro ao buscar eventos salvos:', err);
      res.status(500).json({ erro: 'Erro interno' });
    }

  } else if (req.method === 'POST') {
    // SALVAR/REMOVER EVENTO
    try {
      const { id_evento, acao } = req.body; // "acao" pode ser "salvar" ou "remover"

      // 1. Pega a lista atual de eventos salvos
      const result = await pool.query(
        'SELECT eventos_salvos FROM usuario WHERE cpf = $1',
        [cpf]
      );
      let eventosSalvos = result.rows[0]?.eventos_salvos || [];

      // 2. Atualiza a lista
      if (acao === 'salvar') {
        if (!eventosSalvos.includes(id_evento)) {
          eventosSalvos.push(id_evento);
        }
      } else {
        eventosSalvos = eventosSalvos.filter(id => id !== id_evento);
      }

      // 3. Salva no banco
      await pool.query(
        'UPDATE usuario SET eventos_salvos = $1 WHERE cpf = $2',
        [eventosSalvos, cpf]
      );

      res.status(200).json({ sucesso: true });
    } catch (err) {
      console.error('Erro ao atualizar eventos salvos:', err);
      res.status(500).json({ erro: 'Erro interno' });
    }

  } else {
    res.status(405).send('Método não permitido');
  }
};
