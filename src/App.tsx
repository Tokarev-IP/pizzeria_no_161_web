import React from 'react';
import MenuPage from './menu/MenuPage';
import CartIcon from './components/CartIcon';
import { CartProvider } from './context/CartContext';
import { AuthProvider } from './context/AuthContext';
import './App.css';
import Header from './components/Header';
import AuthGuard from './components/AuthGuard';
import MainGuard from './components/MainGuard';

function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <AuthGuard>
          <MainGuard>
            <div className="App">
              <Header />
              <CartIcon />
              <MenuPage />
            </div>
          </MainGuard>
        </AuthGuard>
      </CartProvider>
    </AuthProvider>
  );
}

export default App;
