// Serviço para gerenciar lembretes de plantas
export interface Reminder {
  id: string;
  plantId?: string;
  plantName: string;
  type: 'watering' | 'fertilizing' | 'pruning' | 'checkup' | 'custom';
  title: string;
  description?: string;
  date: number; // Timestamp da data/hora do lembrete
  frequency?: 'once' | 'daily' | 'weekly' | 'monthly';
  isCompleted: boolean;
  createdAt: number;
}

class ReminderService {
  private readonly STORAGE_KEY = 'botanicmd_reminders';

  getReminders(): Reminder[] {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        const reminders = JSON.parse(stored);
        // Ordena por data (próximos primeiro)
        return reminders.sort((a: Reminder, b: Reminder) => a.date - b.date);
      }
      return [];
    } catch (error) {
      console.error('Erro ao carregar lembretes:', error);
      return [];
    }
  }

  getUpcomingReminders(limit: number = 10): Reminder[] {
    const now = Date.now();
    return this.getReminders()
      .filter(r => !r.isCompleted && r.date >= now)
      .slice(0, limit);
  }

  addReminder(reminder: Omit<Reminder, 'id' | 'createdAt' | 'isCompleted'>): Reminder {
    const newReminder: Reminder = {
      ...reminder,
      id: crypto.randomUUID(),
      createdAt: Date.now(),
      isCompleted: false,
    };

    const reminders = this.getReminders();
    reminders.push(newReminder);
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(reminders));
    return newReminder;
  }

  updateReminder(id: string, updates: Partial<Reminder>): Reminder | null {
    const reminders = this.getReminders();
    const index = reminders.findIndex(r => r.id === id);
    
    if (index === -1) return null;

    reminders[index] = { ...reminders[index], ...updates };
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(reminders));
    return reminders[index];
  }

  deleteReminder(id: string): void {
    const reminders = this.getReminders();
    const updated = reminders.filter(r => r.id !== id);
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(updated));
  }

  completeReminder(id: string): void {
    this.updateReminder(id, { isCompleted: true });
  }
}

export const reminderService = new ReminderService();

