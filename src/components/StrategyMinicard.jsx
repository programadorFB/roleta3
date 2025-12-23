// components/StrategyMiniCard.jsx

import React from 'react';
import styles from '../pages/MasterDashboard.module.css';

const STATUS_COLORS = {
  '🟢': '#10b981',  // Verde
  '🟡': '#f59e0b',  // Amarelo
  '🔴': '#ef4444'   // Vermelho
};

const StrategyMiniCard = ({ name, score, status }) => {
  const statusColor = STATUS_COLORS[status] || STATUS_COLORS['🔴'];

  return (
    <div 
      className={styles.strategyMiniCard} 
      style={{ borderBottomColor: statusColor }}
    >
      <div className={styles.miniCardHeader}>
        <br/>
        <span>{name}</span>
      </div>
      <div 
        className={styles.miniCardScore} 
        style={{ color: statusColor }}
      >
        {score.toFixed(0)}%
      </div>
      <div 
        className={styles.miniCardStatus} 
        style={{ color: statusColor }}
      >
        {status}
      </div>
    </div>
  );
};

export default StrategyMiniCard;