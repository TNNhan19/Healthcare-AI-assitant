import axios from 'axios';
import { StockEntry } from '../types/stock';

const CORE_API_BASE = (import.meta as any).env?.VITE_API_BASE_URL || 'http://localhost:8080';
const API_BASE_URL = `${CORE_API_BASE}/api/v1`;

class StockService {
  async getStockEntries(productId?: string): Promise<StockEntry[]> {
    const response = await axios.get(`${API_BASE_URL}/stock`, { params: { productId } });
    return response.data.data;
  }

  async createStockEntry(entry: Omit<StockEntry, 'id' | 'createdAt' | 'updatedAt'>): Promise<StockEntry> {
    const response = await axios.post(`${API_BASE_URL}/stock`, entry);
    return response.data;
  }

  async updateStockEntry(id: string, updates: Partial<StockEntry>): Promise<StockEntry> {
    const response = await axios.put(`${API_BASE_URL}/stock/${id}`, updates);
    return response.data;
  }
}

export const stockService = new StockService();
