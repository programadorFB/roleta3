// App.jsx - Versão Modularizada
import React, { useState, useMemo, useCallback } from 'react';
import { 
  BarChart3, Clock, Layers, LogOut, PlayCircle, Filter 
} from 'lucide-react';

// Constants
import { ROULETTE_SOURCES, ROULETTE_GAME_IDS, FILTER_OPTIONS } from './constants/roulette';

// Utils
import { formatPullTooltip, getNumberColor } from './utils/roulette';

// Hooks
import { 
  useAuth, 
  useInactivityTimeout, 
  useRouletteSocket, 
  useSpinHistory, 
  useGameLauncher 
} from './hooks';

// Components
import Login from './components/Login';
import GameIframe from './components/GameIframe';
import NumberStatsPopup from './components/NumberStatsPopup';
import MobileTooltip from './components/MobileTooltip';
import PaywallModal from './components/PaywallModal';
import MasterDashboard from './pages/MasterDashboard';
import RacingTrack from './components/RacingTrack';
import DeepAnalysisPanel from './components/DeepAnalysisPanel';
import ResultsGrid from './components/ResultGrid';

// Styles
import './components/PaywallModal.css';
import './components/NotificationsCenter.css';
import './App.modules.css';
import './index.css';

// Assets
import W600 from "./assets/w=600.svg";

const App = () => {
  // === AUTH ===
  const {
    isAuthenticated,
    userInfo,
    checkingAuth,
    jwtToken,
    handleLoginSuccess,
    handleLogout: baseLogout
  } = useAuth();

  // === PAYWALL ===
  const [isPaywallOpen, setIsPaywallOpen] = useState(false);
  const [checkoutUrl, setCheckoutUrl] = useState('');
  const isPremium = false;

  // === ROULETTE SELECTION ===
  const [selectedRoulette, setSelectedRoulette] = useState(Object.keys(ROULETTE_SOURCES)[0]);
  const [historyFilter, setHistoryFilter] = useState(FILTER_OPTIONS[0].value);
  const [entrySignals, setEntrySignals] = useState([]);

  // === GAME LAUNCHER ===
  const {
    isLaunching,
    launchError,
    setLaunchError,
    gameUrl,
    setGameUrl,
    iframeError,
    setIframeError,
    handleLaunchGame,
    resetGame
  } = useGameLauncher({ selectedRoulette, jwtToken, isAuthenticated });

  // Logout with game reset
  const handleLogout = useCallback(() => {
    resetGame();
    baseLogout();
  }, [resetGame, baseLogout]);

  // === SPIN HISTORY ===
  const handlePaywallRequired = useCallback((url) => {
    setCheckoutUrl(url);
    setIsPaywallOpen(true);
  }, []);

  const {
    filteredSpinHistory,
    selectedResult,
    setSelectedResult,
    numberPullStats,
    numberPreviousStats,
    stats,
    addSpin,
    clearHistory
  } = useSpinHistory({
    selectedRoulette,
    userEmail: userInfo?.email,
    isAuthenticated,
    historyFilter,
    onPaywallRequired: handlePaywallRequired
  });

  // === SOCKET (PlayTech only) ===
  useRouletteSocket({
    selectedRoulette,
    jwtToken,
    userEmail: userInfo?.email,
    onNewSpin: addSpin
  });

  // === INACTIVITY TIMEOUT ===
  useInactivityTimeout({
    isActive: !!gameUrl && isAuthenticated,
    onTimeout: handleLogout
  });

  // === POPUP STATE ===
  const [popupNumber, setPopupNumber] = useState(null);
  const [isPopupOpen, setIsPopupOpen] = useState(false);

  const handleNumberClick = useCallback((number) => {
    setPopupNumber(number);
    setIsPopupOpen(true);
  }, []);

  const closePopup = useCallback(() => {
    setIsPopupOpen(false);
    setPopupNumber(null);
  }, []);

  // === MOBILE TOOLTIP ===
  const [mobileTooltip, setMobileTooltip] = useState({
    visible: false,
    content: '',
    x: 0,
    y: 0,
    isBelow: false
  });

  const handleResultBoxClick = useCallback((e, result) => {
    if (window.innerWidth <= 1024) { 
      e.preventDefault();
      const tooltipTitle = formatPullTooltip(result.number, numberPullStats, numberPreviousStats);
      const rect = e.currentTarget.getBoundingClientRect();
      const x = rect.left + (rect.width / 2);
      let y = rect.top - 10;
      let isBelow = false;
      
      if (y < 100) { 
        y = rect.bottom + 10; 
        isBelow = true; 
      }
      
      setMobileTooltip(prev => {
        if (prev.visible && prev.content === tooltipTitle) {
          return { visible: false, content: '', x: 0, y: 0, isBelow: false };
        }
        return { visible: true, content: tooltipTitle, x, y, isBelow };
      });
    } else {
      handleNumberClick(result.number);
    }
  }, [numberPullStats, numberPreviousStats, handleNumberClick]);

  const closeMobileTooltip = useCallback(() => {
    setMobileTooltip({ visible: false, content: '', x: 0, y: 0, isBelow: false });
  }, []);

  // === ROULETTE CHANGE HANDLER ===
  const handleRouletteChange = useCallback((e) => {
    clearHistory();
    setSelectedResult(null);
    setSelectedRoulette(e.target.value);
    resetGame();
  }, [clearHistory, setSelectedResult, resetGame]);

  // === POPUP STATS ===
  const popupStats = useMemo(() => {
    if (popupNumber === null || !isPopupOpen) return null;
    
    const occurrences = [];
    filteredSpinHistory.forEach((spin, index) => { 
      if (spin.number === popupNumber) occurrences.push({ index }); 
    });
    
    const count = occurrences.length;
    const historyCount = filteredSpinHistory.length;
    const frequency = historyCount > 0 ? ((count / historyCount) * 100).toFixed(2) : '0.00';
    
    const nextOccurrences = occurrences.slice(0, 5).map(occ => {
      const prevSpins = filteredSpinHistory.slice(occ.index + 1, occ.index + 6).map(s => s.number);
      return { spinsAgo: occ.index + 1, prevSpins };
    });
    
    return { 
      count, 
      frequency, 
      nextOccurrences, 
      historyFilter: historyCount, 
      lastHitAgo: occurrences.length > 0 ? occurrences[0].index + 1 : null 
    };
  }, [popupNumber, isPopupOpen, filteredSpinHistory]);

  // === RENDER ===
  if (checkingAuth) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner-large"></div>
        <p>Carregando...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <Login 
        onLoginSuccess={handleLoginSuccess} 
        setIsPaywallOpen={setIsPaywallOpen} 
        setCheckoutUrl={setCheckoutUrl} 
      />
    );
  }

  return (
    <div className="app-root">
      <MobileTooltip tooltip={mobileTooltip} onClose={closeMobileTooltip} />

      {iframeError && (
        <div className="iframe-error-overlay">
          <div className="iframe-error-content">
            <p>⚠️ Erro de renderização detectado</p>
            <button onClick={() => { 
              setGameUrl(''); 
              setIframeError(false); 
              window.location.reload(); 
            }}>
              Recarregar Página
            </button>
          </div>
        </div>
      )}

      <Navbar handleLogout={handleLogout} />

      <main className="app-container">
        <StatsSidebar
          selectedRoulette={selectedRoulette}
          onRouletteChange={handleRouletteChange}
          historyFilter={historyFilter}
          onFilterChange={(e) => setHistoryFilter(
            e.target.value === 'all' ? 'all' : Number(e.target.value)
          )}
          isLaunching={isLaunching}
          gameUrl={gameUrl}
          launchError={launchError}
          onLaunchGame={handleLaunchGame}
          filteredSpinHistory={filteredSpinHistory}
          stats={stats}
          onSignalUpdate={setEntrySignals}
        />

        <div className="racetrack-mobile-only">
          <RacingTrack 
            selectedResult={selectedResult} 
            onNumberClick={handleNumberClick} 
            entrySignals={entrySignals} 
          />
        </div>

        <section className="main-content">
          <div className="game-area">
            {gameUrl && (
              <GameIframe 
                url={gameUrl} 
                onError={() => setLaunchError('Erro ao carregar o iframe do jogo.')} 
              />
            )}
            <div className="racetrack-desktop-only">
              <RacingTrack 
                selectedResult={selectedResult} 
                onNumberClick={handleNumberClick} 
                entrySignals={entrySignals} 
              />
            </div>
          </div>
        </section>

        <AnalysisSidebar
          stats={stats}
          filteredSpinHistory={filteredSpinHistory}
          numberPullStats={numberPullStats}
          numberPreviousStats={numberPreviousStats}
          onResultClick={handleResultBoxClick}
          isPremium={isPremium}
          setIsPaywallOpen={setIsPaywallOpen}
        />
      </main>

      <PaywallModal 
        isOpen={isPaywallOpen} 
        onClose={() => setIsPaywallOpen(false)} 
        userId={userInfo?.email} 
        checkoutUrl={checkoutUrl} 
      />
      
      <NumberStatsPopup 
        isOpen={isPopupOpen} 
        onClose={closePopup} 
        number={popupNumber} 
        stats={popupStats} 
      />
    </div>
  );
};

// === SUB-COMPONENTES ===

const Navbar = ({ handleLogout }) => (
  <nav className="navbar">
    <div className="navbar-left"></div>
    <div className="navbar-right">
      <a 
        href="https://betou.bet.br/" 
        target="_blank" 
        rel="noopener noreferrer" 
        className="nav-btn"
      >
        ENTRE NA PLATAFORMA
        <img src={W600} alt="Logo" style={{ height: "15px" }} />
        <span className="nav-btn-text"></span>
      </a>
      <button onClick={handleLogout} className="logout-btn">
        <LogOut size={18} />
        <span className="logout-btn-text">Sair</span>
      </button>
    </div>
  </nav>
);

const StatsSidebar = ({
  selectedRoulette,
  onRouletteChange,
  historyFilter,
  onFilterChange,
  isLaunching,
  gameUrl,
  launchError,
  onLaunchGame,
  filteredSpinHistory,
  stats,
  onSignalUpdate
}) => (
  <aside className="stats-dashboard">
    <h3 className="dashboard-title">Estatísticas e Ações</h3>
    
    <div className="selectors-card">
      <div className="selectors-grid">
        <div className="selector-group">
          <h4 className="selector-label"><Layers size={15} /> Roletas</h4>
          <select 
            className="roulette-selector" 
            value={selectedRoulette} 
            onChange={onRouletteChange}
          >
            {Object.keys(ROULETTE_SOURCES).map(key => (
              <option key={key} value={key}>{ROULETTE_SOURCES[key]}</option>
            ))}
          </select>
        </div>
        
        <div className="selector-group">
          <h4 className="selector-label"><Filter size={15} /> Rodadas</h4>
          <select 
            className="roulette-selector" 
            value={historyFilter} 
            onChange={onFilterChange}
          >
            {FILTER_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
      </div>
      
      <button 
        onClick={onLaunchGame} 
        disabled={isLaunching || !ROULETTE_GAME_IDS[selectedRoulette]} 
        className="launch-button"
      >
        {isLaunching ? (
          <><div className="spinner"></div>Iniciando...</>
        ) : (
          <>
            <PlayCircle size={20} />
            {gameUrl 
              ? `Reiniciar ${ROULETTE_SOURCES[selectedRoulette]}` 
              : `Iniciar ${ROULETTE_SOURCES[selectedRoulette]}`
            }
          </>
        )}
      </button>
      
      {launchError && <p className="launch-error">{launchError}</p>}
    </div>
    
    <div className="stats-card">
      <h4 className="stats-card-title"><BarChart3 size={18} /> Total de Sinais</h4>
      <p className="stats-card-value">{filteredSpinHistory.length}</p>
    </div>
    
    <div className="master-dashboard-wrapper">
      {stats.historyFilter >= 50 ? (
        <MasterDashboard 
          spinHistory={filteredSpinHistory} 
          onSignalUpdate={onSignalUpdate} 
        />
      ) : (
        <div className="waiting-card">
          Aguardando {50 - stats.historyFilter} spins para iniciar o Master Dashboard...
        </div>
      )}
    </div>
  </aside>
);

const AnalysisSidebar = ({
  stats,
  filteredSpinHistory,
  numberPullStats,
  numberPreviousStats,
  onResultClick,
  isPremium,
  setIsPaywallOpen
}) => (
  <aside className="analysis-panel">
    {stats.historyFilter >= 50 ? (
      <>
        <div className="results-section">
          <h4 className="section-title"><Clock size={20} /> Últimos Resultados (100)</h4>
          <div className="color-frequencies">
            <span className="freq-item">
              Vermelho: <strong className="red">{stats.colorFrequencies.red}%</strong>
            </span>
            <span className="freq-item">
              Zero: <strong className="green">{stats.colorFrequencies.green}%</strong>
            </span>
            <span className="freq-item">
              Preto: <strong className="black">{stats.colorFrequencies.black}%</strong>
            </span>
          </div>
          <div className='latest-results'>
            <ResultsGrid 
              latestNumbers={stats.latestNumbers} 
              numberPullStats={numberPullStats} 
              numberPreviousStats={numberPreviousStats} 
              onResultClick={onResultClick} 
              isPremium={isPremium} 
              setIsPaywallOpen={setIsPaywallOpen} 
            />
          </div>
        </div>
        <div>
          <DeepAnalysisPanel 
            spinHistory={filteredSpinHistory} 
            setIsPaywallOpen={setIsPaywallOpen} 
          />
        </div>
      </>
    ) : (
      <div className="waiting-panel">
        <div className="waiting-card">
          Aguardando {50 - stats.historyFilter} spins para iniciar o Painel de Análise...
        </div>
      </div>
    )}
  </aside>
);

export default App;