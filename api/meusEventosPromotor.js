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
// ✅ TESTE 2 — Outra funcionalidade simples
 if (teste === 'usuarios') {
  try {
    const resultado = await pool.query('SELECT nome FROM usuario_promotor LIMIT 5;');
    const nomes = resultado.rows.map(row => row.nome);

    // <-- Aqui o log que você quer:
    console.log('Usuários encontrados:', nomes);

    return res.status(200).json({ usuarios: nomes });
  } catch (error) {
    console.error('Erro ao buscar nomes:', error);
    return res.status(500).send('Erro ao recuperar nomes de usuários.');
  }
}

};
