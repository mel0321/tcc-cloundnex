// 1. Importamos o Express
const express = require('express');

// 2. Criamos a instância do servidor (a variável recomendada!)
const server = express();

// 3. Permitimos que o servidor leia JSON nas requisições
server.use(express.json());

// 4. Definimos a porta onde o servidor vai funcionar
const PORT = 3000;

// 5. Criamos a primeira rota (responde a GET em '/')
server.get('/', (req, res) => {
    res.send('Servidor funcionando dentro da pasta src!');
});

// 6. Ligamos o servidor na porta definida
server.listen(PORT, () => {
    console.log(`Servidor rodando em http://localhost:${PORT}`);
});