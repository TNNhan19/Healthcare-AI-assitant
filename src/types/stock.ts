export interface StockEntry {
  id: string;
  productId: string;
  batchNumber: string;
  expiryDate: string; // ISO string từ backend
  quantity: number;
  location?: string;
  createdAt?: string;
  updatedAt?: string;
}
