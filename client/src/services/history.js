// New file: client/src/services/history.js

const HISTORY_KEY = 'nexus_problem_history';
const FAVORITES_KEY = 'nexus_favorites';

export function saveToHistory(problem, analysis, solutions, selectedSolution, blueprint) {
  try {
    const history = getHistory();
    const entry = {
      id: Date.now(),
      timestamp: new Date().toISOString(),
      problem,
      analysis,
      solutions,
      selectedSolution,
      blueprint,
      favorite: false
    };
    
    // Add to beginning (latest first)
    history.unshift(entry);
    
    // Keep only last 50 entries
    if (history.length > 50) {
      history.pop();
    }
    
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
    return entry;
  } catch (error) {
    console.error('Failed to save to history:', error);
    return null;
  }
}

export function getHistory() {
  try {
    const data = localStorage.getItem(HISTORY_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Failed to get history:', error);
    return [];
  }
}

export function deleteHistoryEntry(id) {
  try {
    const history = getHistory();
    const filtered = history.filter(entry => entry.id !== id);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(filtered));
    return true;
  } catch (error) {
    console.error('Failed to delete history entry:', error);
    return false;
  }
}

export function clearHistory() {
  try {
    localStorage.removeItem(HISTORY_KEY);
    return true;
  } catch (error) {
    console.error('Failed to clear history:', error);
    return false;
  }
}

// Favorites functions
export function toggleFavorite(id) {
  try {
    const history = getHistory();
    const entry = history.find(e => e.id === id);
    if (entry) {
      entry.favorite = !entry.favorite;
      localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
      return entry.favorite;
    }
    return false;
  } catch (error) {
    console.error('Failed to toggle favorite:', error);
    return false;
  }
}

export function getFavorites() {
  try {
    const history = getHistory();
    return history.filter(entry => entry.favorite);
  } catch (error) {
    console.error('Failed to get favorites:', error);
    return [];
  }
}