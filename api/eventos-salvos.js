const { Pool } = require('pg');

// Configuração com fallback explícito
const poolConfig = {
  connectionString: process.env.DATABASE_URL || 'sua-string-de-conexao-local',
  ssl: process.env.NODE_ENV === 'production' ? { 
    rejectUnauthorized: false 
  } : false
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
    if (req.method === 'GET') {
      console.log('Processando GET...');
      // ... (seu código existente)
      
    } else if (req.method === 'POST') {
      console.log('Processando POST...');
      // ... (seu código existente)
    }

  } catch (error) {
    console.error('ERRO GLOBAL:', error);
    return res.status(500).json({ 
      erro: 'Erro interno',
      detalhes: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  } finally {
    await pool.end().catch(e => console.error('Erro ao fechar pool:', e));
    console.log('--- FIM DA REQUISIÇÃO ---');
  }
};
