
import { User, PlanType } from '../types';

const USERS_STORAGE_KEY = 'botanicmd_users_db';

// Mock users for demonstration
const seedUsers: User[] = [
  {
    id: 'user_1',
    name: 'Alice Gardener',
    email: 'alice@example.com',
    plan: 'pro',
    usageCount: 45,
    maxUsage: -1
  },
  {
    id: 'user_2',
    name: 'Bob Planter',
    email: 'bob@example.com',
    plan: 'free',
    usageCount: 2,
    maxUsage: 3
  },
  {
    id: 'user_3',
    name: 'Charlie Green',
    email: 'charlie@example.com',
    plan: 'free',
    usageCount: 3,
    maxUsage: 3
  },
  {
    id: 'user_admin',
    name: 'Admin User',
    email: 'admin@botanicmd.com',
    plan: 'pro',
    usageCount: 0,
    maxUsage: -1
  }
];

class AdminService {
  getUsers(): User[] {
    const stored = localStorage.getItem(USERS_STORAGE_KEY);
    if (!stored) {
      localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(seedUsers));
      return seedUsers;
    }
    return JSON.parse(stored);
  }

  getUser(email: string): User | undefined {
    const users = this.getUsers();
    return users.find(u => u.email === email);
  }

  // Called when a user logs in (syncs or creates)
  syncUser(user: User): User {
    const users = this.getUsers();
    const existingIndex = users.findIndex(u => u.email === user.email);

    if (existingIndex >= 0) {
      // Update last login info or stats if needed, but keep plan
      // Returns the stored user (which has the authoritative plan info)
      return users[existingIndex];
    } else {
      // New user
      users.push(user);
      this.saveUsers(users);
      return user;
    }
  }

  updateUserPlan(userId: string, newPlan: PlanType): User {
    const users = this.getUsers();
    const index = users.findIndex(u => u.id === userId);
    
    if (index === -1) throw new Error("User not found");

    const updatedUser = { 
      ...users[index], 
      plan: newPlan,
      maxUsage: newPlan === 'pro' ? -1 : 3
    };
    
    users[index] = updatedUser;
    this.saveUsers(users);
    return updatedUser;
  }

  deleteUser(userId: string): void {
    const users = this.getUsers();
    const filtered = users.filter(u => u.id !== userId);
    this.saveUsers(filtered);
  }

  private saveUsers(users: User[]) {
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
  }
  
  getStats() {
    const users = this.getUsers();
    return {
      totalUsers: users.length,
      proUsers: users.filter(u => u.plan === 'pro').length,
      freeUsers: users.filter(u => u.plan === 'free').length
    };
  }
}

export const adminService = new AdminService();
