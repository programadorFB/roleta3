import React, { useMemo, useState, useEffect, useRef } from 'react';
import { 
    Flame, Snowflake, Layers, AlignCenter, TrendingUp, BarChart3, Target, PieChart, Activity, Cpu, Info, Users, BookOpen,
    AlertCircle // <--- ADICIONADO O ÍCONE
} from 'lucide-react';
import styles from './DeepAnalysisPanel.module.css';
import { useNotifications } from '../contexts/NotificationContext';
import { checkConvergenceAlert, checkPatternBrokenAlert } from '../services/alertLogic';

// Importe todos os seus componentes de aba
import SectorsAnalysis from './SectorAnalysis';
import NeighborAnalysis from './NeighborAnalysis';
import TerminalAnalysis from './TerminalAnalysis';
import AdvancedPatternsAnalysis from './AdvancedPatternsAnalysis';
import FrequencyTable from './FrequencyTable';
import GroupStrategiesAnalysis from './GroupStrategiesAnalysis';
import CatalogacaoTable from './Catalogacaotable'; 
import CercoAlertPanel from './CercoAlertPanel.jsx'; // <--- IMPORTADO AQUI

import { UpdateCountdown } from './VisualIndicators';
import { analyzeCroupierPattern } from '../services/CroupieDetection.jsx';

// ... [MANTENHA AS CONSTANTES E FUNÇÕES UTILITÁRIAS INTOCADAS] ...

// --- Componente Principal com Abas ---
// Adicionado cercoOptions nas props
const DeepAnalysisPanel = ({ spinHistory, cercoOptions }) => { 
    const [activeTab, setActiveTab] = useState('statistics');
    const { addNotification } = useNotifications();
    const prevAnalysesRef = useRef();

    // ... [MANTENHA O USEMEMO DE ANALYSE E USEEFFECT DE ALERTAS INTOCADOS] ...

    // ... [MANTENHA OS COMPONENTES AUXILIARES (StatCard, NumberChip, ProgressBar) INTOCADOS] ...

    // --- Renderização Principal ---

    if (analysis.totalSpins === 0) {
        return (
            <div className={styles['strategies-info-panel']}>
                <h3 className={styles['dashboard-title']}>Análise Estatística</h3>
                <div className={styles['strategy-card']}>
                    <p className={`${styles['card-concept']} ${styles['empty-state']}`} 
                       style={{textAlign: 'center'}}>
                        Aguardando histórico de sinais para iniciar a análise...
                    </p>
                </div>
            </div>
        );
    }

    const getTabStyle = (tabName) => ({
        flex: 1,
        minWidth: '100px',
        padding: '0.75rem 0.5rem',
        background: activeTab === tabName ? 'linear-gradient(135deg, #ca8a04, #eab308)' : 'rgba(255, 255, 255, 0.05)',
        color: activeTab === tabName ? '#111827' : '#d1d5db',
        border: 'none',
        borderRadius: '0.5rem',
        cursor: 'pointer',
        fontWeight: 'bold',
        fontSize: '0.9rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '0.5rem',
        transition: 'all 0.2s',
        boxShadow: activeTab === tabName ? '0 2px 8px rgba(202, 138, 4, 0.4)' : 'none'
    });

    return (
        <div className={styles['strategies-info-panel']}>
            {/* Sistema de Abas */}
            <div style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '0.5rem',
                marginBottom: '1rem',
                borderBottom: '2px solid #374151',
                paddingBottom: '0.5rem'
            }}>
                
                <button onClick={() => setActiveTab('statistics')} style={getTabStyle('statistics')}>
                    <TrendingUp size={18} /> Geral
                </button>
                
                {/* === NOVO BOTÃO CERCO === */}
                <button onClick={() => setActiveTab('cerco')} style={getTabStyle('cerco')}>
                    <AlertCircle size={18} /> Cerco
                </button>
                {/* ======================== */}

                <button onClick={() => setActiveTab('frequency')} style={getTabStyle('frequency')}>
                    <BarChart3 size={18} /> Frequência
                </button>

                <button onClick={() => setActiveTab('neighbors')} style={getTabStyle('neighbors')}>
                    <PieChart size={18} /> Vizinhança
                </button>
                
                <button onClick={() => setActiveTab('terminals')} style={getTabStyle('terminals')}>
                    <Target size={18} /> Cavalos
                </button>
       
                <button onClick={() => setActiveTab('advanced')} style={getTabStyle('advanced')}>
                    <Cpu size={18} /> Avançado
                </button>

                <button onClick={() => setActiveTab('sectors')} style={getTabStyle('sectors')}>
                    <Layers size={18} /> Setores
                </button>

                {/* Botões comentados mantidos conforme original */}
                {/* <button onClick={() => setActiveTab('catalog')} style={getTabStyle('catalog')}>
                    <BookOpen size={18} /> Catálogo
                </button> */}
            </div>

            {/* Conteúdo da Aba */}
            
            {activeTab === 'statistics' && (
                <>
                    {/* ... [MANTENHA O CONTEÚDO DA ABA STATISTICS INTOCADO] ... */}
                    <h3 className={styles['dashboard-title']}>
                        Análise Estatística ({analysis.totalSpins} Sinais)
                    </h3>
                    <StatCard title="Números Quentes" icon={<Flame size={24} className={styles['dangerIcon']} />}>
                        {analysis.hotNumbers.map(([num, count]) => (
                            <div className={styles['stat-row']} key={num}>
                                <span className={styles['stat-label']}>Número <NumberChip number={parseInt(num)} /></span>
                                <span className={styles['stat-value']}>{count} vezes ({(count/analysis.totalSpins * 100).toFixed(1)}%)</span>
                            </div>
                        ))}
                    </StatCard>
                    {/* ... Demais StatCards ... */}
                     <StatCard title="Congelados (Mais Tempo Sem Sair)" icon={<Snowflake size={24} style={{color: '#38bdf8'}} />}>
                        {analysis.sleepers.map(({ num, ago }) => (
                            <div className={styles['stat-row']} key={num}>
                                <span className={styles['stat-label']}>Número <NumberChip number={parseInt(num)} /></span>
                                <span className={styles['stat-value']}>{ago} rodadas atrás</span>
                            </div>
                        ))}
                    </StatCard>
                    <StatCard title="Sequências de Cores" icon={<TrendingUp size={24} className={styles['warningIcon']} />}>
                        <div className={styles['stat-row']}>
                            <span className={styles['stat-label']}>Sequência Atual:</span>
                            <span className={`${styles['stat-value']} ${analysis.streaks.red.current > 0 ? styles['red'] : styles['black']}`}>
                                {analysis.streaks.red.current > 0 ? `${analysis.streaks.red.current} Vermelhos` : `${analysis.streaks.black.current} Pretos`}
                            </span>
                        </div>
                         {/* ... */}
                    </StatCard>
                    {/* ... Restante da aba Statistics ... */}
                </>
            )}
            
            {/* === CONTEÚDO DA NOVA ABA CERCO === */}
            {activeTab === 'cerco' && (
                <CercoAlertPanel spinHistory={spinHistory} options={cercoOptions} />
            )}
            {/* ================================== */}

            {activeTab === 'frequency' && <FrequencyTable spinHistory={spinHistory} />}
            {activeTab === 'neighbors' && <NeighborAnalysis spinHistory={spinHistory} />}
            {activeTab === 'terminals' && <TerminalAnalysis spinHistory={spinHistory} />}
            {activeTab === 'advanced' && <AdvancedPatternsAnalysis spinHistory={spinHistory} />}
            {activeTab === 'sectors' && <SectorsAnalysis spinHistory={spinHistory} />}
            
            {activeTab === 'visual' && (
                <>
                    <h3 className={styles['dashboard-title']}>Indicadores Visuais</h3>
                    <StatCard title="Contador de Atualização" icon={<Activity size={24} className={styles.infoIcon} />}>
                        <UpdateCountdown countdownKey={spinHistory.length} duration={5000} />
                    </StatCard>
                </>
            )}
            
            {activeTab === 'groups' && <GroupStrategiesAnalysis spinHistory={spinHistory} />}
            {activeTab === 'catalog' && <CatalogacaoTable spinHistory={spinHistory} />}
        </div>
    );
};

export default DeepAnalysisPanel;