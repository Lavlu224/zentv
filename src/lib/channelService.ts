export interface Channel {
  id: string;
  name: string;
  description: string;
  logo: string;
  category: string;
  isLive: boolean;
  viewers: string;
  streamUrl: string;
  language: string;
  country: string;
  quality: string;
  schedule?: Program[];
}

export interface Program {
  id: string;
  title: string;
  startTime: string;
  endTime: string;
  description: string;
  category: string;
}

const API_BASE = '/api';

class ChannelService {
  async fetchChannels(): Promise<Channel[]> {
    try {
      const res = await fetch(`${API_BASE}/channels`, { cache: 'no-store' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      return data.channels || [];
    } catch (err) {
      console.error('Error fetching channels:', err);
      return [];
    }
  }

  async fetchChannelById(id: string): Promise<Channel | null> {
    try {
      const channels = await this.fetchChannels();
      return channels.find(ch => ch.id === id) || null;
    } catch {
      return null;
    }
  }

  async searchChannels(query: string): Promise<Channel[]> {
    try {
      const channels = await this.fetchChannels();
      const q = query.toLowerCase();
      return channels.filter(ch =>
        ch.name.toLowerCase().includes(q) ||
        ch.category.toLowerCase().includes(q) ||
        ch.description.toLowerCase().includes(q)
      );
    } catch {
      return [];
    }
  }

  async getChannelsByCategory(category: string): Promise<Channel[]> {
    try {
      const channels = await this.fetchChannels();
      return channels.filter(ch => ch.category.toLowerCase() === category.toLowerCase());
    } catch {
      return [];
    }
  }

  async getCategories(): Promise<string[]> {
    try {
      const res = await fetch('/api/categories');
      const data = await res.json();
      return data.categories || [];
    } catch {
      return [];
    }
  }

  async getLivePrograms(): Promise<Program[]> {
    try {
      const channels = await this.fetchChannels();
      const programs: Program[] = [];
      for (const ch of channels) {
        if (ch.schedule) {
          programs.push(...ch.schedule);
        }
      }
      return programs;
    } catch {
      return [];
    }
  }
}

export const channelService = new ChannelService();
