// dbService.js
// Serviço para salvar e ler SINAIS do PostgreSQL

// ✅ CORREÇÃO 1: Importa as funções 'query' e 'transaction' do './db.js'
import { query, transaction } from '../../db.js'; 
import { SOURCES } from './constants.js';

/**
 * Substitui o loadAllExistingSignalIds.
 * Não é mais necessário carregar nada para a memória.
 */
export const loadAllExistingSignalIds = async () => {
    console.log('✅ [DB Service] Conectado ao Banco de Dados. Nenhum carregamento em memória é necessário.');
    return Promise.resolve();
};

/**
 * Salva novos sinais no banco de dados, ignorando duplicatas atomicamente.
 * Substitui 'appendToCsv'.
 *
 * @param {Array} dataArray - O array de dados da API.
 * @param {string} sourceName - O nome da fonte para salvar no DB.
 */
export const saveNewSignals = async (dataArray, sourceName) => {
    if (!SOURCES.includes(sourceName)) {
        console.error(`❌ Fonte desconhecida "${sourceName}". Não é possível salvar.`);
        return;
    }
    
    if (!dataArray || dataArray.length === 0) {
        // console.log(`[${sourceName}] ⏸ Nenhuma informação recebida da API para processar.`);
        return;
    }

    let newRecordsSaved = 0;

    try {
        // ✅ CORREÇÃO 2: Usa a função 'transaction' do db.js.
        // Ela cuida do BEGIN, COMMIT, ROLLBACK e client.release() automaticamente.
        await transaction(async (client) => {
            
            const insertQuery = `
                INSERT INTO signals (signalId, gameId, signal, source)
                VALUES ($1, $2, $3, $4)
                ON CONFLICT (signalId, source) DO NOTHING;
            `;

            for (const item of dataArray) {
                if (!item || !item.signalId) {
                    console.warn(`[${sourceName}] ⚠️ Registro inválido pulado:`, item);
                    continue;
                }
                
                const signalId = String(item.signalId).trim();
                const gameId = String(item.gameId || '').trim();
                const signal = String(item.signal || '').trim();

                // 'client' é o cliente da transação fornecido pela função 'transaction'
                const res = await client.query(insertQuery, [signalId, gameId, signal, sourceName]);
                
                if (res.rowCount > 0) {
                    newRecordsSaved++;
                }
            }
        }); // Fim da transação (COMMIT ou ROLLBACK automático aqui)

        if (newRecordsSaved > 0) {
            console.log(`\x1b[32m[${sourceName}] 💾 ${newRecordsSaved} novo(s) sinal(is) salvo(s) no DB com sucesso!\x1b[0m`);
        }

    } catch (err) {
         console.error(`❌ Erro ao escrever os novos dados no DB para ${sourceName}:`, err);
    }
};

/**
 * Lê todo o histórico de uma fonte específica do banco de dados.
 * Substitui 'getFullHistory' do CSV.
 *
 * @param {string} sourceName - O nome da fonte.
 */
export const getFullHistory = async (sourceName) => {
    if (!SOURCES.includes(sourceName)) {
        throw new Error(`Fonte "${sourceName}" não reconhecida.`);
    }

    const selectQuery = `
        SELECT timestamp, signalId, gameId, signal
        FROM signals
        WHERE source = $1
        ORDER BY timestamp DESC; 
    `;
    
    try {
        // ✅ CORREÇÃO 3: Usa a função 'query' do db.js
        const { rows } = await query(selectQuery, [sourceName]);
        return rows;
    } catch (err) {
        console.error(`❌ Erro ao ler o histórico do DB para ${sourceName}:`, err);
        throw err;
    }
};