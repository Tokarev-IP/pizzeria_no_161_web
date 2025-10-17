import React from 'react';
import ReactDOM from 'react-dom';
import { useCart } from '../context/CartContext';
import './PizzaCart.css';

interface PizzaCartProps {
  onClose: () => void;
  onOrder: () => void;
}

const PizzaCart: React.FC<PizzaCartProps> = ({ onClose, onOrder }) => {
  const { cartItems, removeFromCartByIndex, getTotalPrice, getExpandedCartItems } = useCart();
  const total = getTotalPrice();
  
  // Check if there are any available items in cart
  const hasAvailableItems = cartItems.some(item => item.pizza.available);

  // Get expanded list of individual pizza items with indices
  const expandedCartItems = getExpandedCartItems();

  const onBackdropClick: React.MouseEventHandler<HTMLDivElement> = (e) => {
    if (e.target === e.currentTarget) onClose();
  };

  React.useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = originalOverflow; };
  }, []);

  const modal = (
    <div className="cart-backdrop" onClick={onBackdropClick}>
      <div className="cart-modal" role="dialog" aria-modal="true" aria-label="Корзина пиццы">
        <div className="cart-header">
          <h3>Корзина</h3>
          <button className="cart-close" onClick={onClose} aria-label="Закрыть">✕</button>
        </div>
        <div className="cart-body">
          {cartItems.length === 0 ? (
            <div className="cart-empty">Пока пусто</div>
          ) : (
            <ul className="cart-list">
              {expandedCartItems.map(({ pizza, index }) => (
                <li key={index} className={`cart-item ${!pizza.available ? 'cart-item-unavailable' : ''}`}>
                  <div className="cart-item-info">
                    <span className="cart-item-name">
                      {pizza.name}
                      {!pizza.available && <span className="unavailable-badge">Нет в наличии</span>}
                    </span>
                    <span className="cart-item-price">{pizza.price.toFixed(2)} ₽</span>
                  </div>
                  <div className="cart-item-actions">
                    <button 
                      className="remove-btn" 
                      onClick={() => removeFromCartByIndex(index)} 
                      aria-label="Удалить из корзины"
                    >
                      🗑️
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="cart-footer">
          <div className="cart-total">
            <span>Сумма</span>
            <strong>{total.toFixed(2)} ₽</strong>
          </div>
          <button 
            className="order-btn" 
            disabled={cartItems.length === 0 || !hasAvailableItems} 
            onClick={onOrder}
          >
            {!hasAvailableItems && cartItems.length > 0 ? 'Нет доступных товаров' : 'Оформить заказ'}
          </button>
        </div>
      </div>
    </div>
  );

  const portalRoot = document.body;
  return ReactDOM.createPortal(modal, portalRoot);
};

export default PizzaCart;


