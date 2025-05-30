const { Pool } = require('pg');

// Configuração da conexão
const poolConfig = {
  connectionString: process.env.DATABASE_URL || 'sua-string-de-conexao-local',
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
};

const pool = new Pool(poolConfig);

// Tempo limite aumentado para Vercel
export const config = {
  maxDuration: 30,
};

export default async (req, res) => {
  console.log('--- INÍCIO DA REQUISIÇÃO ---');

  try {
    // 1. Verifique o método
    if (!['GET', 'POST'].includes(req.method)) {
      console.log('Método não permitido:', req.method);
      return res.status(405).json({ erro: 'Método não permitido' });
    }

    // 2. Log dos headers
    console.log('Headers recebidos:', req.headers);

    // 3. Valide o usuário logado
    let usuario;
    try {
      const header = req.headers['usuario-logado'];
      if (!header) throw new Error('Header ausente');

      usuario = JSON.parse(header);
      console.log('Usuário parseado:', usuario);

      if (!usuario?.cpf) {
        throw new Error('CPF não encontrado no usuário');
      }
    } catch (e) {
      console.error('Erro ao validar usuário:', e);
      return res.status(401).json({
        erro: 'Autenticação inválida',
        detalhes: e.message
      });
    }

    // 4. Processamento POST
    if (req.method === 'POST') {
      console.log('Processando POST...');

      const { evento_id } = req.body;

      if (!evento_id) {
        return res.status(400).json({ erro: 'Campo evento_id é obrigatório' });
      }

      try {
        const resultado = await pool.query(
          'INSERT INTO eventos_salvos (usuario_cpf, evento_id) VALUES ($1, $2) RETURNING *',
          [usuario.cpf, evento_id]
        );

        return res.status(201).json({
          sucesso: true,
          dados: resultado.rows[0]
        });
      } catch (erroDB) {
        console.error('Erro ao salvar no banco:', erroDB);
        return res.status(500).json({
          erro: 'Erro ao salvar no banco',
          detalhes: erroDB.message
        });
      }
    }

    // 5. (Opcional) lógica GET futura
    if (req.method === 'GET') {
      return res.status(200).json({ mensagem: 'GET implementado futuramente' });
    }

  } catch (error) {
    console.error('ERRO GLOBAL:', error);
    return res.status(500).json({
      erro: 'Erro interno',
      detalhes: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  } finally {
    console.log('--- FIM DA REQUISIÇÃO ---');
  }
};
