const { Pool } = require('./db');

module.exports = async (req, res) => {
  if (req.method !== 'GET') {
    return res.status(405).send('Método não permitido');
  }

  const { cnpj } = req.query; // Obtendo o CNPJ do usuário promotor

  if (!cnpj) {
    return res.status(400).send('Erro: CNPJ do usuário não fornecido.');
  }
  
  try {
    console.log(`Buscando eventos para o CNPJ: ${cnpj}`);

    // Primeira funcionalidade - Consulta dos eventos
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

    // Convertendo buffer da imagem para Base64 com prefixo correto
    const eventosComImagem = resultEventos.rows.map(evento => ({
      ...evento,
      imagem: evento.imagem ? `data:image/jpeg;base64,${evento.imagem.toString('base64')}` : null
    }));

    // Retorna os eventos com as imagens convertidas
    res.status(200).json(eventosComImagem);
  } catch (error) {
    console.error('Erro ao buscar eventos:', error);
    res.status(500).send('Erro ao recuperar eventos.');
  }
  
// API DE EDIÇÃO DE EVENTO
if (req.method === 'PUT') {
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
    return res.status(200).json({ mensagem: 'Evento atualizado com sucesso!', evento: resultado.rows[0] });
  } catch (error) {
    console.error('Erro ao editar evento:', error);
    return res.status(500).send('Erro ao editar o evento.');
  }
}

};
