import React from 'react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import './CartIcon.css';
import PizzaCart from './PizzaCart';
import OrderSubmit from './OrderSubmit';

const CartIcon: React.FC = () => {
  const { getTotalItems, getTotalPrice } = useCart();
  const { user } = useAuth();
  const totalItems = getTotalItems();
  const totalPrice = getTotalPrice();

  const [isOpen, setIsOpen] = React.useState(false);
  const [isOrderOpen, setIsOrderOpen] = React.useState(false);

  const toggleOpen = () => setIsOpen(prev => !prev);
  const openOrder = () => {
    setIsOpen(false);
    setIsOrderOpen(true);
  };

  return (
    <div className="cart-icon-container">
      {user && (
        <>
          <div className="cart-icon" onClick={toggleOpen} role="button" aria-label="Открыть корзину" tabIndex={0} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleOpen(); }}}>
            <span className="cart-emoji">🛒</span>
            {totalItems > 0 && (
              <span className="cart-badge">
                {totalItems > 99 ? '99+' : totalItems}
              </span>
            )}
          </div>
          {totalItems > 0 && (
            <div className="cart-price">
              {totalPrice.toFixed(2)} ₽
            </div>
          )}
        </>
      )}
      {isOpen && <PizzaCart onClose={toggleOpen} onOrder={openOrder} />}
      {isOrderOpen && <OrderSubmit onClose={() => setIsOrderOpen(false)} />}
    </div>
  );
};

export default CartIcon;
