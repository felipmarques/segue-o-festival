const { Pool } = require("pg");
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Função para formatar CNPJ
function formatarCNPJ(cnpj) {
  if (!cnpj) return '';
  const apenasNumeros = cnpj.replace(/\D/g, '');
  return apenasNumeros.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5');
}

// Função para formatar telefone
function formatarTelefone(telefone) {
  if (!telefone) return '';
  const apenasNumeros = telefone.replace(/\D/g, '');
  if (apenasNumeros.length === 11) {
    return apenasNumeros.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
  }
  return telefone;
}

// Função para formatar CEP
function formatarCEP(cep) {
  if (!cep) return '';
  const apenasNumeros = cep.replace(/\D/g, '');
  return apenasNumeros.replace(/(\d{5})(\d{3})/, '$1-$2');
}

module.exports = async (req, res) => {
  const { method, query, body, url } = req;

  console.log(`[${new Date().toISOString()}] ${method} ${url}`, {
    queryParams: query,
    body: method === 'PUT' ? body : undefined
  });

  try {
    // Rota: buscar dados do promotor por e-mail (GET)
    if (method === "GET" && url.includes("/api/buscarPromotor")) {
      const { email } = query;

      if (!email) {
        console.log('Erro: E-mail não fornecido');
        return res.status(400).json({ 
          success: false,
          error: "E-mail é obrigatório" 
        });
      }

      const client = await pool.connect();
      try {
        console.log('Buscando promotor com e-mail:', email);
        const resultado = await client.query(
          `SELECT 
            nome_responsavel, 
            cnpj, 
            email, 
            telefone, 
            rua, 
            cep, 
            numero, 
            complemento, 
            bairro 
           FROM usuario_promotor 
           WHERE email = $1`, 
          [email]
        );
      
        if (resultado.rows.length === 0) {
          console.log('Nenhum promotor encontrado para o e-mail:', email);
          return res.status(404).json({ 
            success: false,
            error: "Promotor não encontrado" 
          });
        }
        
        const promotor = resultado.rows[0];
        console.log('Dados encontrados:', promotor);

        // Formatar resposta com tratamento para valores nulos
        const resposta = {
          success: true,
          data: {
            nome_responsavel: promotor.nome_responsavel || '',
            cnpj: promotor.cnpj ? formatarCNPJ(promotor.cnpj) : '',
            email: promotor.email || '',
            telefone: promotor.telefone ? formatarTelefone(promotor.telefone) : '',
            endereco: promotor.rua || '',
            cep: promotor.cep ? formatarCEP(promotor.cep) : '',
            numero: promotor.numero || '',
            complemento: promotor.complemento || '',
            municipio: promotor.bairro || 'sao_paulo'
          }
        };

        return res.status(200).json(resposta);

      } finally {
        client.release();
      }
    }

    // Rota: atualizar dados do promotor (PUT)
    if (method === "PUT" && url.includes("/api/buscarPromotor")) {
      const { email } = query;

      if (!email) {
        return res.status(400).json({ 
          success: false,
          error: "E-mail é obrigatório" 
        });
      }

      if (!body) {
        return res.status(400).json({ 
          success: false,
          error: "Dados de atualização são obrigatórios" 
        });
      }

      const client = await pool.connect();
      try {
        console.log('Atualizando promotor com e-mail:', email);
        console.log('Dados recebidos para atualização:', body);

        // Construir a query dinamicamente para lidar com a senha opcional
        const campos = [];
        const valores = [];
        let contador = 1;

        // Adicionar campos básicos
        const camposParaAtualizar = {
          nome_responsavel: body.nome_responsavel,
          cnpj: body.cnpj,
          telefone: body.telefone,
          rua: body.endereco, // Mapeia endereco para rua no BD
          cep: body.cep,
          numero: body.numero,
          complemento: body.complemento,
          bairro: body.municipio // Mapeia municipio para bairro no BD
        };

        for (const [campo, valor] of Object.entries(camposParaAtualizar)) {
          if (valor !== undefined) {
            campos.push(`${campo} = $${contador}`);
            valores.push(valor);
            contador++;
          }
        }

        // Adicionar senha se fornecida
        if (body.senha) {
          campos.push(`senha = $${contador}`);
          valores.push(body.senha);
          contador++;
        }

        // Adicionar condição WHERE
        valores.push(email);
        const whereClause = `WHERE email = $${contador}`;

        const queryText = `UPDATE usuario_promotor SET ${campos.join(', ')} ${whereClause} RETURNING *`;
        console.log('Query de atualização:', queryText);

        const resultado = await client.query(queryText, valores);
        
        if (resultado.rowCount === 0) {
          return res.status(404).json({
            success: false,
            error: "Promotor não encontrado"
          });
        }

        return res.status(200).json({
          success: true,
          message: "Dados atualizados com sucesso",
          data: {
            nome_responsavel: resultado.rows[0].nome_responsavel,
            email: resultado.rows[0].email
          }
        });

      } finally {
        client.release();
      }
    }

    // Método não permitido
    return res.status(405).json({
      success: false,
      error: "Método não permitido"
    });

  } catch (error) {
    console.error("Erro no servidor:", {
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
};
