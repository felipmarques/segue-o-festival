const { Pool } = require("pg");
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

module.exports = async (req, res) => {
  const { method, query, body } = req;
  const url = req.url.split('?')[0]; // Remove query params da URL

  console.log(`[${new Date().toISOString()}] ${method} ${url}`);

  // Rota: Listar TODAS as fotos da galeria
  if (method === "GET" && url === "/api/galeriaEventos/todas") {
    try {
      console.log('Buscando TODAS as fotos da galeria');
      const resultado = await pool.query(
        `SELECT id_imagem, imagem, data_upload 
         FROM galeria_eventos 
         ORDER BY data_upload DESC`
      );

      // Converter o Buffer da imagem para base64
      const fotos = resultado.rows.map(row => ({
        id_imagem: row.id_imagem,
        imagem: row.imagem.toString('base64'),
        data_upload: row.data_upload
      }));

      console.log(`Encontradas ${fotos.length} fotos`);
      return res.status(200).json(fotos);
    } catch (error) {
      console.error("Erro ao buscar fotos:", error);
      return res.status(500).json({ error: "Erro interno ao buscar fotos" });
    }
  }

  // Rota: Listar fotos por CNPJ do promotor
  if (method === "GET" && url === "/api/galeriaEventos") {
    const { cnpj } = query;

    if (!cnpj) {
      console.log('Erro: CNPJ não fornecido');
      return res.status(400).json({ error: "CNPJ do promotor é obrigatório" });
    }

    try {
      console.log('Buscando fotos para o CNPJ:', cnpj);
      const resultado = await pool.query(
        `SELECT ge.id_imagem, ge.imagem, ge.data_upload
         FROM galeria_eventos ge
         JOIN eventos e ON ge.id_evento = e.id_evento
         WHERE e.cnpj_promotor = $1
         ORDER BY ge.data_upload DESC`,
        [cnpj]
      );

      // Converter o Buffer da imagem para base64
      const fotos = resultado.rows.map(row => ({
        id_imagem: row.id_imagem,
        imagem: row.imagem.toString('base64'),
        data_upload: row.data_upload
      }));

      console.log(`Encontradas ${fotos.length} fotos`);
      return res.status(200).json(fotos);
    } catch (error) {
      console.error("Erro ao buscar fotos:", error);
      return res.status(500).json({ error: "Erro interno ao buscar fotos" });
    }
  }

  // Rota: Adicionar nova foto
  if (method === "POST" && url === "/api/galeriaEventos") {
    const { id_evento, imagem } = body;

    if (!id_evento || !imagem) {
      console.log('Erro: Dados incompletos para adicionar foto');
      return res.status(400).json({ error: "ID do evento e imagem são obrigatórios" });
    }

    try {
      console.log('Adicionando nova foto para o evento:', id_evento);
      
      // Converter base64 para Buffer
      const imagemBuffer = Buffer.from(imagem, 'base64');
      
      const resultado = await pool.query(
        `INSERT INTO galeria_eventos (id_evento, imagem)
         VALUES ($1, $2)
         RETURNING id_imagem, data_upload`,
        [id_evento, imagemBuffer]
      );

      console.log('Foto adicionada com ID:', resultado.rows[0].id_imagem);
      return res.status(201).json({
        id_imagem: resultado.rows[0].id_imagem,
        data_upload: resultado.rows[0].data_upload
      });
    } catch (error) {
      console.error("Erro ao adicionar foto:", error);
      return res.status(500).json({ error: "Erro interno ao adicionar foto" });
    }
  }

  // Rota: Excluir foto
  if (method === "DELETE" && url === "/api/galeriaEventos") {
    const { id_imagem } = query;

    if (!id_imagem) {
      console.log('Erro: ID da imagem não fornecido');
      return res.status(400).json({ error: "ID da imagem é obrigatório" });
    }

    try {
      console.log('Excluindo foto com ID:', id_imagem);
      
      const resultado = await pool.query(
        "DELETE FROM galeria_eventos WHERE id_imagem = $1 RETURNING id_imagem",
        [id_imagem]
      );

      if (resultado.rows.length === 0) {
        console.log('Foto não encontrada para exclusão');
        return res.status(404).json({ error: "Foto não encontrada" });
      }

      console.log('Foto excluída com sucesso');
      return res.status(200).json({ id_imagem: resultado.rows[0].id_imagem });
    } catch (error) {
      console.error("Erro ao excluir foto:", error);
      return res.status(500).json({ error: "Erro interno ao excluir foto" });
    }
  }

  // Rota: Buscar foto específica por ID
  if (method === "GET" && url === "/api/galeriaEventos/unica") {
    const { id_imagem } = query;

    if (!id_imagem) {
      console.log('Erro: ID da imagem não fornecido');
      return res.status(400).json({ error: "ID da imagem é obrigatório" });
    }

    try {
      console.log('Buscando foto com ID:', id_imagem);
      
      const resultado = await pool.query(
        "SELECT imagem FROM galeria_eventos WHERE id_imagem = $1",
        [id_imagem]
      );

      if (resultado.rows.length === 0) {
        console.log('Foto não encontrada');
        return res.status(404).json({ error: "Foto não encontrada" });
      }

      const foto = {
        imagem: resultado.rows[0].imagem.toString('base64')
      };

      return res.status(200).json(foto);
    } catch (error) {
      console.error("Erro ao buscar foto:", error);
      return res.status(500).json({ error: "Erro interno ao buscar foto" });
    }
  }

  // Método não permitido
  console.log('Método não permitido:', method, 'para URL:', url);
  return res.status(405).json({ error: "Método não permitido" });
};
