// ===================================================================
// 📊 STATISTICS MODULE - Advanced Statistics for Premium Users
// ===================================================================

const StatisticsModule = (() => {
  let matchHistory = [];
  let charts = {};
  let selectedPlayer = null;

  // ===================================================================
  // 🔧 INITIALIZATION
  // ===================================================================

  const init = async () => {
    Logger.log('[Statistics] Inizializzazione modulo statistiche...');

    try {
      // ✅ FIX BUG #48: Verifica disponibilità DatabaseModule
      if (!window.DatabaseModule || typeof window.DatabaseModule.loadHistory !== 'function') {
        Logger.error('[Statistics] DatabaseModule non disponibile');
        showNoDataMessage();
        hideLoader();
        return;
      }

      // Load match history
      matchHistory = await DatabaseModule.loadHistory();
      Logger.log('[Statistics] Caricati', matchHistory.length, 'match');

      // Check if we have data
      if (matchHistory.length === 0) {
        showNoDataMessage();
        hideLoader();
        return;
      }

      // Setup player filter
      setupPlayerFilter();

      // Calculate and display statistics
      updateStatistics();

      // Initialize charts
      initCharts();

      // Hide loader
      hideLoader();

      Logger.log('[Statistics] Inizializzazione completata');
    } catch (error) {
      Logger.error('[Statistics] Errore inizializzazione:', error);
      throw error;
    }
  };

  // ===================================================================
  // 👥 PLAYER FILTER
  // ===================================================================

  const setupPlayerFilter = () => {
    const playerFilter = document.getElementById('player-filter');
    if (!playerFilter) return;

    // Extract unique players from history
    const players = new Set();
    matchHistory.forEach(match => {
      if (match.giocatori && Array.isArray(match.giocatori)) {
        match.giocatori.forEach(player => {
          if (player.nome) {
            players.add(player.nome);
          }
        });
      }
    });

    // Populate select
    const sortedPlayers = Array.from(players).sort();
    sortedPlayers.forEach(playerName => {
      const option = document.createElement('option');
      option.value = playerName;
      option.textContent = playerName;
      playerFilter.appendChild(option);
    });

    // Add event listener
    playerFilter.addEventListener('change', (e) => {
      selectedPlayer = e.target.value || null;
      updateStatistics();
      updateCharts();
    });
  };

  // ===================================================================
  // 📊 STATISTICS CALCULATION
  // ===================================================================

  const updateStatistics = () => {
    const filteredMatches = getFilteredMatches();

    // Total matches
    const totalMatches = filteredMatches.length;
    document.getElementById('total-matches').textContent = totalMatches;

    // Total time played
    const totalTime = calculateTotalTime(filteredMatches);
    document.getElementById('total-time').textContent = formatTime(totalTime);

    // Win rate (for selected player)
    if (selectedPlayer) {
      const winRate = calculateWinRate(filteredMatches, selectedPlayer);
      const wins = calculateWins(filteredMatches, selectedPlayer);
      document.getElementById('win-rate').textContent = winRate.toFixed(1) + '%';
      document.getElementById('win-rate-subtitle').textContent = `${wins} vittorie su ${totalMatches}`;
    } else {
      document.getElementById('win-rate').textContent = '-';
      document.getElementById('win-rate-subtitle').textContent = 'Seleziona un giocatore';
    }

    // Average score
    if (selectedPlayer) {
      const avgScore = calculateAverageScore(filteredMatches, selectedPlayer);
      document.getElementById('avg-score').textContent = avgScore.toFixed(1);
      document.getElementById('avg-score-subtitle').textContent = 'Media punti per partita';
    } else {
      const avgScore = calculateOverallAverageScore(filteredMatches);
      document.getElementById('avg-score').textContent = avgScore.toFixed(1);
      document.getElementById('avg-score-subtitle').textContent = 'Media generale';
    }
  };

  const getFilteredMatches = () => {
    if (!selectedPlayer) return matchHistory;

    return matchHistory.filter(match => {
      if (!match.giocatori) return false;
      return match.giocatori.some(p => p.nome === selectedPlayer);
    });
  };

  const calculateTotalTime = (matches) => {
    return matches.reduce((total, match) => {
      return total + (match.duration || 0);
    }, 0);
  };

  const calculateWinRate = (matches, playerName) => {
    if (matches.length === 0) return 0;

    const wins = calculateWins(matches, playerName);
    return (wins / matches.length) * 100;
  };

  const calculateWins = (matches, playerName) => {
    return matches.filter(match => {
      if (!match.vincitori || !Array.isArray(match.vincitori)) return false;
      return match.vincitori.includes(playerName);
    }).length;
  };

  const calculateAverageScore = (matches, playerName) => {
    if (matches.length === 0) return 0;

    const totalScore = matches.reduce((sum, match) => {
      if (!match.giocatori) return sum;
      const player = match.giocatori.find(p => p.nome === playerName);
      return sum + (player ? player.punti : 0);
    }, 0);

    return totalScore / matches.length;
  };

  const calculateOverallAverageScore = (matches) => {
    if (matches.length === 0) return 0;

    let totalScore = 0;
    let playerCount = 0;

    matches.forEach(match => {
      if (match.giocatori && Array.isArray(match.giocatori)) {
        match.giocatori.forEach(player => {
          totalScore += player.punti || 0;
          playerCount++;
        });
      }
    });

    return playerCount > 0 ? totalScore / playerCount : 0;
  };

  const formatTime = (milliseconds) => {
    const hours = Math.floor(milliseconds / 3600000);
    const minutes = Math.floor((milliseconds % 3600000) / 60000);

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  // ===================================================================
  // 📈 CHARTS INITIALIZATION
  // ===================================================================

  const initCharts = () => {
    // ✅ FIX BUG #49: Verifica disponibilità Chart.js
    if (typeof Chart === 'undefined') {
      Logger.error('[Statistics] Chart.js non caricato - impossibile creare grafici');
      return;
    }

    createScoreEvolutionChart();
    createWinRateChart();
    createAverageScoreChart();
    createGameModeChart();
    createMatchesTimelineChart();
  };

  const updateCharts = () => {
    // Destroy existing charts
    Object.values(charts).forEach(chart => {
      if (chart) chart.destroy();
    });
    charts = {};

    // Recreate charts
    initCharts();
  };

  // Chart 1: Score Evolution Over Time
  const createScoreEvolutionChart = () => {
    const ctx = document.getElementById('score-evolution-chart');
    if (!ctx) return;

    const filteredMatches = getFilteredMatches();
    if (filteredMatches.length === 0) return;

    // Sort by timestamp
    const sortedMatches = [...filteredMatches].sort((a, b) => a.timestamp - b.timestamp);

    const datasets = [];

    if (selectedPlayer) {
      // Single player evolution
      const data = sortedMatches.map(match => {
        const player = match.giocatori?.find(p => p.nome === selectedPlayer);
        return player ? player.punti : 0;
      });

      datasets.push({
        label: selectedPlayer,
        data: data,
        borderColor: '#667eea',
        backgroundColor: 'rgba(102, 126, 234, 0.1)',
        tension: 0.4,
        fill: true
      });
    } else {
      // Multiple players - show top 5
      const playerScores = {};

      sortedMatches.forEach(match => {
        if (!match.giocatori) return;
        match.giocatori.forEach(player => {
          if (!playerScores[player.nome]) {
            playerScores[player.nome] = [];
          }
          playerScores[player.nome].push(player.punti || 0);
        });
      });

      // Get top 5 players by total score
      const topPlayers = Object.entries(playerScores)
        .map(([name, scores]) => ({
          name,
          total: scores.reduce((a, b) => a + b, 0)
        }))
        .sort((a, b) => b.total - a.total)
        .slice(0, 5);

      const colors = [
        '#667eea', '#f093fb', '#4facfe', '#fa709a', '#43e97b'
      ];

      topPlayers.forEach((player, index) => {
        datasets.push({
          label: player.name,
          data: playerScores[player.name],
          borderColor: colors[index],
          backgroundColor: colors[index] + '20',
          tension: 0.4
        });
      });
    }

    const labels = sortedMatches.map(match => {
      const date = new Date(match.timestamp);
      return date.toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit' });
    });

    charts.scoreEvolution = new Chart(ctx, {
      type: 'line',
      data: {
        labels: labels,
        datasets: datasets
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'top',
          },
          tooltip: {
            mode: 'index',
            intersect: false,
          }
        },
        scales: {
          y: {
            beginAtZero: true
          }
        }
      }
    });
  };

  // Chart 2: Win Rate by Player
  const createWinRateChart = () => {
    const ctx = document.getElementById('win-rate-chart');
    if (!ctx) return;

    // Calculate win rate for each player
    const playerStats = {};

    matchHistory.forEach(match => {
      if (!match.giocatori) return;

      match.giocatori.forEach(player => {
        if (!playerStats[player.nome]) {
          playerStats[player.nome] = { wins: 0, total: 0 };
        }
        playerStats[player.nome].total++;

        if (match.vincitori && match.vincitori.includes(player.nome)) {
          playerStats[player.nome].wins++;
        }
      });
    });

    // Calculate win rates
    const players = Object.keys(playerStats).map(name => ({
      name,
      winRate: (playerStats[name].wins / playerStats[name].total) * 100,
      wins: playerStats[name].wins,
      total: playerStats[name].total
    })).sort((a, b) => b.winRate - a.winRate);

    const labels = players.map(p => p.name);
    const data = players.map(p => p.winRate);

    charts.winRate = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [{
          label: 'Win Rate (%)',
          data: data,
          backgroundColor: 'rgba(102, 126, 234, 0.8)',
          borderColor: '#667eea',
          borderWidth: 2
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false
          },
          tooltip: {
            callbacks: {
              label: function(context) {
                const player = players[context.dataIndex];
                return `${context.parsed.y.toFixed(1)}% (${player.wins}/${player.total})`;
              }
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            max: 100,
            ticks: {
              callback: function(value) {
                return value + '%';
              }
            }
          }
        }
      }
    });
  };

  // Chart 3: Average Score by Player
  const createAverageScoreChart = () => {
    const ctx = document.getElementById('avg-score-chart');
    if (!ctx) return;

    // Calculate average score for each player
    const playerScores = {};

    matchHistory.forEach(match => {
      if (!match.giocatori) return;

      match.giocatori.forEach(player => {
        if (!playerScores[player.nome]) {
          playerScores[player.nome] = { total: 0, count: 0 };
        }
        playerScores[player.nome].total += player.punti || 0;
        playerScores[player.nome].count++;
      });
    });

    const players = Object.keys(playerScores).map(name => ({
      name,
      avgScore: playerScores[name].total / playerScores[name].count
    })).sort((a, b) => b.avgScore - a.avgScore);

    const labels = players.map(p => p.name);
    const data = players.map(p => p.avgScore);

    charts.avgScore = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [{
          label: 'Media Punti',
          data: data,
          backgroundColor: 'rgba(67, 233, 123, 0.8)',
          borderColor: '#43e97b',
          borderWidth: 2
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        indexAxis: 'y',
        plugins: {
          legend: {
            display: false
          }
        },
        scales: {
          x: {
            beginAtZero: true
          }
        }
      }
    });
  };

  // Chart 4: Game Mode Distribution
  const createGameModeChart = () => {
    const ctx = document.getElementById('game-mode-chart');
    if (!ctx) return;

    const filteredMatches = getFilteredMatches();

    // Count game modes
    const modeCounts = {};
    filteredMatches.forEach(match => {
      const mode = match.modalita || 'Sconosciuto';
      modeCounts[mode] = (modeCounts[mode] || 0) + 1;
    });

    const modeLabels = {
      'max': '🎯 Punteggio Massimo',
      'min': '⏱️ Punteggio Minimo',
      'rounds': '🔄 Rounds',
      'darts': '🎯 Darts'
    };

    const labels = Object.keys(modeCounts).map(mode => modeLabels[mode] || mode);
    const data = Object.values(modeCounts);
    const colors = ['#667eea', '#f093fb', '#4facfe', '#fa709a'];

    charts.gameMode = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: labels,
        datasets: [{
          data: data,
          backgroundColor: colors,
          borderWidth: 2,
          borderColor: '#fff'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom'
          }
        }
      }
    });
  };

  // Chart 5: Matches Timeline
  const createMatchesTimelineChart = () => {
    const ctx = document.getElementById('matches-timeline-chart');
    if (!ctx) return;

    const filteredMatches = getFilteredMatches();

    // Group by date
    const dateCounts = {};
    filteredMatches.forEach(match => {
      const date = new Date(match.timestamp);
      const dateKey = date.toLocaleDateString('it-IT');
      dateCounts[dateKey] = (dateCounts[dateKey] || 0) + 1;
    });

    // Sort by date
    const sortedDates = Object.keys(dateCounts).sort((a, b) => {
      const [dayA, monthA, yearA] = a.split('/');
      const [dayB, monthB, yearB] = b.split('/');
      return new Date(yearA, monthA - 1, dayA) - new Date(yearB, monthB - 1, dayB);
    });

    // Take last 30 dates or all if less
    const recentDates = sortedDates.slice(-30);
    const labels = recentDates;
    const data = recentDates.map(date => dateCounts[date]);

    charts.timeline = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [{
          label: 'Partite Giocate',
          data: data,
          backgroundColor: 'rgba(250, 112, 154, 0.8)',
          borderColor: '#fa709a',
          borderWidth: 2
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              stepSize: 1
            }
          },
          x: {
            ticks: {
              maxRotation: 45,
              minRotation: 45
            }
          }
        }
      }
    });
  };

  // ===================================================================
  // 🔧 UTILITIES
  // ===================================================================

  const showNoDataMessage = () => {
    document.getElementById('no-data-message').style.display = 'block';
    document.getElementById('summary-stats').style.display = 'none';
    document.querySelectorAll('.chart-container').forEach(el => {
      el.style.display = 'none';
    });
    document.querySelector('.player-select').style.display = 'none';
  };

  const hideLoader = () => {
    const loader = document.getElementById('loader-overlay');
    if (loader) {
      loader.style.display = 'none';
    }
  };

  // ===================================================================
  // 🧹 CLEANUP
  // ===================================================================

  /**
   * ✅ FIX BUG AUDIT #2: Cleanup method per distruggere chart e liberare memoria
   * Chiamare quando si lascia la pagina statistiche per prevenire memory leaks
   */
  const cleanup = () => {
    Logger.log('[Statistics] Cleanup in corso...');

    // Destroy all charts
    Object.values(charts).forEach(chart => {
      try {
        if (chart && typeof chart.destroy === 'function') {
          chart.destroy();
        }
      } catch (error) {
        Logger.warn('[Statistics] Errore distruzione chart:', error);
      }
    });

    // Clear charts reference
    charts = {};

    // Clear match history
    matchHistory = [];

    // Clear selected player
    selectedPlayer = null;

    Logger.log('[Statistics] ✅ Cleanup completato');
  };

  // ===================================================================
  // 📊 PUBLIC API
  // ===================================================================

  return {
    init,
    cleanup // ✅ FIX BUG AUDIT #2: Esposto cleanup method
  };
})();

// Export globally
window.StatisticsModule = StatisticsModule;
