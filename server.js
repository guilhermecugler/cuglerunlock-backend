const express = require('express');
const cors = require('cors');
const toolsRoutes = require('./routes/tools');
require('dotenv').config();

const app = express();

// Middlewares
app.use(express.json());
app.use(cors());

// Rotas
app.use('/api/auth', require('./routes/auth'));
app.use('/api/tools', toolsRoutes); // Adiciona a rota de ferramentas

// Inicializar servidor
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));
