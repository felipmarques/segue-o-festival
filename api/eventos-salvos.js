const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

module.exports = async (req, res) => {
  console.log('Requisição recebida:', req.method, req.query);

  try {
    switch (req.method) {
      case 'GET':
        // GET /api/eventos-salvos?cpf=XXX&evento_id=YYY
        if (req.query.cpf && req.query.evento_id) {
          const query = `
            SELECT * FROM eventos_salvos 
            WHERE usuario_cpf = $1 AND evento_id = $2
          `;
          const result = await pool.query(query, [req.query.cpf, req.query.evento_id]);
          res.status(200).json(result.rows);
        } 
        // GET /api/eventos-salvos?cpf=XXX (todos eventos salvos do usuário)
        else if (req.query.cpf) {
          const query = `
            SELECT e.* FROM eventos e
            JOIN eventos_salvos es ON e.id_evento = es.evento_id
            WHERE es.usuario_cpf = $1
          `;
          const result = await pool.query(query, [req.query.cpf]);
          
          // Converte buffer da imagem para base64
          const eventosComImagem = result.rows.map(evento => ({
            ...evento,
            imagem: evento.imagem ? evento.imagem.toString('base64') : null
          }));
          
          res.status(200).json(eventosComImagem);
        } else {
          res.status(400).send('CPF do usuário é obrigatório');
        }
        break;

      case 'POST':
        // POST /api/eventos-salvos
        const { usuario_cpf, evento_id } = req.body;
        
        if (!usuario_cpf || !evento_id) {
          return res.status(400).send('CPF do usuário e ID do evento são obrigatórios');
        }

        // Verifica se o evento já está salvo
        const checkQuery = `
          SELECT id FROM eventos_salvos 
          WHERE usuario_cpf = $1 AND evento_id = $2
        `;
        const checkResult = await pool.query(checkQuery, [usuario_cpf, evento_id]);

        if (checkResult.rows.length > 0) {
          return res.status(409).send('Evento já está salvo para este usuário');
        }

        // Insere novo registro
        const insertQuery = `
          INSERT INTO eventos_salvos (usuario_cpf, evento_id)
          VALUES ($1, $2)
          RETURNING *
        `;
        const insertResult = await pool.query(insertQuery, [usuario_cpf, evento_id]);
        res.status(201).json(insertResult.rows[0]);
        break;

      case 'DELETE':
        // DELETE /api/eventos-salvos?cpf=XXX&evento_id=YYY
        if (!req.query.cpf || !req.query.evento_id) {
          return res.status(400).send('CPF do usuário e ID do evento são obrigatórios');
        }

        const deleteQuery = `
          DELETE FROM eventos_salvos 
          WHERE usuario_cpf = $1 AND evento_id = $2
          RETURNING *
        `;
        const deleteResult = await pool.query(deleteQuery, [req.query.cpf, req.query.evento_id]);

        if (deleteResult.rows.length === 0) {
          return res.status(404).send('Registro não encontrado');
        }

        res.status(200).json(deleteResult.rows[0]);
        break;

      default:
        res.setHeader('Allow', ['GET', 'POST', 'DELETE']);
        res.status(405).send('Método não permitido');
    }
  } catch (err) {
    console.error('Erro na API eventos-salvos:', err);
    res.status(500).send('Erro interno do servidor');
  }
};
