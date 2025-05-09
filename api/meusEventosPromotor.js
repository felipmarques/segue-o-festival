const { Pool } = require('./db');

module.exports = async (req, res) => {
  if (req.method !== 'GET') {
    return res.status(405).send('Método não permitido');
  }

  const { cnpj } = req.query; // Obtendo o CNPJ do usuário promotor

  if (!cnpj) {
    return res.status(400).send('Erro: CNPJ do usuário não fornecido.');
  }
// Segunda funcionalidade de teste — retorna apenas o CNPJ enviado
if (req.query.teste === 'cnpj') {
  return res.status(200).json({ mensagem: `CNPJ recebido: ${cnpj}` });
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

    // Segunda funcionalidade simples - Exibindo o CNPJ do usuário
    console.log(`CNPJ do usuário: ${cnpj}`);
    res.setHeader('CNPJ', cnpj);  // Adiciona o CNPJ no cabeçalho da resposta

    // Retorna os eventos com as imagens convertidas
    res.status(200).json(eventosComImagem);
  } catch (error) {
    console.error('Erro ao buscar eventos:', error);
    res.status(500).send('Erro ao recuperar eventos.');
  }
else if (req.method === 'POST') {
    let body = req.body;
  
    // Garante que seja um objeto (em ambientes onde req.body pode vir como string)
    if (typeof body === 'string') {
      try {
        body = JSON.parse(body);
      } catch (err) {
        return res.status(400).json({ erro: 'JSON inválido no corpo da requisição.' });
      }
    }
  
    const { cpf, evento_id } = body;
  
    if (!cpf || !evento_id) {
      return res.status(400).json({ erro: 'Erro: CPF e ID do evento são obrigatórios.' });
    }
  
    try {
      const checkQuery = `SELECT 1 FROM eventos_salvos WHERE usuario_cpf = $1 AND evento_id = $2`;
      const checkResult = await pool.query(checkQuery, [cpf, evento_id]);
  
      if (checkResult.rowCount > 0) {
        return res.status(409).json({ mensagem: 'Evento já salvo anteriormente.' });
      }
  
      const insertQuery = `INSERT INTO eventos_salvos (usuario_cpf, evento_id) VALUES ($1, $2)`;
      await pool.query(insertQuery, [cpf, evento_id]);
  
      return res.status(201).json({ mensagem: 'Evento salvo com sucesso!' });
    } catch (error) {
      console.error('Erro ao salvar evento:', error);
      return res.status(500).json({ erro: 'Erro ao salvar evento.' });
    }
}

};
