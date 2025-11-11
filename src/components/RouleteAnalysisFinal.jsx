import React, { useState, useEffect } from 'react';
import { RefreshCw, Download, FileText } from 'lucide-react';
import DeepAnalysisPanel from './DeepAnalysisPanel';

// Configuração completa da roleta
const ROULETTE_CONFIG = {
  red: [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36],
  black: [2, 4, 6, 8, 10, 11, 13, 15, 17, 20, 22, 24, 26, 28, 29, 31, 33, 35],
  
  sectors: {
    zero: [0, 32, 15, 19, 4, 21, 2, 25],
    orfaos: [1, 20, 14, 31, 9, 17, 34, 6],
    esquer: [5, 24, 16, 33, 1, 20, 14, 31, 9],
    direit: [27, 13, 36, 11, 30, 8, 23, 10, 5, 24, 16, 33]
  }
};

// Função para obter atributos de um número
const getNumberAttributes = (num) => {
  const n = parseInt(num);
  
  if (isNaN(n) || n < 0 || n > 36) {
    return null;
  }
  
  if (n === 0) {
    return {
      num: 0,
      cor: 'Verde',
      ab: 'Zero',
      ip: 'Zero',
      col: 'Zero',
      duz: 'Zero',
      setor: 'Zero'
    };
  }
  
  const cor = ROULETTE_CONFIG.red.includes(n) ? 'Vermelho' : 'Preto';
  const ab = n >= 1 && n <= 18 ? 'Baixo' : 'Alto';
  const ip = n % 2 === 0 ? 'Par' : 'Impar';
  
  let col;
  if (n % 3 === 1) col = 'C1';
  else if (n % 3 === 2) col = 'C2';
  else col = 'C3';
  
  let duz;
  if (n >= 1 && n <= 12) duz = 'D1';
  else if (n >= 13 && n <= 24) duz = 'D2';
  else duz = 'D3';
  
  let setor = 'Outros';
  if (ROULETTE_CONFIG.sectors.zero.includes(n)) setor = 'Zero';
  else if (ROULETTE_CONFIG.sectors.orfaos.includes(n)) setor = 'Órfãos';
  else if (ROULETTE_CONFIG.sectors.esquer.includes(n)) setor = 'Esquer';
  else if (ROULETTE_CONFIG.sectors.direit.includes(n)) setor = 'Direit';
  
  return { num: n, cor, ab, ip, col, duz, setor };
};

const RouletteAnalysisFinal = () => {
  const [numbers, setNumbers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedSource, setSelectedSource] = useState('immersive');
  const [error, setError] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);

  const sources = ['immersive', 'brasileira', 'default', 'speed', 'xxxtreme', 'vipauto'];

  // Função para buscar dados do backend
  const fetchHistoryData = async (source) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/full-history?source=${source}`);
      
      if (!response.ok) {
        throw new Error(`Erro ao buscar dados: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Transforma os dados em números com atributos
      const processedNumbers = data
        .map(item => {
          const attrs = getNumberAttributes(item.signal);
          if (!attrs) return null;
          
          return {
            ...attrs,
            timestamp: item.timestamp,
            signalId: item.signalId,
            gameId: item.gameId
          };
        })
        .filter(n => n !== null)
        .slice(0, 100); // Últimos 100 números
      
      setNumbers(processedNumbers);
      setLastUpdate(new Date());
      console.log(`✅ ${processedNumbers.length} números carregados de ${source}`);
    } catch (err) {
      console.error('❌ Erro ao buscar dados:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Carrega dados ao montar e quando trocar a fonte
  useEffect(() => {
    fetchHistoryData(selectedSource);
  }, [selectedSource]);

  // Auto-refresh a cada 5 segundos
  useEffect(() => {
    const interval = setInterval(() => {
      fetchHistoryData(selectedSource);
    }, 5000);
    
    return () => clearInterval(interval);
  }, [selectedSource]);

  // Função para exportar dados
  const exportData = () => {
    const csvContent = [
      ['Timestamp', 'Número', 'Cor', 'A/B', 'I/P', 'Coluna', 'Dúzia', 'Setor'].join(','),
      ...numbers.map(n => [
        n.timestamp,
        n.num,
        n.cor,
        n.ab,
        n.ip,
        n.col,
        n.duz,
        n.setor
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `roleta-${selectedSource}-${Date.now()}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getNumberColor = (cor) => {
    if (cor === 'Vermelho') return 'bg-red-500 text-white';
    if (cor === 'Preto') return 'bg-gray-800 text-white';
    return 'bg-green-500 text-white';
  };

  return (
    <div className="flex h-screen bg-gray-900">
      {/* CATALOGAÇÃO - Painel Esquerdo */}
      <div className="w-1/3 bg-gray-800 p-4 overflow-y-auto border-r border-gray-700">
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-white text-xl font-bold">Catalogação</h2>
            <div className="flex gap-2">
              <button 
                onClick={() => fetchHistoryData(selectedSource)}
                disabled={loading}
                className="bg-blue-500 hover:bg-blue-600 text-white rounded-full p-2 disabled:opacity-50"
                title="Atualizar"
              >
                <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
              </button>
              <button 
                onClick={exportData}
                disabled={numbers.length === 0}
                className="bg-green-500 hover:bg-green-600 text-white rounded-full p-2 disabled:opacity-50"
                title="Exportar CSV"
              >
                <Download size={20} />
              </button>
            </div>
          </div>

          {/* Seletor de fonte */}
          <select
            value={selectedSource}
            onChange={(e) => setSelectedSource(e.target.value)}
            className="w-full bg-gray-700 text-white p-2 rounded mb-2"
          >
            {sources.map(source => (
              <option key={source} value={source}>
                {source.charAt(0).toUpperCase() + source.slice(1)}
              </option>
            ))}
          </select>

          {lastUpdate && (
            <div className="text-gray-400 text-xs">
              Última atualização: {lastUpdate.toLocaleTimeString()}
            </div>
          )}

          {error && (
            <div className="bg-red-500/20 border border-red-500 text-red-200 p-2 rounded text-sm mt-2">
              {error}
            </div>
          )}
        </div>

        {/* Cabeçalho da tabela */}
        <div className="grid grid-cols-7 gap-1 mb-2 text-xs font-bold">
          <div className="text-white text-center">NUM</div>
          <div className="text-white text-center">COR</div>
          <div className="text-white text-center">A/B</div>
          <div className="text-white text-center">I/P</div>
          <div className="text-white text-center">COL</div>
          <div className="text-white text-center">DUZ</div>
          <div className="text-white text-center">SETOR</div>
        </div>

        {/* Lista de números */}
        {loading && numbers.length === 0 ? (
          <div className="text-white text-center py-8">Carregando...</div>
        ) : (
          <div className="space-y-1">
            {numbers.map((item, idx) => (
              <div 
                key={idx}
                className="grid grid-cols-7 gap-1 items-center hover:bg-gray-700 rounded p-1"
              >
                <div className={`${getNumberColor(item.cor)} rounded text-center font-bold py-2`}>
                  {item.num}
                </div>
                <div className="bg-gray-700 text-white text-xs text-center py-2 rounded">
                  {item.cor}
                </div>
                <div className="bg-gray-700 text-white text-xs text-center py-2 rounded">
                  {item.ab}
                </div>
                <div className="bg-gray-700 text-white text-xs text-center py-2 rounded">
                  {item.ip}
                </div>
                <div className="bg-gray-700 text-white text-xs text-center py-2 rounded">
                  {item.col}
                </div>
                <div className="bg-gray-700 text-white text-xs text-center py-2 rounded">
                  {item.duz}
                </div>
                <div className="bg-gray-700 text-white text-xs text-center py-2 rounded">
                  {item.setor}
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="text-white text-sm mt-4">
          ({numbers.length} números)
        </div>
      </div>

      {/* ANÁLISES PROFUNDAS - Painel Direito */}
      <div className="flex-1 overflow-hidden">
        <DeepAnalysisPanel spinHistory={numbers} />
      </div>
    </div>
  );
};

export default RouletteAnalysisFinal;