import React, { createContext, useContext, useState, ReactNode } from 'react';

export interface Product {
  id: string | number;
  name: string;
  price: number;
  unitPrice?: number; // Unit price for products
  originalPrice?: number;
  image: string;
  category: string;
  description: string;
  rating: number;
  reviews: number;
  inStock: boolean;
  prescription?: boolean;
  ingredients?: string;
  dosage?: string;
  sideEffects?: string;
  manufacturer?: string;
  // Additional product-specific fields
  soDangKy?: string;
  dangBaoChe?: string;
  dongGoi?: string;
  hanSuDung?: string;
  quocGia?: string;
  linkChiTiet?: string;
main_category?: string;
  sub_category?: string;
  giaThuoc?: Array<{
    ngayKeKhai: string;
    donViKeKhai: string;
    dongGoi: string;
    giaKeKhai: string;
    donViTinh: string;
  }>;

  packaging?: string;
  packagingOptions?: Array<{
    description: string;
    quantity: number;
    totalPrice: number;
    unitPrice: number;
  }>;
}

export interface CartItem extends Product {
  stockEntryId: string; 
  quantity: number;
  priceDisplay?: string;
  ordered?: boolean;
}

interface CartContextType {
  cart: CartItem[];
  addToCart: (product: Product & { stockEntryId: string }) => void; // 🔑 sửa ở đây
  updateQuantity: (id: string | number, stockEntryId: string, change: number) => void; // thêm stockEntryId
  removeFromCart: (id: string | number, stockEntryId: string) => void; // thêm stockEntryId
  getTotalPrice: () => number;
  getTotalItems: () => number;
  clearCart: () => void;
  markItemsOrdered: (itemIds: { id: string | number; stockEntryId: string }[]) => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

export const CartProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [cart, setCart] = useState<CartItem[]>([]);

  const addToCart = (product: Product & { stockEntryId: string }) => {
      setCart(prev => {
        const existing = prev.find(item => item.id === product.id && item.stockEntryId === product.stockEntryId);
        if (existing) {
          return prev.map(item =>
            item.id === product.id && item.stockEntryId === product.stockEntryId
              ? { ...item, quantity: item.quantity + 1 }
              : item
          );
        }
        return [...prev, { ...product, quantity: 1 }];
      });
    };

  const updateQuantity = (id: string | number, stockEntryId: string, change: number) => {
    setCart(prev => {
      return prev.map(item => {
        if (item.id === id && item.stockEntryId === stockEntryId) {
          const newQuantity = item.quantity + change;
          return newQuantity <= 0 ? null : { ...item, quantity: newQuantity };
        }
        return item;
      }).filter(Boolean) as CartItem[];
    });
  };

  const removeFromCart = (id: string | number, stockEntryId: string) => {
    setCart(prev => prev.filter(item => !(item.id === id && item.stockEntryId === stockEntryId)));
  };

  const getTotalPrice = () => {
    return cart.reduce((total, item) => {
      const price = parseFloat(item.priceDisplay?.replace(/[^\d.]/g, '') || item.price.toString());
      return total + price * item.quantity;
    }, 0);
  };

  const getTotalItems = () => {
    return cart.reduce((total, item) => total + item.quantity, 0);
  };
  const markItemsOrdered = (itemIds: { id: string | number; stockEntryId: string }[]) => {
    setCart(prev =>
      prev.map(item => {
        const match = itemIds.find(i => i.id === item.id && i.stockEntryId === item.stockEntryId);
        return match ? { ...item, ordered: true } : item;
      })
    );
  };

  const clearCart = () => {
    setCart([]);
  };

  return (
    <CartContext.Provider value={{
      cart,
      addToCart,
      updateQuantity,
      removeFromCart,
      getTotalPrice,
      getTotalItems,
      markItemsOrdered, 
      clearCart
    }}>
      {children}
    </CartContext.Provider>
  );
};