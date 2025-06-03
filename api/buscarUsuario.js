const { Pool } = require("pg");
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

module.exports = async (req, res) => {
  const { method, query, url } = req;

  console.log(`[${new Date().toISOString()}] ${method} ${url}`);

  // Rota: buscar dados do usuário por e-mail
  if (method === "GET" && url.includes("/api/usuario")) {
    const { email } = query;

    if (!email) {
      console.log('Erro: E-mail não fornecido');
      return res.status(400).json({ 
        success: false,
        error: "E-mail é obrigatório" 
      });
    }

    try {
      console.log('Buscando usuário com e-mail:', email);
      const resultado = await pool.query(
        `SELECT 
          nome, 
          cpf, 
          email_usuario as email,
          telefone,
          data_nascimento,
          sexo,
          endereco,
          cep,
          numero,
          complemento,
          municipio,
          uf
         FROM usuario WHERE email_usuario = $1`, 
        [email]
      );

      if (resultado.rows.length === 0) {
        console.log('Usuário não encontrado para o e-mail:', email);
        return res.status(404).json({ 
          success: false,
          error: "Usuário não encontrado" 
        });
      }

      const usuario = resultado.rows[0];
      console.log('Usuário encontrado:', usuario);
      
      return res.status(200).json({
        success: true,
        data: usuario
      });
    } catch (error) {
      console.error("Erro ao buscar usuário:", error);
      return res.status(500).json({ 
        success: false,
        error: "Erro interno do servidor" 
      });
    }
  }

  // Método não permitido
  return res.status(405).json({
    success: false,
    error: "Método não permitido"
  });
};
