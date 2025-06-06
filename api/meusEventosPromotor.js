const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

module.exports = async (req, res) => {
  if (req.method !== 'GET') {
    return res.status(405).send('Método não permitido');
  }

  const { cnpj } = req.query; // Obtendo o CNPJ do usuário promotor

  if (!cnpj) {
    return res.status(400).send('Erro: CNPJ do usuário não fornecido.');
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
      return res.status(404).send('Nenhum evento encontrado para este usuário.');
    }

    // Convertendo buffer da imagem para Base64 com prefixo correto
    const eventosComImagem = result.rows.map(evento => ({
      ...evento,
      imagem: evento.imagem ? `data:image/jpeg;base64,${evento.imagem.toString('base64')}` : null
    }));

    res.status(200).json(eventosComImagem);
  } catch (error) {
    console.error('Erro ao buscar eventos:', error);
    res.status(500).send('Erro ao recuperar eventos.');
  }
};
