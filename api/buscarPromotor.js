const { Pool } = require("pg");
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

module.exports = async (req, res) => {
  const { method, query, url } = req;

  console.log(`[${new Date().toISOString()}] ${method} ${url}`);

  // Rota: buscar nome e CNPJ do promotor por e-mail
  if (method === "GET" && url.includes("/api/buscarPromotor")) {
    const { email } = query;

    if (!email) {
      console.log('Erro: E-mail não fornecido');
      return res.status(400).json({ 
        success: false,
        error: "E-mail é obrigatório" 
      });
    }

    try {
      console.log('Buscando promotor com e-mail:', email);
      const resultado = await pool.query(
        "SELECT nome, cnpj, email FROM usuario_promotor WHERE email = $1", 
        [email]
      );

      if (resultado.rows.length === 0) {
        console.log('Promotor não encontrado para o e-mail:', email);
        return res.status(404).json({ 
          success: false,
          error: "Promotor não encontrado" 
        });
      }

      const usuario_promotor = resultado.rows[0];
      console.log('Promotor encontrado:', usuario);
      
      return res.status(200).json({
        success: true,
        data: {
          nome: usuario_promotor.nome,
          cpf: usuario_promotor.cnpj,
          email: usuario_promotor.email
        }
      });
    } catch (error) {
      console.error("Erro ao buscar promotor:", error);
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