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

// Rota de CADASTRO
// Obs: o app mobile chama "${API_URL}/register", por isso a rota é '/api/register'
// (antes estava '/api/auth/register', e por isso o app nunca conseguia cadastrar)
server.post('/api/register', async (req, res) => {
    // Obs: o app mobile envia o campo "userType" (e não "user_type")
    const { username, email, password, userType } = req.body;

    if (!username || !email || !password || !userType) {
        return res.status(400).json({ success: false, message: "Preencha todos os campos." });
    }

    try {
        await db.run(`
            INSERT INTO users (username, email, password, user_type)
            VALUES (?, ?, ?, ?)
        `, [username, email, password, userType]);

        res.status(201).json({ success: true, message: "Usuário registrado com sucesso!" });
    } catch (erro) {
        // Erro comum: e-mail duplicado (a coluna email é UNIQUE no banco)
        if (erro.message && erro.message.includes('UNIQUE')) {
            return res.status(400).json({ success: false, message: "Esse e-mail já está cadastrado." });
        }
        res.status(500).json({ success: false, message: "Erro ao registrar usuário." });
    }
});

// Rota de LOGIN (não existia antes — por isso o login nunca funcionava)
server.post('/api/login', async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ success: false, message: "Preencha e-mail e senha." });
    }

    try {
        const usuario = await db.get(
            "SELECT * FROM users WHERE email = ? AND password = ?",
            [email, password]
        );

        if (!usuario) {
            return res.status(401).json({ success: false, message: "E-mail ou senha incorretos." });
        }

        // Não devolvemos a senha para o app, só os dados necessários
        const { password: _senha, ...usuarioSemSenha } = usuario;

        res.json({ success: true, user: usuarioSemSenha });
    } catch (erro) {
        res.status(500).json({ success: false, message: "Erro ao tentar fazer login." });
    }
});