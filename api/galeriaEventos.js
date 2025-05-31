const { Pool } = require("pg");
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

module.exports = async (req, res) => {
  const { method, query, body } = req;
  const path = req.url.split('?')[0];

  console.log(`[${new Date().toISOString()}] ${method} ${req.url}`);

  // Rota GET principal - Listar TODAS as fotos
  if (method === "GET" && path === "/api/galeriaEventos") {
    try {
      // Se houver CNPJ na query, filtra por promotor
      if (query.cnpj) {
        console.log(`Buscando fotos para CNPJ: ${query.cnpj}`);
        const result = await pool.query(
          `SELECT ge.id_imagem, ge.imagem, ge.data_upload
           FROM galeria_eventos ge
           JOIN eventos e ON ge.id_evento = e.id_evento
           WHERE e.cnpj_promotor = $1
           ORDER BY ge.data_upload DESC`,
          [query.cnpj]
        );
        return sendPhotos(res, result.rows);
      }
      
      // Caso contrário, retorna todas as fotos
      console.log('Buscando todas as fotos da galeria');
      const result = await pool.query(
        `SELECT id_imagem, imagem, data_upload 
         FROM galeria_eventos 
         ORDER BY data_upload DESC`
      );
      return sendPhotos(res, result.rows);
      
    } catch (error) {
      console.error("Erro ao buscar fotos:", error);
      return res.status(500).json({ 
        success: false,
        error: "Erro interno ao buscar fotos" 
      });
    }
  }

  // Rota POST - Adicionar nova foto
  if (method === "POST" && path === "/api/galeriaEventos") {
    try {
      const { id_evento, imagem } = body;
      
      if (!id_evento || !imagem) {
        return res.status(400).json({ 
          success: false,
          error: "ID do evento e imagem são obrigatórios" 
        });
      }

      console.log(`Adicionando foto para evento ${id_evento}`);
      const imagemBuffer = Buffer.from(imagem, 'base64');
      
      const result = await pool.query(
        `INSERT INTO galeria_eventos (id_evento, imagem)
         VALUES ($1, $2)
         RETURNING id_imagem, data_upload`,
        [id_evento, imagemBuffer]
      );
      
      return res.status(201).json({
        success: true,
        data: result.rows[0]
      });
      
    } catch (error) {
      console.error("Erro ao adicionar foto:", error);
      return res.status(500).json({ 
        success: false,
        error: "Erro interno ao adicionar foto" 
      });
    }
  }

  // Rota DELETE - Remover foto
  if (method === "DELETE" && path === "/api/galeriaEventos") {
    try {
      const { id_imagem } = query;
      
      if (!id_imagem) {
        return res.status(400).json({ 
          success: false,
          error: "ID da imagem é obrigatório" 
        });
      }

      console.log(`Removendo foto ID: ${id_imagem}`);
      const result = await pool.query(
        `DELETE FROM galeria_eventos 
         WHERE id_imagem = $1 
         RETURNING id_imagem`,
        [id_imagem]
      );
      
      if (result.rowCount === 0) {
        return res.status(404).json({ 
          success: false,
          error: "Foto não encontrada" 
        });
      }
      
      return res.status(200).json({
        success: true,
        data: { id_imagem: result.rows[0].id_imagem }
      });
      
    } catch (error) {
      console.error("Erro ao remover foto:", error);
      return res.status(500).json({ 
        success: false,
        error: "Erro interno ao remover foto" 
      });
    }
  }

  // Rota não encontrada
  return res.status(404).json({ 
    success: false,
    error: "Endpoint não encontrado" 
  });
};

// Função auxiliar para enviar fotos
function sendPhotos(res, rows) {
  const fotos = rows.map(row => ({
    id_imagem: row.id_imagem,
    imagem: row.imagem.toString('base64'),
    data_upload: row.data_upload
  }));
  
  return res.status(200).json({
    success: true,
    data: fotos
  });
}
