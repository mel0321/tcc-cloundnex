const express = require('express');
const sqlite3 = require('sqlite3');
const { open } = require('sqlite');
const path = require('path');
const fs = require('fs');

const server = express();
server.use(express.json());

// Permite conexões externas (como o aplicativo mobile)
server.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE");
    next();
});

const PORT = 3000;
let db;

// Conexão com o Banco e Execução Automática do seu schema.sql
(async () => {
    try {
        // Corrigido: Usando '..' para subir um nível até a pasta backend e acessar 'database/schema.db'
        db = await open({
            filename: path.join(__dirname, '..', 'database', 'schema.db'),
            driver: sqlite3.Database
        });
        
        // Corrigido: Caminho do schema.sql subindo um nível também
        const schemaPath = path.join(__dirname, '..', 'database', 'schema.sql');
        const schemaSql = fs.readFileSync(schemaPath, 'utf8');
        
        // Executa as tabelas do seu schema
        await db.exec(schemaSql);
        
        console.log('Banco de dados inicializado com o seu schema.sql com sucesso!');

        // Inicia o servidor HTTP após a conexão bem-sucedida do banco
        server.listen(PORT, () => {
            console.log(`===============================================`);
            console.log(`🚀 SERVIDOR BACK-END RODANDO NA PORTA ${PORT}`);
            console.log(`===============================================`);
        });
        
    } catch (error) {
        console.error('Erro ao carregar o banco de dados ou o schema.sql:', error);
    }
})();

// --- ROTAS DO SISTEMA ---

// Rota padrão para teste no navegador
server.get('/', (req, res) => {
    res.send('Backend do TCC CloudNex rodando com sucesso!');
});

// Rota para buscar os locais cadastrados no banco
server.get('/api/places', async (req, res) => {
    try {
        const locais = await db.all("SELECT * FROM places");
        res.json(locais);
    } catch (erro) {
        res.status(500).json({ erro: "Erro ao buscar locais no banco de dados" });
    }
});

// Exemplo de estrutura básica para rotas de autenticação futuramente
server.post('/api/auth/register', async (req, res) => {
    const { username, email, password, user_type } = req.body;
    try {
        await db.run(`
            INSERT INTO users (username, email, password, user_type)
            VALUES (?, ?, ?, ?)
        `, [username, email, password, user_type]);
        res.status(201).json({ mensagem: "Usuário registrado com sucesso!" });
    } catch (erro) {
        res.status(500).json({ erro: "Erro ao registrar usuário" });
    }
});