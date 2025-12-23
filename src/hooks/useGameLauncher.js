// hooks/useGameLauncher.js

import { useState, useCallback, useEffect } from 'react';
import { API_URL, ROULETTE_GAME_IDS } from '../constants/roulette';
import { processErrorResponse, translateNetworkError, displayError } from '../errorHandler';

export const useGameLauncher = ({ 
  selectedRoulette, 
  jwtToken, 
  isAuthenticated 
}) => {
  const [isLaunching, setIsLaunching] = useState(false);
  const [launchError, setLaunchError] = useState('');
  const [gameUrl, setGameUrl] = useState('');
  const [iframeError, setIframeError] = useState(false);

  // Launch game handler
  const handleLaunchGame = useCallback(async () => {
    setIsLaunching(true);
    setLaunchError('');
    
    const gameId = ROULETTE_GAME_IDS[selectedRoulette];
    
    if (!gameId || !jwtToken) {
      setLaunchError('Erro interno: ID do jogo ou Token não encontrado.');
      setIsLaunching(false);
      return;
    }
  
    try {
      const response = await fetch(`${API_URL}/start-game/${gameId}`, { 
        method: 'GET',
        headers: { 'Authorization': `Bearer ${jwtToken}` }
      });
  
      const rawResponseText = await response.text();
  
      if (response.ok) {
        try {
          const data = JSON.parse(rawResponseText);
          const apiErrorMessage = data?.original?.message || data?.message;
          
          if ((data?.original?.status === 'error' || data?.status === 'error') && apiErrorMessage) {
            if (apiErrorMessage.includes('Failed to request Softswiss Url')) {
              setLaunchError('Problemas com a provedora Evolution. Tente novamente.');
            } else {
              setLaunchError(`Erro da API: ${apiErrorMessage.substring(0, 100)}...`);
            }
            return;
          }
  
          // Try multiple paths to find game URL
          let gameUrlFound = data?.launchOptions?.launch_options?.game_url
            || data?.launch_options?.game_url
            || data?.game_url
            || data?.url
            || data?.gameURL;
          
          // Recursive search as fallback
          if (!gameUrlFound) {
            const findGameUrl = (obj) => {
              for (let key in obj) {
                if (key === 'game_url' && typeof obj[key] === 'string') return obj[key];
                if (typeof obj[key] === 'object' && obj[key] !== null) {
                  const result = findGameUrl(obj[key]);
                  if (result) return result;
                }
              }
              return null;
            };
            gameUrlFound = findGameUrl(data);
          }
  
          if (gameUrlFound) {
            setGameUrl(gameUrlFound);
            setLaunchError('');
          } else {
            setLaunchError('URL do jogo não encontrada.');
          }
        } catch (jsonError) {
          setLaunchError('Resposta inválida da API.');
        }
      } else {
        const errorInfo = await processErrorResponse(response, 'game');
        displayError(errorInfo, setLaunchError, { showIcon: true });
      }
    } catch (err) {
      const errorInfo = translateNetworkError(err);
      displayError(errorInfo, setLaunchError, { showIcon: true });
    } finally {
      setIsLaunching(false);
    }
  }, [selectedRoulette, jwtToken]);

  // Auto-launch on auth
  useEffect(() => {
    if (isAuthenticated && jwtToken && !gameUrl && !isLaunching) { 
      console.log('Autenticado, iniciando jogo automaticamente...');
      handleLaunchGame();
    }
  }, [isAuthenticated, jwtToken, gameUrl, isLaunching, handleLaunchGame]);

  // Iframe health check
  useEffect(() => {
    if (!gameUrl) {
      setIframeError(false);
      return;
    }

    const checkRenderingHealth = () => {
      const container = document.querySelector('.app-container');
      if (container && container.offsetHeight === 0) {
        setIframeError(true);
      }
    };

    const timeoutId = setTimeout(checkRenderingHealth, 3000);
    return () => clearTimeout(timeoutId);
  }, [gameUrl]);

  // Reset game state
  const resetGame = useCallback(() => {
    setGameUrl('');
    setLaunchError('');
    setIframeError(false);
  }, []);

  return {
    isLaunching,
    launchError,
    setLaunchError,
    gameUrl,
    setGameUrl,
    iframeError,
    setIframeError,
    handleLaunchGame,
    resetGame
  };
};