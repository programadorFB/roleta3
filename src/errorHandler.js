/**
 * Sistema de Tratamento de Erros HTTP
 * Traduz códigos de erro técnicos para mensagens que o usuário entende
 * 🆕 NOVO: Logout automático em erros 401
 * 🆕 NOVO: Sistema de Logs e Rastreamento de Usuário
 */

// 🆕 Callback global para logout automático
let logoutCallback = null;

// 🆕 Variável para armazenar o usuário atual para logs
let currentUserInfo = { email: 'anônimo', id: null };

/**
 * Registra informações do usuário para os logs de erro
 * Chame isso logo após o login ou quando o usuário digitar o email
 * @param {Object|string} user - Objeto user ou string de email
 */
export function registerUserForLogs(user) {
  if (typeof user === 'string') {
    currentUserInfo = { ...currentUserInfo, email: user };
  } else {
    currentUserInfo = { ...currentUserInfo, ...user };
  }
  // console.log('👤 [errorHandler] Rastreamento de usuário atualizado:', currentUserInfo.email);
}

/**
 * Envia o erro para o backend ou serviço de monitoramento
 * @param {Object} errorPayload - O objeto de erro completo
 */
async function sendErrorLog(errorPayload) {
  const logData = {
    timestamp: new Date().toISOString(),
    user: currentUserInfo,
    error: errorPayload,
    url: window.location.href,
    userAgent: navigator.userAgent
  };

  // 1. Exibe no console do navegador (para debug local)
  console.groupCollapsed(`🚨 ERRO RASTREADO: ${errorPayload.title}`);
  console.log('Usuário:', currentUserInfo.email);
  console.log('Detalhes:', errorPayload);
  console.groupEnd();

  // 2. Tenta enviar para o seu backend (opcional - descomente se tiver endpoint de logs)
  /*
  try {
    fetch('https://api.appbackend.tech/logs', { // Use sua URL de API aqui
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(logData),
      keepalive: true // Garante o envio mesmo se a página fechar
    }).catch(() => {}); // Ignora falhas no envio do log para não gerar loop
  } catch (e) {
    // Falha silenciosa no logger
  }
  */
}

/**
 * Registra a função de logout a ser chamada em erros 401
 * @param {Function} callback - Função de logout do App
 */
export function registerLogoutCallback(callback) {
  if (typeof callback !== 'function') {
    console.warn('[errorHandler] registerLogoutCallback: callback deve ser uma função');
    return;
  }
  logoutCallback = callback;
  console.log('✅ [errorHandler] Callback de logout registrado');
}

export function clearLogoutCallback() {
  logoutCallback = null;
}

// Mapa de erros HTTP genéricos
const ERROR_MESSAGES = {
  // Erros 4xx - Cliente
  400: {
    title: 'Requisição Inválida',
    message: 'Os dados enviados estão incorretos. Verifique as informações e tente novamente.',
    icon: '⚠️'
  },
  401: {
    title: 'Sessão Expirada',
    message: 'Sua sessão expirou. Você será redirecionado para o login.',
    icon: '🔒'
  },
  403: {
    title: 'Acesso Negado',
    message: 'Você não tem permissão para acessar este recurso. Verifique sua assinatura.',
    icon: '🚫'
  },
  404: {
    title: 'Não Encontrado',
    message: 'O recurso solicitado não foi encontrado. Entre em contato com o suporte se o problema persistir.',
    icon: '🔍'
  },
  408: {
    title: 'Tempo Esgotado',
    message: 'A requisição demorou muito. Verifique sua conexão e tente novamente.',
    icon: '⏱️'
  },
  409: {
    title: 'Conflito',
    message: 'Já existe um registro com essas informações. Tente com dados diferentes.',
    icon: '⚡'
  },
  422: {
    title: 'Dados Inválidos',
    message: 'Os dados enviados não puderam ser processados. Verifique se todos os campos estão corretos.',
    icon: '📝'
  },
  429: {
    title: 'Muitas Tentativas',
    message: 'Você fez muitas requisições seguidas. Aguarde alguns segundos e tente novamente.',
    icon: '🌊'
  },

  // Erros 5xx - Servidor
  500: {
    title: 'Erro Interno do Servidor',
    message: 'Algo deu errado no servidor. Nossa equipe já foi notificada. Tente novamente em alguns minutos.',
    icon: '🔧'
  },
  502: {
    title: 'Gateway Indisponível',
    message: 'O servidor está temporariamente indisponível. Tente novamente em alguns instantes.',
    icon: '🌐'
  },
  503: {
    title: 'Serviço Indisponível',
    message: 'O sistema está em manutenção ou sobrecarregado. Tente novamente em alguns minutos.',
    icon: '🛠️'
  },
  504: {
    title: 'Timeout do Gateway',
    message: 'O servidor demorou demais para responder. Verifique sua conexão e tente novamente.',
    icon: '⏳'
  }
};

// Erros específicos de contexto
const CONTEXT_ERRORS = {
  // Login
  login: {
    'INVALID_CREDENTIALS': 'E-mail ou senha incorretos. Verifique suas credenciais e tente novamente.',
    'ACCOUNT_LOCKED': 'Sua conta foi temporariamente bloqueada por segurança. Entre em contato com o suporte.',
    'ACCOUNT_SUSPENDED': 'Sua conta está suspensa. Entre em contato com o suporte para mais informações.',
    'EMAIL_NOT_VERIFIED': 'Você precisa verificar seu e-mail antes de fazer login.',
    'FORBIDDEN_SUBSCRIPTION': 'Sua assinatura expirou ou está inativa. Renove para continuar usando o sistema.'
  },

  // Game Launch
  game: {
    'GAME_NOT_FOUND': 'Este jogo não está disponível no momento. Tente outro jogo.',
    'GAME_UNAVAILABLE': 'O jogo está temporariamente indisponível. Tente novamente em alguns minutos.',
    'INSUFFICIENT_BALANCE': 'Saldo insuficiente para iniciar o jogo.',
    'GAME_SESSION_ERROR': 'Erro ao criar a sessão do jogo. Tente novamente.',
    'INVALID_GAME_ID': 'ID do jogo inválido. Entre em contato com o suporte.'
  },

  // History
  history: {
    'NO_DATA_AVAILABLE': 'Não há dados de histórico disponíveis para esta roleta no momento.',
    'INVALID_SOURCE': 'Roleta não encontrada. Verifique sua seleção.',
    'SUBSCRIPTION_REQUIRED': 'Você precisa de uma assinatura ativa para acessar o histórico completo.'
  },

  // Network
  network: {
    'FETCH_FAILED': 'Não foi possível conectar ao servidor. Verifique sua internet e tente novamente.',
    'CORS_ERROR': 'Erro de segurança ao tentar acessar a API. Entre em contato com o suporte.',
    'TIMEOUT': 'A conexão demorou demais. Verifique sua internet e tente novamente.',
    'NETWORK_ERROR': 'Erro de rede. Verifique sua conexão com a internet.'
  }
};

function handleAutoLogout(statusCode) {
  if (statusCode === 401 && logoutCallback) {
    console.warn('🔒 [errorHandler] Erro 401 detectado - Executando logout automático');
    setTimeout(() => {
      logoutCallback();
    }, 1500); 
  }
}

/**
 * Traduz um erro HTTP em uma mensagem amigável e LOGA O ERRO
 */
export function translateError(statusCode, context = 'generic', errorData = {}) {
  handleAutoLogout(statusCode);

  let finalError = {
    title: `Erro ${statusCode}`,
    message: 'Ocorreu um erro inesperado.',
    icon: '❌',
    details: errorData.message || null,
    rawCode: statusCode,
    rawContext: context
  };

  // Tenta encontrar erro específico
  if (errorData.code && CONTEXT_ERRORS[context]?.[errorData.code]) {
    finalError = {
      ...finalError,
      title: ERROR_MESSAGES[statusCode]?.title || 'Erro',
      message: CONTEXT_ERRORS[context][errorData.code],
      icon: ERROR_MESSAGES[statusCode]?.icon || '❌',
    };
  } 
  // Usa genérico se não achou específico
  else if (ERROR_MESSAGES[statusCode]) {
    finalError = {
      ...finalError,
      ...ERROR_MESSAGES[statusCode],
      details: errorData.message || ERROR_MESSAGES[statusCode].message
    };
  }

  // 🆕 REGISTRA O LOG DO ERRO AQUI
  // Só logamos erros reais (400+), ignorando alguns 404 comuns se desejar
  if (statusCode >= 400) {
    sendErrorLog({
      type: 'HTTP_ERROR',
      statusCode,
      context,
      message: finalError.message,
      serverDetails: errorData // Detalhes técnicos vindos do servidor
    });
  }

  return finalError;
}

export function translateNetworkError(error) {
  let errorKey = 'NETWORK_ERROR';

  if (error.message.includes('Failed to fetch')) {
    errorKey = 'FETCH_FAILED';
  } else if (error.message.includes('CORS')) {
    errorKey = 'CORS_ERROR';
  } else if (error.message.includes('timeout') || error.message.includes('Timeout')) {
    errorKey = 'TIMEOUT';
  }

  const finalError = {
    title: 'Erro de Conexão',
    message: CONTEXT_ERRORS.network[errorKey],
    icon: '📡',
    details: error.message,
    rawCode: 0
  };

  // 🆕 REGISTRA O LOG DE REDE
  sendErrorLog({
    type: 'NETWORK_ERROR',
    errorCode: errorKey,
    details: error.message
  });

  return finalError;
}

export async function processErrorResponse(response, context = 'generic') {
  let errorData = {};
  
  try {
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      errorData = await response.json();
    } else {
      const text = await response.text();
      errorData = { message: text };
    }
  } catch (e) {
    console.warn('Não foi possível parsear erro da API:', e);
    errorData = { message: 'Erro desconhecido', raw: e.message };
  }

  const translatedError = translateError(response.status, context, errorData);

  return {
    ...translatedError,
    requiresPaywall: errorData.requiresSubscription || errorData.code === 'FORBIDDEN_SUBSCRIPTION',
    checkoutUrl: errorData.checkoutUrl || null,
    statusCode: response.status,
    originalError: errorData
  };
}

export function displayError(error, setErrorState, options = {}) {
  const { showIcon = true, timeout = null } = options;
  
  if (typeof setErrorState !== 'function') {
    console.error('[errorHandler] displayError: setErrorState deve ser uma função');
    return;
  }

  const errorMessage = showIcon 
    ? `${error.icon} ${error.message}` 
    : error.message;

  setErrorState(errorMessage);

  if (timeout) {
    setTimeout(() => setErrorState(''), timeout);
  }
}

export async function safeFetch(url, options = {}, context = 'generic') {
  try {
    const response = await fetch(url, options);

    if (!response.ok) {
      const error = await processErrorResponse(response, context);
      return { success: false, data: null, error };
    }

    let data;
    const contentType = response.headers.get('content-type');
    
    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      data = await response.text();
    }
    
    return { success: true, data, error: null };

  } catch (err) {
    const error = translateNetworkError(err);
    return { success: false, data: null, error };
  }
}

export default {
  registerLogoutCallback,
  clearLogoutCallback,
  registerUserForLogs, // 🆕 EXPORTADO
  translateError,
  translateNetworkError,
  processErrorResponse,
  displayError,
  safeFetch
};