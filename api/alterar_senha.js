const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

export default async function handler(req, res) {
  if (req.method !== 'PUT') {
    return res.status(405).json({ success: false, message: 'Método não permitido' });
  }

  const { email, senha_atual, nova_senha, nome, telefone, data_nascimento, sexo, 
          endereco, cep, numero, complemento, municipio, uf } = req.body;

  try {
    // 1. Verificar se a senha atual está correta
    const usuario = await pool.query(
      'SELECT * FROM usuario WHERE email_usuario = $1 AND senha_usuario = $2',
      [email, senha_atual]
    );

    if (usuario.rowCount === 0) {
      return res.status(401).json({ success: false, message: 'Senha atual incorreta' });
    }

    // 2. Atualizar os dados do usuário
    const camposParaAtualizar = [];
    const valores = [];
    
    if (nova_senha) camposParaAtualizar.push('senha_usuario = $1');
    if (nome) camposParaAtualizar.push('nome = $2');
    if (telefone) camposParaAtualizar.push('telefone = $3');
    if (data_nascimento) camposParaAtualizar.push('data_nascimento = $4');
    if (sexo) camposParaAtualizar.push('sexo = $5');
    if (endereco) camposParaAtualizar.push('endereco = $6');
    if (cep) camposParaAtualizar.push('cep = $7');
    if (numero) camposParaAtualizar.push('numero = $8');
    if (complemento) camposParaAtualizar.push('complemento = $9');
    if (municipio) camposParaAtualizar.push('municipio = $10');
    if (uf) camposParaAtualizar.push('uf = $11');

    if (camposParaAtualizar.length === 0) {
      return res.status(400).json({ success: false, message: 'Nenhum dado para atualizar' });
    }

    const query = `
      UPDATE usuario 
      SET ${camposParaAtualizar.join(', ')} 
      WHERE email_usuario = $${camposParaAtualizar.length + 1}
      RETURNING email_usuario, nome
    `;

    const params = [];
    if (nova_senha) params.push(nova_senha);
    if (nome) params.push(nome);
    if (telefone) params.push(telefone);
    if (data_nascimento) params.push(data_nascimento);
    if (sexo) params.push(sexo);
    if (endereco) params.push(endereco);
    if (cep) params.push(cep);
    if (numero) params.push(numero);
    if (complemento) params.push(complemento);
    if (municipio) params.push(municipio);
    if (uf) params.push(uf);
    
    params.push(email);

    const result = await pool.query(query, params);

    return res.status(200).json({
      success: true,
      message: 'Perfil atualizado com sucesso',
      usuario: result.rows[0]
    });

  } catch (error) {
    console.error('Erro ao atualizar perfil:', error);
    return res.status(500).json({ success: false, message: 'Erro interno do servidor' });
  }
}
