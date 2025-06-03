/*const { Pool } = require("pg");
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

module.exports = async (req, res) => {
  const { method, query, url } = req;

  console.log(`[${new Date().toISOString()}] ${method} ${url}`, query);

  // Rota: buscar dados do promotor por e-mail
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
      console.log('Tentando conectar ao banco de dados...');
      
      // Verifica se a conexão com o pool está OK
      const client = await pool.connect();
      console.log('Conexão com o banco estabelecida com sucesso');
      
      try {
        console.log('Executando query para email:', email);
        const resultado = await client.query(
          "SELECT nome_responsavel, cnpj, email, telefone, rua, cep, numero, complemento, bairro FROM usuario_promotor WHERE email = $1", 
          [email]
        );
        
        console.log('Query executada com sucesso. Resultados:', resultado.rows);
        
        if (resultado.rows.length === 0) {
          console.log('Nenhum promotor encontrado para o e-mail:', email);
          return res.status(404).json({ 
            success: false,
            error: "Promotor não encontrado" 
          });
        }
        
        const promotor = resultado.rows[0];
        console.log('Dados do promotor encontrado:', promotor);
        
        return res.status(200).json({
          success: true,
          data: {
            nome_responsavel: promotor.nome_responsavel,
            cnpj: promotor.cnpj,
            email: promotor.email,
            telefone: promotor.telefone,
            endereco: promotor.rua,
            cep: promotor.cep,
            numero: promotor.numero,
            complemento: promotor.complemento,
            municipio: promotor.bairro
          }
        });
      } finally {
        client.release();
      }
    } catch (error) {
      console.error("Erro detalhado:", {
        message: error.message,
        stack: error.stack,
        code: error.code
      });
      
      return res.status(500).json({ 
        success: false,
        error: "Erro interno do servidor",
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Método não permitido
  return res.status(405).json({
    success: false,
    error: "Método não permitido"
  });
};*/
