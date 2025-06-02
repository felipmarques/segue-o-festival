const { Pool } = require("pg");
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

module.exports = async (req, res) => {
  const { method, query, body, url } = req;

  console.log(`[${new Date().toISOString()}] ${method} ${url}`);

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
      console.log('Buscando promotor com e-mail:', email);
      const resultado = await pool.query(
        "SELECT nome_responsavel, cnpj, email, telefone, rua, cep, numero, complemento, bairro FROM usuario_promotor WHERE email = $1", 
        [email]
      );
    
      console.log('Resultado da query:', resultado.rows);
    
      if (resultado.rows.length === 0) {
        console.log('Promotor não encontrado para o e-mail:', email);
        return res.status(404).json({ 
          success: false,
          error: "Promotor não encontrado" 
        });
      }
    
      const promotor = resultado.rows[0];
      console.log('Promotor encontrado:', promotor);
    
      return res.status(200).json({
        success: true,
        data: {
          nome_responsavel: promotor.nome_responsavel,
          cnpj: promotor.cnpj,
          email: promotor.email,
          telefone: promotor.telefone,
          endereco: promotor.rua, // Mapeando rua para endereco no front
          cep: promotor.cep,
          numero: promotor.numero,
          complemento: promotor.complemento,
          municipio: promotor.bairro // Mapeando bairro para municipio no front
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

  // Rota: atualizar dados do promotor
  if (method === "PUT" && url.includes("/api/buscarPromotor")) {
    const { email } = query;
    const dadosAtualizados = body;

    if (!email) {
      return res.status(400).json({ 
        success: false,
        error: "E-mail é obrigatório" 
      });
    }

    try {
      const resultado = await pool.query(
        `UPDATE usuario_promotor SET
          nome_responsavel = $1,
          cnpj = $2,
          telefone = $3,
          rua = $4,
          cep = $5,
          numero = $6,
          complemento = $7,
          bairro = $8
          ${dadosAtualizados.senha ? ', senha = $9' : ''}
        WHERE email = ${dadosAtualizados.senha ? '$10' : '$9'}`,
        dadosAtualizados.senha ? [
          dadosAtualizados.nome_responsavel,
          dadosAtualizados.cnpj,
          dadosAtualizados.telefone,
          dadosAtualizados.endereco, // Mapeando endereco para rua no BD
          dadosAtualizados.cep,
          dadosAtualizados.numero,
          dadosAtualizados.complemento,
          dadosAtualizados.municipio, // Mapeando municipio para bairro no BD
          dadosAtualizados.senha,
          email
        ] : [
          dadosAtualizados.nome_responsavel,
          dadosAtualizados.cnpj,
          dadosAtualizados.telefone,
          dadosAtualizados.endereco,
          dadosAtualizados.cep,
          dadosAtualizados.numero,
          dadosAtualizados.complemento,
          dadosAtualizados.municipio,
          email
        ]
      );

      return res.status(200).json({
        success: true,
        message: "Dados atualizados com sucesso"
      });
    } catch (error) {
      console.error("Erro ao atualizar promotor:", error);
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
