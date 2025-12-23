// components/EntrySignalCard.jsx

import React from 'react';
import NumberChip from './NumberChip';
import styles from '../pages/MasterDashboard.module.css';

const EntrySignalCard = ({ entrySignal }) => {
  if (!entrySignal) return null;

  return (
    <div className={styles.entrySignalCard}>
      <div 
        className={styles['strategy-header']} 
        style={{ marginBottom: '1rem', borderBottomColor: '#10b981' }}
      >
        <h4 
          className={styles['card-title2']} 
          style={{ color: '#10b981' }}
        >
          SINAL DE ENTRADA CONFIRMADO!
        </h4>
      </div>

      <p 
        className={styles['card-concept']} 
        style={{ textAlign: 'center', marginBottom: '1rem' }}
      >
        Convergência de <strong>{entrySignal.convergence}</strong> estratégias detectada! ({entrySignal.reason})
      </p>

      <div style={{ marginBottom: '1rem' }}>
        <div style={{ textAlign: 'center' }}>
          {entrySignal.suggestedNumbers.map(num => (
            <NumberChip key={num} number={num} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default EntrySignalCard;