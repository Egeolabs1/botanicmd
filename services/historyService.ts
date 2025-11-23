// Serviço para gerenciar histórico de análises
export interface HistoryEntry {
  id: string;
  plantName: string;
  scientificName?: string;
  date: number;
  type: 'image' | 'text';
  result?: 'success' | 'error';
}

class HistoryService {
  private readonly STORAGE_KEY = 'botanicmd_history';
  private readonly MAX_HISTORY = 100; // Limita a 100 entradas

  getHistory(): HistoryEntry[] {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        const history = JSON.parse(stored);
        // Ordena por data (mais recente primeiro)
        return history.sort((a: HistoryEntry, b: HistoryEntry) => b.date - a.date);
      }
      return [];
    } catch (error) {
      console.error('Erro ao carregar histórico:', error);
      return [];
    }
  }

  addEntry(entry: Omit<HistoryEntry, 'id' | 'date'>): HistoryEntry {
    const newEntry: HistoryEntry = {
      ...entry,
      id: crypto.randomUUID(),
      date: Date.now(),
    };

    const history = this.getHistory();
    // Adiciona no início e limita o tamanho
    const updated = [newEntry, ...history].slice(0, this.MAX_HISTORY);
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(updated));
    return newEntry;
  }

  clearHistory(): void {
    localStorage.removeItem(this.STORAGE_KEY);
  }

  deleteEntry(id: string): void {
    const history = this.getHistory();
    const updated = history.filter((entry: HistoryEntry) => entry.id !== id);
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(updated));
  }
}

export const historyService = new HistoryService();

