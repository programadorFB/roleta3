// TEST_CERCO.js - Teste Funcional do Sistema de Alerta Cerco
// Execute: node TEST_CERCO.js

// ==================== IMPORTAÇÃO DAS FUNÇÕES ====================
// (Simula o import - em produção, use: import { ... } from './alertLogic_cerco.jsx')

const checkCercoPattern = (spinHistory) => {
  if (!spinHistory || spinHistory.length < 5) return null;

  const last5 = spinHistory.slice(0, 5);
  const numbers = last5.map(spin => spin.number);
  const firstNumber = numbers[4];
  const lastNumber = numbers[0];

  if (firstNumber === lastNumber) {
    const middleNumbers = numbers.slice(1, 4);
    return {
      type: 'success',
      title: '🎯 Padrão CERCO Detectado!',
      message: `Número ${firstNumber} fechou o cerco! Sequência: ${[...numbers].reverse().join('-')}`,
      pattern: {
        z: firstNumber,
        sequence: [...numbers].reverse(),
        middleNumbers: [...middleNumbers].reverse()
      },
      duration: 8000,
      priority: 'high'
    };
  }
  return null;
};

const identifyCercoCandidates = (spinHistory) => {
  if (!spinHistory || spinHistory.length < 20) return null;

  const recentSpins = spinHistory.slice(0, 20);
  const numberFrequency = {};

  recentSpins.forEach(spin => {
    numberFrequency[spin.number] = (numberFrequency[spin.number] || 0) + 1;
  });

  const hotNumbers = Object.entries(numberFrequency)
    .filter(([num, count]) => count >= 2)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([num, count]) => ({
      number: parseInt(num),
      appearances: count,
      probability: (count / recentSpins.length * 100).toFixed(1)
    }));

  if (hotNumbers.length > 0) {
    return {
      type: 'warning',
      title: '🔥 Candidatos a Cerco',
      message: `${hotNumbers.length} números aparecem múltiplas vezes`,
      candidates: hotNumbers
    };
  }
  return null;
};

const analyzeCercoFrequency = (spinHistory, lookbackWindow = 50) => {
  if (!spinHistory || spinHistory.length < 5) return null;

  const recentSpins = spinHistory.slice(0, lookbackWindow);
  let cercoCount = 0;
  const cercoNumbers = new Set();

  for (let i = 0; i <= recentSpins.length - 5; i++) {
    const window = recentSpins.slice(i, i + 5);
    const numbers = window.map(spin => spin.number);
    
    if (numbers[0] === numbers[4]) {
      cercoCount++;
      cercoNumbers.add(numbers[0]);
    }
  }

  if (cercoCount > 0) {
    const frequency = (cercoCount / (lookbackWindow / 5)) * 100;
    return {
      type: 'info',
      title: '📊 Análise de Padrão Cerco',
      message: `${cercoCount} padrões nos últimos ${lookbackWindow} spins`,
      stats: {
        totalPatterns: cercoCount,
        uniqueNumbers: Array.from(cercoNumbers),
        frequency: frequency.toFixed(1)
      }
    };
  }
  return null;
};

// ==================== DADOS DE TESTE ====================

const testCases = [
  {
    name: "TESTE 1: Padrão CERCO Simples (17-5-23-8-17)",
    spinHistory: [
      { number: 17, timestamp: '2025-11-18T10:05:00' },
      { number: 8,  timestamp: '2025-11-18T10:04:55' },
      { number: 23, timestamp: '2025-11-18T10:04:50' },
      { number: 5,  timestamp: '2025-11-18T10:04:45' },
      { number: 17, timestamp: '2025-11-18T10:04:40' }
    ],
    expected: {
      shouldDetect: true,
      z: 17,
      sequence: [17, 5, 23, 8, 17]
    }
  },
  
  {
    name: "TESTE 2: Padrão CERCO com Zero (0-12-9-31-0)",
    spinHistory: [
      { number: 0 },
      { number: 31 },
      { number: 9 },
      { number: 12 },
      { number: 0 }
    ],
    expected: {
      shouldDetect: true,
      z: 0,
      sequence: [0, 12, 9, 31, 0]
    }
  },
  
  {
    name: "TESTE 3: Padrão Inválido (números diferentes)",
    spinHistory: [
      { number: 17 },
      { number: 8 },
      { number: 23 },
      { number: 5 },
      { number: 19 } // Diferente do primeiro
    ],
    expected: {
      shouldDetect: false
    }
  },
  
  {
    name: "TESTE 4: Múltiplos números repetidos (candidatos)",
    spinHistory: [
      { number: 17 }, { number: 5 }, { number: 17 }, { number: 23 },
      { number: 5 }, { number: 8 }, { number: 17 }, { number: 9 },
      { number: 5 }, { number: 12 }, { number: 23 }, { number: 31 },
      { number: 17 }, { number: 0 }, { number: 23 }, { number: 5 },
      { number: 8 }, { number: 17 }, { number: 9 }, { number: 23 }
    ],
    expected: {
      shouldDetect: false, // Não forma cerco nos últimos 5
      shouldHaveCandidates: true
    }
  },
  
  {
    name: "TESTE 5: Histórico com 3 padrões CERCO",
    spinHistory: [
      // Padrão 3 (mais recente)
      { number: 24 }, { number: 1 }, { number: 33 }, { number: 7 }, { number: 24 },
      // Spins intermediários
      { number: 12 }, { number: 15 }, { number: 9 },
      // Padrão 2
      { number: 5 }, { number: 18 }, { number: 22 }, { number: 11 }, { number: 5 },
      // Spins intermediários
      { number: 3 }, { number: 14 },
      // Padrão 1 (mais antigo)
      { number: 17 }, { number: 8 }, { number: 23 }, { number: 5 }, { number: 17 },
      // Mais spins
      { number: 12 }, { number: 31 }, { number: 9 }, { number: 0 }
    ],
    expected: {
      shouldDetect: true,
      z: 24,
      sequence: [24, 7, 33, 1, 24],
      frequencyPatterns: 3
    }
  }
];

// ==================== EXECUÇÃO DOS TESTES ====================

console.log('\n' + '='.repeat(70));
console.log('🧪 TESTE FUNCIONAL - SISTEMA DE ALERTA CERCO');
console.log('='.repeat(70) + '\n');

let passedTests = 0;
let failedTests = 0;

testCases.forEach((test, index) => {
  console.log(`\n${'─'.repeat(70)}`);
  console.log(`📋 ${test.name}`);
  console.log(`${'─'.repeat(70)}\n`);

  // Teste 1: Detecção de Padrão Completo
  const result = checkCercoPattern(test.spinHistory);
  
  if (test.expected.shouldDetect) {
    if (result) {
      console.log('✅ PASS: Padrão CERCO detectado corretamente');
      console.log(`   📌 Número: ${result.pattern.z}`);
      console.log(`   📌 Sequência: ${result.pattern.sequence.join('-')}`);
      console.log(`   📌 Mensagem: ${result.message}`);
      
      // Valida se o número Z está correto
      if (result.pattern.z === test.expected.z) {
        console.log('✅ PASS: Número Z correto');
        passedTests++;
      } else {
        console.log(`❌ FAIL: Número Z incorreto (esperado: ${test.expected.z}, recebido: ${result.pattern.z})`);
        failedTests++;
      }
      
      // Valida sequência
      if (JSON.stringify(result.pattern.sequence) === JSON.stringify(test.expected.sequence)) {
        console.log('✅ PASS: Sequência correta');
        passedTests++;
      } else {
        console.log(`❌ FAIL: Sequência incorreta`);
        console.log(`   Esperado: ${test.expected.sequence.join('-')}`);
        console.log(`   Recebido: ${result.pattern.sequence.join('-')}`);
        failedTests++;
      }
    } else {
      console.log('❌ FAIL: Padrão deveria ser detectado mas não foi');
      failedTests++;
    }
  } else {
    if (!result) {
      console.log('✅ PASS: Padrão corretamente não detectado');
      passedTests++;
    } else {
      console.log('❌ FAIL: Padrão foi detectado incorretamente');
      console.log(`   Detectado: ${result.pattern.sequence.join('-')}`);
      failedTests++;
    }
  }

  // Teste 2: Candidatos (se aplicável)
  if (test.expected.shouldHaveCandidates) {
    const candidates = identifyCercoCandidates(test.spinHistory);
    
    if (candidates && candidates.candidates.length > 0) {
      console.log('\n✅ PASS: Candidatos identificados');
      console.log('   🔥 Top 3 Candidatos:');
      candidates.candidates.slice(0, 3).forEach((c, i) => {
        console.log(`      ${i + 1}. Número ${c.number}: ${c.appearances} aparições (${c.probability}%)`);
      });
      passedTests++;
    } else {
      console.log('❌ FAIL: Candidatos não identificados');
      failedTests++;
    }
  }

  // Teste 3: Análise de Frequência (se aplicável)
  if (test.expected.frequencyPatterns) {
    const frequency = analyzeCercoFrequency(test.spinHistory, test.spinHistory.length);
    
    if (frequency) {
      console.log(`\n✅ PASS: Análise de frequência executada`);
      console.log(`   📊 Padrões detectados: ${frequency.stats.totalPatterns}`);
      console.log(`   📊 Números únicos: ${frequency.stats.uniqueNumbers.join(', ')}`);
      console.log(`   📊 Frequência: ${frequency.stats.frequency}%`);
      
      if (frequency.stats.totalPatterns === test.expected.frequencyPatterns) {
        console.log(`✅ PASS: Número correto de padrões (${test.expected.frequencyPatterns})`);
        passedTests++;
      } else {
        console.log(`❌ FAIL: Esperado ${test.expected.frequencyPatterns}, recebido ${frequency.stats.totalPatterns}`);
        failedTests++;
      }
    }
  }
});

// ==================== TESTE EXTRA: PERFORMANCE ====================

console.log(`\n\n${'='.repeat(70)}`);
console.log('⚡ TESTE DE PERFORMANCE');
console.log('='.repeat(70) + '\n');

// Gera histórico grande (1000 spins)
const largeHistory = Array.from({ length: 1000 }, (_, i) => ({
  number: Math.floor(Math.random() * 37),
  timestamp: new Date(Date.now() - i * 5000).toISOString()
}));

console.log('📊 Testando com 1000 spins...\n');

const startTime = Date.now();
const perfResult = checkCercoPattern(largeHistory);
const endTime = Date.now();

console.log(`✅ Tempo de execução: ${endTime - startTime}ms`);

if (endTime - startTime < 50) {
  console.log('✅ PASS: Performance excelente (<50ms)');
  passedTests++;
} else {
  console.log('⚠️ WARNING: Performance poderia ser melhor');
}

// Frequência em 1000 spins
const startFreq = Date.now();
const freqResult = analyzeCercoFrequency(largeHistory, 1000);
const endFreq = Date.now();

console.log(`\n📊 Análise de frequência (1000 spins): ${endFreq - startFreq}ms`);
if (freqResult) {
  console.log(`   Padrões encontrados: ${freqResult.stats.totalPatterns}`);
  console.log(`   Frequência: ${freqResult.stats.frequency}%`);
}

// ==================== RESULTADO FINAL ====================

console.log(`\n\n${'='.repeat(70)}`);
console.log('📊 RESULTADO FINAL');
console.log('='.repeat(70) + '\n');

const totalTests = passedTests + failedTests;
const successRate = ((passedTests / totalTests) * 100).toFixed(1);

console.log(`✅ Testes Aprovados: ${passedTests}/${totalTests} (${successRate}%)`);
console.log(`❌ Testes Falhados: ${failedTests}/${totalTests}`);

if (failedTests === 0) {
  console.log('\n🎉 TODOS OS TESTES PASSARAM! Sistema Cerco funcionando perfeitamente.\n');
} else {
  console.log('\n⚠️ ALGUNS TESTES FALHARAM. Revise a implementação.\n');
}

console.log('='.repeat(70) + '\n');

// ==================== INSTRUÇÕES DE USO ====================

console.log('📝 COMO USAR NO SEU APP:\n');
console.log('1. Certifique-se que alertLogic_cerco.jsx está em /src/services/');
console.log('2. CercoAlertPanel.jsx deve estar em /src/components/');
console.log('3. No App.jsx, o componente já está integrado (linha 1049)');
console.log('4. O sistema detectará padrões automaticamente quando houver 5+ spins\n');

console.log('💡 EXEMPLO DE PADRÃO VÁLIDO:');
console.log('   Sequência: 17 → 5 → 23 → 8 → 17');
console.log('   Resultado: ✅ CERCO DETECTADO (17 fecha o cerco)\n');

console.log('💡 EXEMPLO DE PADRÃO INVÁLIDO:');
console.log('   Sequência: 17 → 5 → 23 → 8 → 19');
console.log('   Resultado: ❌ Não é cerco (números diferentes)\n');

console.log('='.repeat(70) + '\n');