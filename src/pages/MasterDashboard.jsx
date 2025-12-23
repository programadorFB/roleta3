// pages/MasterDashboard.jsx

import React, { useEffect } from 'react';

// Hooks
import { useMasterAnalysis } from '../hooks/useMasterAnalysis';

// Components
import StrategyMiniCard from '../components/StrategyMinicard';
import EntrySignalCard from '../components/EntrySignalCard';
import SignalStatsGrid from '../components/SignalStatsGrid';

// Styles
import styles from './MasterDashboard.module.css';

// Componente de estado vazio/aguardando
const WaitingState = ({ spinsNeeded, onSignalUpdate }) => {
  // Limpa sinais enquanto aguarda
  useEffect(() => {
    onSignalUpdate([]);
  }, [onSignalUpdate]);

  return (
    <div className={styles['strategy-card']}>
      <p 
        className={`${styles['card-concept']} ${styles['empty-state']}`} 
        style={{ textAlign: 'center' }}
      >
        Aguardando {spinsNeeded} spins para o Painel Master...
      </p>
    </div>
  );
};

// Componente de sinal aceito
const SignalAcceptedCard = () => (
  <div 
    className={styles.strategyCard} 
    style={{ borderColor: '#10b981', background: 'rgba(16, 185, 129, 0.1)' }}
  >
    <p style={{ color: '#10b981', fontWeight: 'bold', textAlign: 'center' }}>
      Sinal confirmado! Boa sorte.
    </p>
  </div>
);

// Componente Principal
const MasterDashboard = ({ spinHistory, onSignalUpdate }) => { 
  const {
    analysis,
    isSignalAccepted,
    handleSignalConfirm,
    handleSignalIgnore
  } = useMasterAnalysis({ spinHistory, onSignalUpdate });

  // Estado de espera - dados insuficientes
  if (!analysis || analysis.strategyScores.length === 0) {
    const spinsNeeded = 50 - (spinHistory?.length || 0);
    return <WaitingState spinsNeeded={spinsNeeded} onSignalUpdate={onSignalUpdate} />;
  }

  const { strategyScores, entrySignal } = analysis;

  return (
    <div className={styles.masterDashboardContainer}>
      
      {/* 1. PAINEL MASTER - STATS GRID */}
      <div className={styles.strategyCard}>
        <SignalStatsGrid entrySignal={entrySignal} />
      </div>

      {/* 2. GRID DE ESTRATÉGIAS */}
      <div className={styles.masterGridContainer}>
        {strategyScores.map(strategy => (
          <StrategyMiniCard
            key={strategy.name}
            name={strategy.name}
            score={strategy.score}
            status={strategy.status}
          />
        ))}
      </div>

      {/* 3. SINAL DE ENTRADA (se existir e não aceito) */}
      {entrySignal && !isSignalAccepted && (
        <EntrySignalCard entrySignal={entrySignal} />
      )}

      {/* 4. CONFIRMAÇÃO DO SINAL */}
      {isSignalAccepted && <SignalAcceptedCard />}
    </div>
  );
};

export default MasterDashboard;