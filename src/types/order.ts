export type OrderStatus = 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';

export interface OrderItem {
  // Backend sometimes returns nested ids; frontend only needs name, price, quantity and optional image
  name?: string;
  price: number;
  quantity: number;
  image?: string;
  // keep original ids if present
  stockEntryId?: string | { $oid?: string };
  productId?: string | { $oid?: string };
}

export interface ShippingAddress {
  fullName?: string;
  phone?: string;
  address?: string;
  city?: string;
  district?: string;
  ward?: string;
}

export interface OrderUser {
  _id?: string | { $oid?: string };
  userName?: string;
  email?: string;
}

export interface Order {
  id: string;
  _id?: string;
  orderNumber: string;
  user: {
    _id: string;
    userName: string;
    email: string;
  };
  items: OrderItem[];
  subtotal: number;
  shippingCost: number;
  totalAmount: number;
  orderStatus: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'received' | 'cancelled';
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded';
  createdAt: string;
  updatedAt: string;
}

export interface OrdersResponse {
  success: boolean;
  data: Order[];
  pagination?: {
    currentPage: number;
    totalPages: number;
    totalOrders: number;
    itemsPerPage: number;
  };
}
