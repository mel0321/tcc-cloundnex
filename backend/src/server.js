const express = require('express');
const sqlite3 = require('sqlite3');
const { open } = require('sqlite');
const path = require('path');
const fs = require('fs'); // Importamos o módulo de arquivos do Node

const server = express();
server.use(express.json());

const PORT = 3000;
let db;

// Conexão com o Banco e Execução Automática do seu schema.sql
(async () => {
    try {
        // 1. Abre ou cria o arquivo físico do banco de dados
        db = await open({
            filename: path.join(__dirname, 'database', 'database.sqlite'),
            driver: sqlite3.Database
        });
        
        // 2. Lê o arquivo schema.sql que você já criou
        const schemaPath = path.join(__dirname, 'database', 'schema.sql');
        const schemaSql = fs.readFileSync(schemaPath, 'utf8');
        
        // 3. Executa os comandos do seu schema dentro do banco
        await db.exec(schemaSql);
        
        console.log('Banco de dados inicializado com o seu schema.sql com sucesso!');
    } catch (error) {
        console.error('Erro ao carregar o banco de dados ou o schema.sql:', error);
    }
})();

// ... restante das rotas (POST /api/auth/register, etc.) seguem iguais