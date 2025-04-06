const { Pool } = require('pg');
const multer = require('multer');

// Configura o multer para armazenar arquivos em memória
const upload = multer();

// Conexão com o banco Neon (PostgreSQL)
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// Função principal exportada para lidar com a requisição
module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).send('Método não permitido');
  }

  // Processa o upload da imagem com multer
  upload.single('imagem')(req, res, async function (err) {
    if (err) {
      console.error('Erro ao processar imagem:', err);
      return res.status(500).send('Erro ao processar imagem.');
    }

    try {
      // Extrai os dados do corpo da requisição
      const {
        nome,
        descricao,
        cep,
        endereco,
        link_ingresso,
        line_up,
        estado,
        tipo_evento
      } = req.body;

      const imagemBuffer = req.file?.buffer || null;

      // Verifica duplicidade
      const checkQuery = `SELECT 1 FROM eventos WHERE nome = $1 AND cep = $2`;
      const checkResult = await pool.query(checkQuery, [nome, cep]);

      if (checkResult.rowCount > 0) {
        return res.status(400).send('Erro: Evento já está registrado.');
      }

      // Insere o evento no banco de dados, incluindo a imagem
      const query = `
        INSERT INTO eventos (
          nome, descricao, cep, endereco,
          link_ingresso, line_up, estado,
          tipo_evento, imagem
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      `;

      const values = [
        nome,
        descricao,
        cep,
        endereco,
        link_ingresso,
        line_up,
        estado,
        tipo_evento,
        imagemBuffer
      ];

      await pool.query(query, values);

      res.status(200).send('Evento registrado com sucesso!');
    } catch (err) {
      console.error('Erro ao registrar evento:', err);
      res.status(500).send('Erro ao registrar evento.');
    }
  });
};

