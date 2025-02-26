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
    const { 
      nome, telefone, email, cep, rua, numero, complemento, cnpj, senha 
    } = req.body;

    console.log('Valores recebidos para inserção:', {
      nome, telefone, email, cep, rua, numero, complemento, cnpj, senha
    });

    if (!senha) {
      return res.status(400).send('Erro: A senha é obrigatória.');
    }

    try {
      const checkQuery = `SELECT 1 FROM usuario_promotor WHERE cnpj = $1`;
      const checkResult = await pool.query(checkQuery, [cnpj]);

      if (checkResult.rowCount > 0) {
        console.warn(`CNPJ já cadastrado: ${cnpj}`);
        return res.status(400).send('Erro: CNPJ já está registrado.');
      }

      const query = `
        INSERT INTO usuario_promotor (
          nome_responsavel, cnpj, telefone, email, rua, numero, bairro, cidade, estado, cep, senha
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      `;

      const values = [
        nome, 
        cnpj, 
        telefone, 
        email, // Incluído o campo email
        rua, 
        numero, 
        complemento || '', 
        '', 
        '', 
        cep,
        senha // Senha sem criptografia
      ];

      console.log('Executando query:', query);
      console.log('Com valores:', values);

      const result = await pool.query(query, values);
      console.log('Resultado da query:', result);

      res.status(200).send('Usuário promotor registrado com sucesso!');
    } catch (err) {
      if (err.code === '23505') { 
        console.error('Erro de duplicidade de chave primária:', err);
        res.status(400).send('Erro: CNPJ já está registrado.');
      } else {
        console.error('Erro ao executar query:', err);
        res.status(500).send('Erro ao registrar usuário promotor.');
      }
    }
  } else {
    res.status(405).send('Método não permitido');
  }
};

