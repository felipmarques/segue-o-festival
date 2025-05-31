const { Pool } = require("pg");
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

module.exports = async (req, res) => {
  const { method, query, body } = req;
  const url = req.url.split('?')[0]; // Remove query params da URL

  console.log(`[${new Date().toISOString()}] ${method} ${url}`);

  // Rota: Listar fotos por CNPJ do promotor
  if (method === "GET" && url === "/api/galeriaEventos") {
    const { cnpj } = query;

    if (!cnpj) {
      console.log('Erro: CNPJ não fornecido');
      return res.status(400).json({ 
        success: false,
        error: "CNPJ do promotor é obrigatório" 
      });
    }

    try {
      console.log('Buscando fotos para o CNPJ:', cnpj);
      const resultado = await pool.query(
        `SELECT ge.id_imagem, ge.id_evento, ge.titulo, ge.descricao, ge.data_upload, 
                e.nome as nome_evento
         FROM galeria_eventos ge
         JOIN eventos e ON ge.id_evento = e.id_evento
         WHERE e.cnpj_promotor = $1
         ORDER BY ge.data_upload DESC`,
        [cnpj]
      );

      console.log(`Encontradas ${resultado.rows.length} fotos`);
      
      return res.status(200).json({
        success: true,
        data: resultado.rows
      });
    } catch (error) {
      console.error("Erro ao buscar fotos:", error);
      return res.status(500).json({ 
        success: false,
        error: "Erro interno ao buscar fotos" 
      });
    }
  }

  // Rota: Adicionar nova foto
  if (method === "POST" && url === "/api/galeriaEventos") {
    const { id_evento, titulo, descricao, imagem } = body;

    if (!id_evento || !imagem) {
      console.log('Erro: Dados incompletos para adicionar foto');
      return res.status(400).json({ 
        success: false,
        error: "ID do evento e imagem são obrigatórios" 
      });
    }

    try {
      console.log('Adicionando nova foto para o evento:', id_evento);
      
      // Converter array de bytes para Buffer
      const imagemBuffer = Buffer.from(imagem);
      
      const resultado = await pool.query(
        `INSERT INTO galeria_eventos (id_evento, titulo, descricao, imagem)
         VALUES ($1, $2, $3, $4)
         RETURNING id_imagem, id_evento, titulo, data_upload`,
        [id_evento, titulo || null, descricao || null, imagemBuffer]
      );

      console.log('Foto adicionada com ID:', resultado.rows[0].id_imagem);
      
      return res.status(201).json({
        success: true,
        data: resultado.rows[0]
      });
    } catch (error) {
      console.error("Erro ao adicionar foto:", error);
      return res.status(500).json({ 
        success: false,
        error: "Erro interno ao adicionar foto" 
      });
    }
  }

  // Rota: Excluir foto
  if (method === "DELETE" && url === "/api/galeriaEventos") {
    const { id_imagem } = query;

    if (!id_imagem) {
      console.log('Erro: ID da imagem não fornecido');
      return res.status(400).json({ 
        success: false,
        error: "ID da imagem é obrigatório" 
      });
    }

    try {
      console.log('Excluindo foto com ID:', id_imagem);
      
      const resultado = await pool.query(
        "DELETE FROM galeria_eventos WHERE id_imagem = $1 RETURNING id_imagem",
        [id_imagem]
      );

      if (resultado.rows.length === 0) {
        console.log('Foto não encontrada para exclusão');
        return res.status(404).json({ 
          success: false,
          error: "Foto não encontrada" 
        });
      }

      console.log('Foto excluída com sucesso');
      
      return res.status(200).json({
        success: true,
        data: { id_imagem: resultado.rows[0].id_imagem }
      });
    } catch (error) {
      console.error("Erro ao excluir foto:", error);
      return res.status(500).json({ 
        success: false,
        error: "Erro interno ao excluir foto" 
      });
    }
  }

  // Método não permitido
  console.log('Método não permitido:', method, 'para URL:', url);
  return res.status(405).json({
    success: false,
    error: "Método não permitido"
  });
};
