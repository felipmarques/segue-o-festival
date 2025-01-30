import express from 'express';
import { Pool } from 'pg';
import multer from 'multer';
import fs from 'fs';
import eventosHandler from './api/eventos'; // Ajuste o caminho conforme necessário
import loginHandler from './api/login'; // Ajuste o caminho conforme necessário
import registerHandler from './api/register'; // Ajuste o caminho conforme necessário
import registerPromotorHandler from './api/registerPromotor'; // Ajuste o caminho conforme necessário

// Configuração do Neon (uso de variáveis de ambiente no Vercel)
const pool = new Pool({
  connectionString: process.env.DATABASE_URL, // No Vercel, a variável DATABASE_URL é configurada nas configurações do projeto
  ssl: {
    rejectUnauthorized: false,  // Certifique-se de que a conexão com SSL seja permitida no Neon
  },
});

// Função para converter arquivo em blob (para banners de eventos)
const convertToBlob = (filePath) => {
  return fs.readFileSync(filePath);
};

// Criação do app Express
const app = express();

// Middleware para parsing de JSON e formulários
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Configuração do multer para upload de arquivos
const upload = multer({ dest: 'uploads/' });

// Rota para registrar usuários
app.post('/api/register', registerHandler);

// Rota para registrar promotores
app.post('/api/register-promotor', registerPromotorHandler);

// Rota de login
app.post('/api/login', loginHandler);

// Rota para criar eventos (com upload de banners)
app.post('/api/eventos', upload.array('banners', 2), eventosHandler);

// Rota para listar eventos
app.get('/api/eventos', eventosHandler);

// Função para iniciar o servidor
const startServer = async () => {
  try {
    // Testando a conexão com o banco de dados
    await pool.connect();
    console.log('Conectado ao banco de dados com sucesso!');

    // Iniciando o servidor na porta 3000 ou a porta definida em ambiente
    app.listen(process.env.PORT || 3000, () => {
      console.log('Servidor rodando na porta 3000');
    });
  } catch (error) {
    console.error('Erro ao conectar ao banco de dados:', error);
  }
};

// Iniciando o servidor
startServer();


