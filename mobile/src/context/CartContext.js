import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import api from '../api';
import { useAuth } from './AuthContext';

const CartContext = createContext(null);
const EMPTY = { items: [], count: 0, total: 0 };

export function CartProvider({ children }) {
  const { user } = useAuth();
  const [cart, setCart] = useState(EMPTY);
  const [loading, setLoading] = useState(false);

  const loadCart = useCallback(async () => {
    if (!user) {
      setCart(EMPTY);
      return;
    }
    setLoading(true);
    try {
      const { data } = await api.get('/cart');
      setCart(data);
    } catch {
      /* keep previous state */
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadCart();
  }, [loadCart]);

  const addItem = useCallback(
    async (productId, quantity = 1) => {
      await api.post('/cart', { productId, quantity });
      await loadCart();
    },
    [loadCart]
  );

  const updateQty = useCallback(
    async (cartId, quantity) => {
      await api.patch(`/cart/${cartId}`, { quantity });
      await loadCart();
    },
    [loadCart]
  );

  const removeItem = useCallback(
    async (cartId) => {
      await api.delete(`/cart/${cartId}`);
      await loadCart();
    },
    [loadCart]
  );

  const clearLocal = useCallback(() => setCart(EMPTY), []);

  return (
    <CartContext.Provider
      value={{ cart, loading, addItem, updateQty, removeItem, loadCart, clearLocal }}
    >
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
};
