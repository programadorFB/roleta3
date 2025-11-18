// / [MONITORAMENTO - SENTRY] 1. NO TOPO DE TUDO
import * as Sentry from "@sentry/node"; 
// Correção: Importa os handlers e integrações corretos da v8
import { 
  httpIntegration, 
  expressIntegration, 
} from "@sentry/node";
// server.js - 🚀 MIGRADO PARA POSTGRESQL 🚀
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import fetch from 'node-fetch';
import cors from 'cors';
import dotenv from 'dotenv';
import { createProxyMiddleware } from 'http-proxy-middleware';

// [CAMINHO CORRIGIDO] Caminhos de importação na raiz
import { loadAllExistingSignalIds, saveNewSignals, getFullHistory } from './src/utils/dbService.js';
import { SOURCES } from './src/utils/constants.js'; 

// Importa serviços
import { testConnection } from './db.js';
import {
    hasActiveAccess,
    processHublaWebhook,
    verifyHublaWebhook,
    getSubscriptionStats,
    getActiveSubscriptions,
    getWebhookLogs,
    getSubscriptionByEmail
} from './subscriptionService.js';

dotenv.config();

console.log(`\n\n--- SERVIDOR INICIADO --- ${new Date().toLocaleTimeString()}`);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();

// [MONITORAMENTO - SENTRY] 2. INICIALIZAÇÃO
// (Logo após a definição do 'app')
Sentry.init({
    dsn: process.env.SENTRY_DSN, // Puxa do .env
    integrations: [
            // Correção: Usa os nomes importados como funções
            httpIntegration(),
            expressIntegration({ app }), // Passa o 'app'
        ],
    tracesSampleRate: 1.0, // Amostragem de performance (100%)
});

// --- CONSTANTES ---
const API_URLS = {
    // --- Lista Filtrada ---
    immersive: 'https://apptemporario-production.up.railway.app/api/0194b479-654d-70bd-ac50-9c5a9b4d14c5', // Immersive Roulette
    brasileira: 'https://apptemporario-production.up.railway.app/api/0194b473-2ab3-778f-89ee-236e803f3c8e', // Roleta Brasileira
    speed: 'https://apptemporario-production.up.railway.app/api/0194b473-c347-752f-9eaf-783721339479', // Speed Roulette
    xxxtreme: 'https://apptemporario-production.up.railway.app/api/0194b478-5ba0-7110-8179-d287b2301e2e', // XXXtreme Lightning Roulette
    vipauto: 'https://apptemporario-production.up.railway.app/api/0194b473-9044-772b-a6fc-38236eb08b42', // Auto Roulette Vip
    auto: 'https://apptemporario-production.up.railway.app/api/0194b471-1645-749e-9214-be0342035f6f', // Auto Roulette
    
    vip: 'https://apptemporario-production.up.railway.app/api/0194b472-6b93-74be-9260-7e407f5f1103', // Roleta Vip
    lightning: 'https://apptemporario-production.up.railway.app/api/0194b472-7d68-75ea-b249-1422258f4d4c', // Lightning Roulette
    aovivo: 'https://apptemporario-production.up.railway.app/api/0194b473-1738-70dd-84a9-f1ddd4f00678', // Roleta ao Vivo
    speedauto: 'https://apptemporario-production.up.railway.app/api/0194b473-3139-770c-841f-d026ce7ed01f', // Speed Auto Roulette
    viproulette: 'https://apptemporario-production.up.railway.app/api/0194b474-bb9a-7451-b430-c451b14de1de', // Vip Roulette
    relampago: 'https://apptemporario-production.up.railway.app/api/0194b474-d82f-76e0-9242-70f601984069', // Roleta Relâmpago
    malta: 'https://apptemporario-production.up.railway.app/api/0194b476-6091-730c-b971-7e66d9d8c44a' // Casino Malta Roulette
};
const FETCH_INTERVAL_MS = 5000;
const DEFAULT_AUTH_PROXY_TARGET = process.env.AUTH_PROXY_TARGET || 'https://api.appbackend.tech';
const HUBLA_WEBHOOK_TOKEN = process.env.HUBLA_WEBHOOK_TOKEN;
const HUBLA_CHECKOUT_URL = process.env.HUBLA_CHECKOUT_URL;

// --- MIDDLEWARE (ORDEM CRÍTICA) ---
// 1. Log geral
app.use((req, res, next) => {
    req._startTime = Date.now();
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] 📥 ${req.method} ${req.url} - IP: ${req.ip}`);
    
    res.on('finish', () => {
        const duration = Date.now() - req._startTime;
        const emoji = res.statusCode >= 500 ? '❌' : res.statusCode >= 400 ? '⚠️' : '✅';
        console.log(`${emoji} [${timestamp}] ${req.method} ${req.url} - ${res.statusCode} - ${duration}ms`);
    });

    next();
});

// 2. CORS
const allowedOrigins = [
  'https://fuza.onrender.com',
  'https://roleta3-1.onrender.com',
  'http://localhost:5173', // se estiver testando localmente
  'http://localhost:3000',
  'https://ferramenta.smartanalise.com.br',
  'https://ferramenta1.smartanalise.com.br',
  'https://free.smartanalise.com.br',
  'https://sortenabet.smartanalise.com.br'
];

app.use(cors({
  origin: (origin, callback) => {
    // Permitir sem header Origin (ex: requisições do backend interno)
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.warn(`🚫 CORS bloqueado para origem: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-hubla-token']
}));


// 4. PROXY DE LOGIN
app.use('/login', createProxyMiddleware({
    target: DEFAULT_AUTH_PROXY_TARGET,
    changeOrigin: true,
    timeout: 60000,
    followRedirects: true,
    
    pathRewrite: {
        '^/': '/login' 
    },

    onProxyReq: (proxyReq, req, res) => {
        const timestamp = new Date().toISOString();
        console.log(`\n${'='.repeat(80)}`);
        console.log(`[${timestamp}] 🔐 PROXY LOGIN ATIVADO`);
        console.log(`[${timestamp}] 📤 Método: ${req.method} | URL: ${req.url}`);
        console.log(`[${timestamp}] 🎯 Destino: ${DEFAULT_AUTH_PROXY_TARGET}${proxyReq.path}`);
        console.log(`${'='.repeat(80)}\n`);
        
        proxyReq.setHeader('User-Agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');
        proxyReq.setHeader('Accept', 'application/json');
    },

    onProxyRes: (proxyRes, req, res) => {
        const timestamp = new Date().toISOString();
        let body = [];
        
        proxyRes.on('data', chunk => body.push(chunk));
        
        proxyRes.on('end', async () => { 
            const responseBody = Buffer.concat(body).toString('utf8');
            const backendStatusCode = proxyRes.statusCode;
            
            console.log(`\n${'='.repeat(80)}`);
            console.log(`[${timestamp}] 📥 RESPOSTA DO BACKEND DE LOGIN`);
            console.log(`[${timestamp}] Status: ${backendStatusCode}`);
            
            if (backendStatusCode < 200 || backendStatusCode >= 300) {
                console.warn(`[${timestamp}] ⚠️ Login falhou no backend. Repassando erro.`);
                console.log(`${'='.repeat(80)}\n`);
                
                Object.keys(proxyRes.headers).forEach((key) => {
                    res.setHeader(key, proxyRes.headers[key]);
                });
                res.status(backendStatusCode).send(responseBody);
                return;
            }

            try {
                let email = null;
                
                if (req.headers.authorization?.startsWith('Basic ')) {
                    const base64 = req.headers.authorization.split(' ')[1];
                    const decoded = Buffer.from(base64, 'base64').toString('utf-8');
                    email = decoded.split(':')[0];
                }
                
                if (!email && req.headers['content-type']?.includes('application/json')) {
                    try {
                        const responseData = JSON.parse(responseBody);
                        email = responseData.user?.email || responseData.email;
                    } catch (e) {
                        console.warn(`[${timestamp}] ⚠️ Não foi possível parsear resposta do backend`);
                    }
                }

                if (!email) {
                    console.error(`[${timestamp}] ❌ Email não encontrado na requisição`);
                    res.status(500).json({
                        error: true,
                        message: "Erro interno: Email não identificado"
                    });
                    return;
                }

                // --- CORREÇÃO: Normaliza o email vindo do backend antes de checar no banco ---
                const cleanEmail = email.trim().toLowerCase();

                console.log(`[${timestamp}] 🔍 Verificando assinatura Hubla para: ${cleanEmail} (Original: ${email})`);
                
                const subscription = await getSubscriptionByEmail(cleanEmail);
                let canLogin = false;
                let subMessage = 'Assinatura não encontrada.';

                if (subscription) {
                    const activeStatuses = ['active', 'trialing', 'paid'];
                    
                    if (!activeStatuses.includes(subscription.status)) {
                        subMessage = `Assinatura inativa (Status: ${subscription.status})`;
                        console.warn(`⚠️ [DEBUG LOGIN] Email: ${cleanEmail} | Status DB: ${subscription.status} | Esperado: ${activeStatuses.join(',')}`);
                    } else if (subscription.expires_at && new Date(subscription.expires_at) < new Date()) {
                        subMessage = 'Assinatura expirada.';
                        console.warn(`⚠️ [DEBUG LOGIN] Email: ${cleanEmail} | Expirou: ${subscription.expires_at}`);
                    } else {
                        canLogin = true;
                    }
                } else {
                    console.warn(`⚠️ [DEBUG LOGIN] Email não encontrado no DB: '${cleanEmail}'`);
                }

                if (canLogin) {
                    console.log(`[${timestamp}] ✅ Assinatura ATIVA! Permitindo login.`);
                    console.log(`${'='.repeat(80)}\n`);
                    
                    Object.keys(proxyRes.headers).forEach((key) => {
                        res.setHeader(key, proxyRes.headers[key]);
                    });
                    res.status(backendStatusCode).send(responseBody);
                    
                } else {
                    console.warn(`[${timestamp}] 🚫 ACESSO NEGADO: ${subMessage}`);
                    console.log(`${'='.repeat(80)}\n`);
                    
                    res.status(403).json({
                        error: true,
                        message: subMessage,
                        code: 'FORBIDDEN_SUBSCRIPTION',
                        checkoutUrl: HUBLA_CHECKOUT_URL
                    });
                }
                
            } catch (dbError) {
                console.error(`[${timestamp}] ❌ Erro ao verificar assinatura:`, dbError);
                Sentry.captureException(dbError); // Captura erro de DB
                res.status(500).json({
                    error: true,
                    message: "Erro ao verificar assinatura",
                    details: dbError.message
                });
            }
        });
    },

    onError: (err, req, res) => {
        const timestamp = new Date().toISOString();
        console.error(`\n${'='.repeat(80)}`);
        console.error(`[${timestamp}] ❌ ERRO NO PROXY DE LOGIN`);
        console.error(`[${timestamp}] Código: ${err.code}`);
        console.error(`[${timestamp}] Mensagem: ${err.message}`);
        console.error(`${'='.repeat(80)}\n`);
        
        Sentry.captureException(err); // Captura erro de proxy
        
        if (!res.headersSent) {
            res.status(500).json({
                error: true,
                message: 'Erro no proxy de login',
                code: err.code
            });
        }
    },
    
    logLevel: 'warn'
}));

// 5. PROXY DE START-GAME
app.use('/start-game', createProxyMiddleware({
    target: DEFAULT_AUTH_PROXY_TARGET,
    changeOrigin: true,
    timeout: 60000,
    
    pathRewrite: (path) => `/start-game${path}`,

    onProxyReq: (proxyReq, req) => {
        const timestamp = new Date().toISOString();
        console.log(`[${timestamp}] 🚀 PROXY GAME: ${req.method} ${DEFAULT_AUTH_PROXY_TARGET}/start-game${req.url}`);
        
        if (req.headers.authorization) {
            proxyReq.setHeader('Authorization', req.headers.authorization);
        }
        proxyReq.setHeader('User-Agent', 'Mozilla/5.0');
    },

    onProxyRes: (proxyRes, req, res) => {
        let body = [];
        proxyRes.on('data', chunk => body.push(chunk));
        proxyRes.on('end', () => {
            const responseBody = Buffer.concat(body).toString('utf8');
            
            Object.keys(proxyRes.headers).forEach(key => {
                res.setHeader(key, proxyRes.headers[key]);
            });
            
            res.status(proxyRes.statusCode).end(responseBody);
        });
    },

    logLevel: 'warn',

    onError: (err, req, res) => {
        console.error(`[${new Date().toISOString()}] ❌ ERRO NO PROXY DE GAME:`, err.message);
        Sentry.captureException(err); // Captura erro de proxy
        if (!res.headersSent) {
            res.status(500).json({ error: true, message: 'Erro no proxy de game', code: err.code });
        }
    }
}));

// 6. Servir arquivos estáticos
app.use(express.static(path.join(__dirname, 'dist')));

// --- ROTAS DA API (COM express.json() LOCALIZADO) ---

// Webhook Hubla (precisa de JSON parser)
app.post('/api/webhooks/hubla', express.json(), async (req, res) => {
    const timestamp = new Date().toISOString();
    console.log(`\n${'='.repeat(80)}`);
    console.log(`[${timestamp}] 📢 WEBHOOK HUBLA RECEBIDO`);
    console.log(`${'='.repeat(80)}`);
    
    try {
        const hublaToken = req.headers['x-hubla-token'];
        
        if (!verifyHublaWebhook(hublaToken, HUBLA_WEBHOOK_TOKEN)) {
            console.error(`[${timestamp}] ❌ Token inválido`);
            return res.status(401).json({ error: 'Token inválido' });
        }
        
        const result = await processHublaWebhook(req.body.type, req.body);
        
        console.log(`[${timestamp}] ✅ Webhook processado`);
        console.log(`${'='.repeat(80)}\n`);
        
        res.status(200).json({ success: true, result });
        
    } catch (error) {
        console.error(`[${timestamp}] ❌ Erro:`, error);
        Sentry.captureException(error); // Captura erro de webhook
        res.status(500).json({ error: error.message });
    }
});

// Middleware de proteção (para APIs de dados)
const requireActiveSubscription = async (req, res, next) => {
    try {
        const userEmail = req.query.userEmail;
        
        if (!userEmail) {
            return res.status(401).json({
                error: 'userEmail obrigatório',
                requiresSubscription: true
            });
        }
        
        // --- CORREÇÃO: Normaliza o email vindo da query ---
        const cleanEmail = userEmail.trim().toLowerCase();
        
        const subscription = await getSubscriptionByEmail(cleanEmail);
        
        if (!subscription) {
            return res.status(403).json({
                error: 'Assinatura não encontrada',
                requiresSubscription: true,
                checkoutUrl: HUBLA_CHECKOUT_URL
            });
        }

        const activeStatuses = ['active', 'trialing', 'paid'];
        if (!activeStatuses.includes(subscription.status)) {
            return res.status(403).json({
                error: `Assinatura inativa (${subscription.status})`,
                requiresSubscription: true,
                checkoutUrl: HUBLA_CHECKOUT_URL
            });
        }
        
        if (subscription.expires_at && new Date(subscription.expires_at) < new Date()) {
            return res.status(403).json({
                error: 'Assinatura expirada',
                requiresSubscription: true,
                checkoutUrl: HUBLA_CHECKOUT_URL
            });
        }
        
        req.subscription = subscription;
        next();
    } catch (error) {
        console.error('❌ [AUTH] Erro:', error);
        Sentry.captureException(error); // Captura erro de autenticação
        res.status(500).json({ error: 'Erro ao verificar assinatura' });
    }
};

// Status da assinatura
app.get('/api/subscription/status', async (req, res) => {
    try {
        const userEmail = req.query.userEmail;
        
        if (!userEmail) {
            return res.status(400).json({ error: 'userEmail obrigatório' });
        }
        
        // --- CORREÇÃO: Normaliza aqui também ---
        const cleanEmail = userEmail.trim().toLowerCase();
        
        const subscription = await getSubscriptionByEmail(cleanEmail);
        
        if (!subscription) {
            return res.json({
                hasAccess: false,
                subscription: null,
                checkoutUrl: HUBLA_CHECKOUT_URL
            });
        }

        const activeStatuses = ['active', 'trialing', 'paid'];
        let hasAccess = false;
        
        if (activeStatuses.includes(subscription.status)) {
            if (!subscription.expires_at || new Date(subscription.expires_at) >= new Date()) {
                hasAccess = true;
            }
        }
        
        res.json({
            hasAccess,
            subscription,
            checkoutUrl: HUBLA_CHECKOUT_URL
        });
    } catch (error) {
        console.error('❌ Erro ao verificar status:', error);
        Sentry.captureException(error); // Captura erro
        res.status(500).json({ error: 'Erro ao verificar status' });
    }
});

// Admin routes
app.get('/api/admin/subscriptions/stats', async (req, res) => {
    try {
        const stats = await getSubscriptionStats();
        res.json(stats);
    } catch (error) {
        Sentry.captureException(error); // Captura erro
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/admin/subscriptions/active', async (req, res) => {
    try {
        const subscriptions = await getActiveSubscriptions();
        res.json(subscriptions);
    } catch (error) {
        Sentry.captureException(error); // Captura erro
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/admin/webhooks/logs', async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 100;
        const logs = await getWebhookLogs(limit);
        res.json(logs);
    } catch (error) {
        Sentry.captureException(error); // Captura erro
        res.status(500).json({ error: error.message });
    }
});

// --- SCRAPER (MIGRADO PARA DB) ---
const normalizeData = (data) => {
    if (Array.isArray(data)) return data;
    if (data?.games) return data.games;
    if (data?.signalId) return [data];
    return [];
};

async function fetchAndSaveFromSource(url, sourceName) {
    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`Status: ${response.status}`);
        
        const data = await response.json();
        const normalizedData = normalizeData(data);
        
        if (normalizedData.length > 0) {
            await saveNewSignals(normalizedData, sourceName);
        }
    } catch (err) {
        console.error(`❌ [FETCH - ${sourceName}]:`, err.message);
        Sentry.captureException(err, { tags: { source: sourceName } }); // Captura erro de fetch
    }
}

async function fetchAllData() {
    const sourcesToFetch = Object.keys(API_URLS);
    const fetchPromises = sourcesToFetch.map(sourceName => {
        const url = API_URLS[sourceName];
        return fetchAndSaveFromSource(url, sourceName);
    });

    try {
        await Promise.all(fetchPromises);
    } catch (error) {
        console.error("❌ Erro durante o fetchAllData:", error);
        Sentry.captureException(error); // Captura erro
    }
}

// Scraper endpoints (protegidos)
app.get('/api/fetch/all', requireActiveSubscription, async (req, res) => {
    try {
        await fetchAllData();
        res.json({ status: 'ok' });
    } catch (err) {
        Sentry.captureException(err); // Captura erro
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/fetch/:source', requireActiveSubscription, async (req, res) => {
    const url = API_URLS[req.params.source];
    
    if (!url) {
        return res.status(400).json({ error: 'Fonte inválida' });
    }
    
    try {
        await fetchAndSaveFromSource(url, req.params.source);
        res.json({ status: 'ok' });
    } catch (err) {
        Sentry.captureException(err); // Captura erro
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/full-history', requireActiveSubscription, async (req, res) => {
    try {
        const sourceName = req.query.source;

        if (!sourceName || !SOURCES.includes(sourceName)) {
            return res.status(400).json({ 
                error: `source obrigatório. Valores: [${SOURCES.join(', ')}]` 
            });
        }
        
        const history = await getFullHistory(sourceName);
        res.json(history);
    } catch (error) {
        Sentry.captureException(error); // Captura erro
        res.status(500).json({ error: error.message });
    }
});

// [MONITORAMENTO - HEALTH] Rota /health aprimorada
app.get('/health', async (req, res) => {
    try {
        await testConnection(); // Testa o DB
        res.json({ 
            status: 'OK',
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
            hubla: HUBLA_WEBHOOK_TOKEN ? '✅' : '⚠️',
            database: '✅'
        });
    } catch (dbError) {
        console.error('❌ HEALTH CHECK FALHOU (DB):', dbError.message);
        res.status(503).json({ // 503 Service Unavailable
            status: 'ERROR',
            message: 'Serviço indisponível (Banco de Dados inacessível)',
            database: '❌'
        });
    }
});


// [MONITORAMENTO - SENTRY] Endpoints de Teste
app.get('/api/test-sentry', (req, res) => {
    console.log('🧪 Testando captura de erro no Sentry...');
    try {
        throw new Error('🧪 Teste de erro do Sentry - Tudo funcionando!');
    } catch (error) {
        Sentry.captureException(error);
        res.json({ 
            success: true, 
            message: 'Erro de teste enviado ao Sentry! Verifique o dashboard.',
            sentryConfigured: !!process.env.SENTRY_DSN
        });
    }
});

app.get('/api/test-sentry-crash', (req, res, next) => {
    console.log('💥 Testando crash não tratado...');
    // Este erro será capturado pelo setupExpressErrorHandler
    throw new Error('💥 Teste de crash não tratado - Sentry deve capturar!');
});
// Fallback SPA
app.get(/.*/, (req, res) => {
    if (req.url.startsWith('/api/')) {
        return res.status(404).json({ error: 'Endpoint não encontrado' });
    }
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

// [MONITORAMENTO - SENTRY] 4. Error Handler (deve ser após todas as rotas)
Sentry.setupExpressErrorHandler(app);

// --- INICIALIZAÇÃO ---
const startServer = async () => {
    const PORT = process.env.PORT || 3000;
    
    try {
        console.log('🔍 Testando PostgreSQL...');
        await testConnection();
        
        await loadAllExistingSignalIds();
        
        app.listen(PORT, '0.0.0.0', () => {
            console.log(`\n${'='.repeat(80)}`);
            console.log(`🚀 SERVIDOR RODANDO - PORTA ${PORT}`);
            console.log(`${'='.repeat(80)}`);
            console.log(`🔐 Login: /login → ${DEFAULT_AUTH_PROXY_TARGET}/login (+ Hubla)`);
            console.log(`🎮 Game: /start-game/* → ${DEFAULT_AUTH_PROXY_TARGET}/start-game/*`);
            console.log(`📢 Webhook: /api/webhooks/hubla`);
            console.log(`📊 API Scraper: /api/* (protegida)`);
            console.log(`💳 Hubla: ${HUBLA_WEBHOOK_TOKEN ? '✅ Configurado' : '⚠️ Não configurado'}`);
            // Log de status do Sentry
            console.log(`📦 Sentry: ${process.env.SENTRY_DSN ? '✅ Configurado' : '⚠️ Não configurado'}`);
            console.log(`${'='.repeat(80)}\n`);
            
            fetchAllData();
            setInterval(fetchAllData, FETCH_INTERVAL_MS);
        });
    } catch (err) {
        console.error("❌ ERRO CRÍTICO:", err);
        // [MONITORAMENTO - SENTRY] Captura o erro de inicialização
        await Sentry.captureException(err);
        await Sentry.close(2000); // Espera o Sentry enviar
        process.exit(1);
    }
};

startServer();

// [MONITORAMENTO - SENTRY] 5. Captura de erros não tratados
process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  Sentry.captureException(reason);
});

process.on('uncaughtException', (err) => {
  console.error('❌ Uncaught Exception:', err);
  Sentry.captureException(err);
  Sentry.close(2000).then(() => {
    process.exit(1); // Encerra após enviar o erro
  });
});