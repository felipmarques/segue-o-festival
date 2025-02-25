const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false 
  }
});

module.exports = async (req, res) => {
  console.log('Requisição recebida:', req.body);

  if (req.method === 'POST') {
  
    const { nome, descricao, cep, endereco, link_ingresso, line_up, estado, tipo_evento } = req.body;

    console.log('Valores recebidos para inserção:', {
      nome, descricao, cep, endereco, link_ingresso, line_up, estado, tipo_evento
    });

    try {
      // Verifica se o evento já existe
      const checkQuery = `SELECT 1 FROM eventos WHERE nome = $1 AND cep = $2`;
      const checkResult = await pool.query(checkQuery, [nome, cep]);

      if (checkResult.rowCount > 0) {
        console.warn(`Evento já cadastrado: ${nome}`);
        return res.status(400).send('Erro: Evento já está registrado.');
      }

      // Query corrigida com estado e tipo_evento
      const query = `
        INSERT INTO eventos (
          nome, descricao, cep, endereco, link_ingresso, line_up, estado, tipo_evento
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      `;

      // Adicionando os valores corretamente
      const values = [
        nome, 
        descricao, 
        cep, 
        endereco, 
        link_ingresso, 
        line_up,
        estado,    
        tipo_evento  
      ];

      console.log('Executando query:', query);
      console.log('Com valores:', values);

      const result = await pool.query(query, values);
      console.log('Resultado da query:', result);

      res.status(200).send('Evento registrado com sucesso!');
    } catch (err) {
      if (err.code === '23505') { 
        console.error('Erro de duplicidade de chave primária:', err);
        res.status(400).send('Erro: Evento já está registrado.');
      } else {
        console.error('Erro ao executar query:', err);
        res.status(500).send('Erro ao registrar evento.');
      }
    }
  } else {
    res.status(405).send('Método não permitido');
  }
};
