const { Pool } = require('pg');
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});
const fs = require('fs');

const convertToBlob = (filePath) => {
  return fs.readFileSync(filePath);
};

module.exports = async (req, res) => {
  console.log('Requisição recebida:', req.body);

  if (req.method === 'POST') {
    const {
      nome_evento, classificacao_indicativa, descricao, site_externo, data_inicio, data_fim
    } = req.body;

    console.log('Valores recebidos para inserção:', {
      nome_evento, classificacao_indicativa, descricao, site_externo, data_inicio, data_fim
    });

    let banner1 = null;
    let banner2 = null;

    if (req.files) {
      banner1 = req.files[0] ? convertToBlob(req.files[0].path) : null;
      banner2 = req.files[1] ? convertToBlob(req.files[1].path) : null;
    }

    try {
      const query = `
        INSERT INTO evento (
          nome_evento, classificacao_indicativa, descricao, site_externo, data_inicio, data_fim, banner1, banner2
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING id;
      `;

      const values = [
        nome_evento,
        classificacao_indicativa,
        descricao,
        site_externo,
        data_inicio,
        data_fim,
        banner1,
        banner2
      ];

      console.log('Executando query:', query);
      console.log('Com valores:', values);

      const result = await pool.query(query, values);
      console.log('Resultado da query:', result);

      res.status(200).send(`Evento registrado com sucesso! ID: ${result.rows[0].id}`);
    } catch (err) {
      console.error('Erro ao executar query:', err);
      res.status(500).send('Erro ao registrar o evento.');
    }
  } else {
    res.status(405).send('Método não permitido');
  }
};

