const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

module.exports = async (req, res) => {
  if (req.method === 'GET') {
    const { email } = req.query;

    if (!email) {
      return res.status(400).json({ message: 'Email é obrigatório' });
    }

    try {
      const query = `
        SELECT nome, cpf, data_nascimento, sexo, endereco, cep, numero,
               complemento, municipio, uf, email_usuario AS email, senha_usuario AS senha
        FROM usuario
        WHERE email_usuario = $1
      `;
      const result = await pool.query(query, [email]);

      if (result.rowCount === 0) {
        return res.status(404).json({ message: 'Usuário não encontrado' });
      }

      return res.status(200).json(result.rows[0]);
    } catch (err) {
      console.error('Erro ao consultar o usuário:', err);
      return res.status(500).json({ message: 'Erro interno do servidor' });
    }
  }

  if (req.method === 'POST') {
    const {
      nome,
      cpf,
      data_nascimento,
      sexo,
      endereco,
      cep,
      numero,
      complemento,
      municipio,
      uf,
      email,
      senha
    } = req.body;

    // Validações
    const senhaRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?#&])[A-Za-z\d@$!%*?#&]{8,}$/;
    if (!senhaRegex.test(senha)) {
      return res.status(400).json({
        message:
          'A senha deve ter no mínimo 8 caracteres, com pelo menos uma letra maiúscula, uma minúscula, um número e um caractere especial.'
      });
    }

    if (!/^\d{11}$/.test(cpf)) {
      return res.status(400).json({ message: 'CPF deve conter 11 dígitos numéricos.' });
    }

    if (!/^\d{8}$/.test(cep)) {
      return res.status(400).json({ message: 'CEP deve conter 8 dígitos numéricos.' });
    }

    if (!/^\d{2}\/\d{2}\/\d{4}$/.test(data_nascimento)) {
      return res.status(400).json({ message: 'Data deve estar no formato dd/mm/aaaa.' });
    }

    // ✅ CONVERTE DATA PARA FORMATO ISO (yyyy-mm-dd)
    const [dia, mes, ano] = data_nascimento.split('/');
    const dataISO = `${ano}-${mes}-${dia}`;

    try {
      const query = `
        UPDATE usuario
        SET nome = $1, cpf = $2, data_nascimento = $3, sexo = $4, endereco = $5,
            cep = $6, numero = $7, complemento = $8, municipio = $9, uf = $10, senha = $11
        WHERE email_usuario = $12
      `;
      const values = [
        nome,
        cpf,
        dataISO,  // ✅ agora no formato correto
        sexo,
        endereco,
        cep,
        numero,
        complemento,
        municipio,
        uf,
        senha,
        email
      ];

      const result = await pool.query(query, values);

      if (result.rowCount === 0) {
        return res.status(404).json({ message: 'Usuário não encontrado para atualizar.' });
      }

      return res.status(200).json({ message: 'Dados atualizados com sucesso!' });
    } catch (err) {
      console.error('Erro ao atualizar o usuário:', err);
      return res.status(500).json({ message: 'Erro interno ao atualizar o usuário.' });
    }
  }

  return res.status(405).json({ message: 'Método não permitido' });
};
