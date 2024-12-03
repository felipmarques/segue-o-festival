const express = require('express');
const multer = require('multer');
const fs = require('fs');
const pool = require('./database');
const app = express();

const upload = multer({ dest: '/tmp/' });
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Função para converter imagens para o formato BLOB
const convertToBlob = (filePath) => {
    return fs.readFileSync(filePath);
};

// Rota para o formulário de cadastro de evento
app.post('/api/cadastro-evento', upload.array('banners', 2), async (req, res) => {
    try {
        const { nome_evento, classificacao_indicativa, descricao, site_externo, data_inicio, data_fim } = req.body;
        const banner1 = req.files[0] ? convertToBlob(req.files[0].path) : null;
        const banner2 = req.files[1] ? convertToBlob(req.files[1].path) : null;

        const query = `
            INSERT INTO evento (nome_evento, classificacao_indicativa, descricao, site_externo, data_inicio, data_fim, banner1, banner2)
            VALUES ($1,[_{{{CITATION{{{_1{](https://github.com/ricardo-cas/pandas/tree/eefd8f3ed9250c15e029b7ae59a24ef9f7ffc4ab/GUIA_MARKDOWN.MD)[_{{{CITATION{{{_2{](https://github.com/ErenildesXimenes/ProjetoProf.Gleison/tree/fb3e7fe2f4ca23b6bef547efa15a018ceb782759/adm%2Fsign_movie.php)
