const express = require('express');
const multer = require('multer');
const fs = require('fs');
const pool = require('./database');

const app = express();
const upload = multer({ dest: '/tmp/' }); // Diretório temporário para upload no ambiente Vercel

// Função para converter imagens para o formato BLOB
const convertToBlob = (filePath) => {
    return fs.readFileSync(filePath);
};

// Rota para o formulário de cadastro de evento
app.post('/api/cadastro-evento', upload.array('banners', 2), async (req, res) => {
    const { nome_evento, classificacao_indicativa, descricao, site_externo, data_inicio, data_fim } = req.body;
    const banner1 = req.files[0] ? convertToBlob(req.files[0].path) : null;
    const banner2 = req.files[1] ? convertToBlob(req.files[1].path) : null;

    const query = `
        INSERT INTO evento (nome_evento, classificacao_indicativa, descricao, site_externo, data_inicio, data_fim, banner1, banner2)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING id;
    `;
    const values = [nome_evento, classificacao_indicativa, descricao, site_externo, data_inicio, data_fim, banner1, banner2];

    pool.query(query, values)
        .then(result => res.send(`Evento cadastrado com sucesso. ID: ${result.rows[0].id}`))
        .catch(error => {
            console.error('Erro ao cadastrar o evento:', error);
            res.status(500).send('Erro ao cadastrar o evento');
        });
});

module.exports = app;
