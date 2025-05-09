const { Pool } = require('./db');
const pool = new Pool();

module.exports = async (req, res) => {
  const metodo = req.method;

  // GET: Buscar eventos do promotor
  if (metodo === 'GET') {
    const { cnpj } = req.query;

    if (!cnpj) {
      return res.status(400).send('Erro: CNPJ do usuário não fornecido.');
    }

    try {
      console.log(`Buscando eventos para o CNPJ: ${cnpj}`);

      const queryEventos = `
        SELECT e.* 
        FROM eventos e
        JOIN usuario_promotor u ON e.id_promotor = u.cnpj
        WHERE u.cnpj = $1
        ORDER BY e.data DESC;
      `;

      const resultEventos = await pool.query(queryEventos, [cnpj]);

      if (resultEventos.rows.length === 0) {
        return res.status(404).send('Nenhum evento encontrado para este usuário.');
      }

      const eventosComImagem = resultEventos.rows.map(evento => ({
        ...evento,
        imagem: evento.imagem
          ? `data:image/jpeg;base64,${evento.imagem.toString('base64')}`
          : null,
      }));

      return res.status(200).json(eventosComImagem);
    } catch (error) {
      console.error('Erro ao buscar eventos:', error);
      return res.status(500).send('Erro ao recuperar eventos.');
    }
  }

  // PUT: Atualizar evento
  if (metodo === 'PUT') {
    const { id_evento, titulo, descricao, data, local } = req.body;

    if (!id_evento) {
      return res.status(400).send('ID do evento é obrigatório.');
    }

    try {
      const queryAtualizar = `
        UPDATE eventos
        SET 
          titulo = $1,
          descricao = $2,
          data = $3,
          local = $4
        WHERE id_evento = $5
        RETURNING *;
      `;

      const valores = [titulo, descricao, data, local, id_evento];
      const resultado = await pool.query(queryAtualizar, valores);

      if (resultado.rowCount === 0) {
        return res.status(404).send('Evento não encontrado.');
      }

      console.log('Evento atualizado com sucesso:', resultado.rows[0]);
      return res.status(200).json({
        mensagem: 'Evento atualizado com sucesso!',
        evento: resultado.rows[0],
      });
    } catch (error) {
      console.error('Erro ao editar evento:', error);
      return res.status(500).send('Erro ao editar o evento.');
    }
  }

  // Método não permitido
  return res.status(405).send('Método não permitido.');
};
