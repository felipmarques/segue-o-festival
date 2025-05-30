const { Pool } = require('pg');

// Configuração do banco
const poolConfig = {
  connectionString: process.env.DATABASE_URL || 'sua-string-de-conexao-local',
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
};

const pool = new Pool(poolConfig);

// Aumenta o timeout para 30s (Vercel padrão é 10s)
export const config = {
  maxDuration: 30,
};

export default async (req, res) => {
  console.log('--- INÍCIO DA REQUISIÇÃO ---');

  try {
    // 1. Verifique o método HTTP
    if (!['GET', 'POST'].includes(req.method)) {
      console.log('Método não permitido:', req.method);
      return res.status(405).json({ erro: 'Método não permitido' });
    }

    // 2. Log dos headers para debug
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

    // 4. Lógica principal
    if (req.method === 'POST') {
      console.log('Processando POST...');

      const { id_evento, acao } = req.body;

      if (!id_evento || !acao) {
        return res.status(400).json({ erro: 'Campos obrigatórios ausentes' });
      }

      try {
        const resultado = await pool.query(
          'INSERT INTO eventos_salvos (usuario_cpf, id_evento, acao) VALUES ($1, $2, $3) RETURNING *',
          [usuario.cpf, id_evento, acao]
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

    if (req.method === 'GET') {
      // Se quiser adicionar a lógica de GET futuramente
      return res.status(200).json({ mensagem: 'GET implementado futuramente' });
    }

  } catch (error) {
    console.error('ERRO GLOBAL:', error);
    return res.status(500).json({ 
      erro: 'Erro interno',
      detalhes: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  } finally {
    // ⚠️ NÃO usar pool.end() aqui!
    console.log('--- FIM DA REQUISIÇÃO ---');
  }
};
