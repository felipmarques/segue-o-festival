const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

module.exports = async (req, res) => {
  if (req.method !== 'PUT') {
    return res.status(405).send('Método não permitido');
  }

  const { id_evento } = req.query;
  const { cnpj } = req.body;

  if (!id_evento || !cnpj) {
    return res.status(400).send('Parâmetros inválidos.');
  }

  try {
    // Verificar se o evento pertence ao promotor
    const verifyQuery = `
      SELECT 1 FROM eventos 
      WHERE id_evento = $1 AND id_promotor = $2;
    `;
    const verifyResult = await pool.query(verifyQuery, [id_evento, cnpj]);
    
    if (verifyResult.rowCount === 0) {
      return res.status(403).send('Você não tem permissão para editar este evento.');
    }

    // Atualizar o evento
    const { nome, descricao, data, endereco, cep, link_ingresso, line_up, estado, tipo_evento } = req.body;
    
    const updateQuery = `
      UPDATE eventos SET
        nome = $1,
        descricao = $2,
        data = $3,
        endereco = $4,
        cep = $5,
        link_ingresso = $6,
        line_up = $7,
        estado = $8,
        tipo_evento = $9
      WHERE id_evento = $10
      RETURNING *;
    `;
    
    const updateResult = await pool.query(updateQuery, [
      nome, descricao, data, endereco, cep, 
      link_ingresso, line_up, estado, tipo_evento, id_evento
    ]);

    return res.status(200).json(updateResult.rows[0]);
  } catch (error) {
    console.error('Erro ao editar evento:', error);
    return res.status(500).send('Erro ao editar evento.');
  }
};
