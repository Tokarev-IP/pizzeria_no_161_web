import React, { createContext, useContext, useState, ReactNode } from 'react';
import { FirebasePizzaData, FirebaseOrderData, createInitialOrderData } from '../firebase/FirebaseData';

export interface CartItem {
  pizza: FirebasePizzaData;
  quantity: number;
}

export interface CartPizzaItem {
  pizza: FirebasePizzaData;
  index: number;
}

interface CartContextType {
  cartItems: CartItem[];
  addToCart: (pizza: FirebasePizzaData) => void;
  removeFromCart: (pizzaId: string) => void;
  removeFromCartByIndex: (index: number) => void;
  updateQuantity: (pizzaId: string, quantity: number) => void;
  clearCart: () => void;
  getTotalItems: () => number;
  getTotalPrice: () => number;
  getExpandedCartItems: () => CartPizzaItem[];
  getOrderData: () => FirebaseOrderData;
  getPizzaNames: () => string[];
  isCartFull: () => boolean;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

interface CartProviderProps {
  children: ReactNode;
}

export const CartProvider: React.FC<CartProviderProps> = ({ children }) => {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);

  // Build expanded list of single pizza items sorted alphabetically by name.
  // This function is used both for rendering and index-based removal to keep indices consistent.
  const buildExpandedItemsSorted = (items: CartItem[]): CartPizzaItem[] => {
    const expanded: { pizza: FirebasePizzaData }[] = [];
    items.forEach(item => {
      for (let i = 0; i < item.quantity; i++) {
        expanded.push({ pizza: item.pizza });
      }
    });
    expanded.sort((a, b) => a.pizza.name.localeCompare(b.pizza.name, 'ru', { sensitivity: 'base' }));
    return expanded.map((entry, idx) => ({ pizza: entry.pizza, index: idx }));
  };

  const addToCart = (pizza: FirebasePizzaData) => {
    // Don't add unavailable pizzas to cart
    if (!pizza.available) {
      return;
    }
    
    setCartItems(prevItems => {
      // Check total items in cart (limit to 10 pizzas total)
      const totalItems = prevItems.reduce((total, item) => total + item.quantity, 0);
      if (totalItems >= 10) {
        return prevItems; // Don't add more if cart is full
      }
      
      const existingItem = prevItems.find(item => item.pizza.id === pizza.id);
      
      if (existingItem) {
        return prevItems.map(item =>
          item.pizza.id === pizza.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      } else {
        return [...prevItems, { pizza, quantity: 1 }];
      }
    });
  };

  const removeFromCart = (pizzaId: string) => {
    setCartItems(prevItems => prevItems.filter(item => item.pizza.id !== pizzaId));
  };

  const removeFromCartByIndex = (index: number) => {
    setCartItems(prevItems => {
      const expandedItems: CartPizzaItem[] = buildExpandedItemsSorted(prevItems);

      if (index >= 0 && index < expandedItems.length) {
        const itemToRemove = expandedItems[index];
        
        // Find the cart item and decrease its quantity
        return prevItems.map(cartItem => {
          if (cartItem.pizza.id === itemToRemove.pizza.id) {
            const newQuantity = cartItem.quantity - 1;
            return newQuantity > 0 ? { ...cartItem, quantity: newQuantity } : null;
          }
          return cartItem;
        }).filter(Boolean) as CartItem[];
      }
      
      return prevItems;
    });
  };

  const updateQuantity = (pizzaId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(pizzaId);
      return;
    }

    setCartItems(prevItems => {
      // Check if the new quantity would exceed the total limit of 10 pizzas
      const currentTotal = prevItems.reduce((total, item) => total + item.quantity, 0);
      const currentItemQuantity = prevItems.find(item => item.pizza.id === pizzaId)?.quantity || 0;
      const newTotal = currentTotal - currentItemQuantity + quantity;
      
      if (newTotal > 10) {
        // Don't update if it would exceed the limit
        return prevItems;
      }

      return prevItems.map(item =>
        item.pizza.id === pizzaId
          ? { ...item, quantity }
          : item
      );
    });
  };

  const clearCart = () => {
    setCartItems([]);
  };

  const getTotalItems = () => {
    return cartItems.reduce((total, item) => total + item.quantity, 0);
  };

  const getTotalPrice = () => {
    return cartItems.reduce((total, item) => total + (item.pizza.price * item.quantity), 0);
  };

  const getExpandedCartItems = (): CartPizzaItem[] => {
    return buildExpandedItemsSorted(cartItems);
  };

  const getPizzaNames = () => {
    const names: string[] = [];
    cartItems.forEach(item => {
      for (let i = 0; i < item.quantity; i++) {
        names.push(item.pizza.name);
      }
    });
    names.sort((a, b) => a.localeCompare(b, 'ru', { sensitivity: 'base' }));
    return names;
  };

  const isCartFull = () => {
    return getTotalItems() >= 10;
  };

  const getOrderData = (): FirebaseOrderData => {
    const orderData = createInitialOrderData();
    
    // Filter out unavailable pizzas for order
    const availableItems = cartItems.filter(item => item.pizza.available);
    
    // Update order data with available cart information
    orderData.sum = availableItems.reduce((total, item) => total + (item.pizza.price * item.quantity), 0);
    orderData.pizzaList = [];
    availableItems.forEach(item => {
      for (let i = 0; i < item.quantity; i++) {
        orderData.pizzaList.push(item.pizza.name);
      }
    });
    // Sort pizza names alphabetically for storage/email
    orderData.pizzaList.sort((a, b) => a.localeCompare(b, 'ru', { sensitivity: 'base' }));
    orderData.time = Date.now();
    
    return orderData;
  };

  const value: CartContextType = {
    cartItems,
    addToCart,
    removeFromCart,
    removeFromCartByIndex,
    updateQuantity,
    clearCart,
    getTotalItems,
    getTotalPrice,
    getExpandedCartItems,
    getOrderData,
    getPizzaNames,
    isCartFull,
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = (): CartContextType => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
