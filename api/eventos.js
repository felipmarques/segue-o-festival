const { Pool } = require('pg');

// Configuração do Neon (usando credenciais do .env)
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

export default async function handler(req, res) {
  if (req.method === 'POST') {
    const { nome, descricao, cep, endereco, link_ingresso, line_up } = req.body;

    // Verificação simples dos campos obrigatórios
    if (!nome || !descricao || !cep || !endereco || !link_ingresso || !line_up) {
      return res.status(400).json({ message: "Todos os campos são obrigatórios." });
    }

    try {
      // Inserção dos dados no banco de dados
      const query = `
        INSERT INTO eventos (nome, descricao, cep, endereco, link_ingresso, line_up)
        VALUES ($1, $2, $3, $4, $5, $6) RETURNING *;
      `;
      const values = [nome, descricao, cep, endereco, link_ingresso, line_up];

      const result = await pool.query(query, values);

      return res.status(201).json({
        message: "Evento cadastrado com sucesso!",
        evento: result.rows[0],
      });
    } catch (err) {
      console.error("Erro ao cadastrar evento:", err);
      return res.status(500).json({ message: "Erro interno do servidor." });
    }
  } else {
    return res.status(405).json({ message: "Método não permitido." });
  }
}
