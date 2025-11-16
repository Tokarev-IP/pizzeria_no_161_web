import React from 'react';
import { FirebasePizzaData } from '../firebase/FirebaseData';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import './MenuView.css';
import InfoBanner from '../components/InfoBanner';

interface MenuViewProps {
  pizzas: FirebasePizzaData[];
  loading: boolean;
  error: string | null;
  onRefreshFromServer?: () => void;
}

const MenuView: React.FC<MenuViewProps> = ({ 
  pizzas, 
  loading, 
  error, 
  onRefreshFromServer 
}) => {
  const { addToCart, isCartFull } = useCart();
  const { user } = useAuth();
  if (loading) {
    return (
      <div className="menu-container">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Загружаем наше вкусное меню...</p>
          <p className="loading-subtext">
            {user ? 'Получаем свежие данные о пицце...' : 'Подготавливаем ваш опыт...'}
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="menu-container">
        <div className="error-container">
          <div className="error-icon">⚠️</div>
          <h3>Упс! Что-то пошло не так</h3>
          <p>{error}</p>
          <button 
            className="retry-button" 
            onClick={onRefreshFromServer || (() => window.location.reload())}
          >
            Попробовать снова
          </button>
          <p className="error-help-text">
            Если проблема сохраняется, проверьте подключение к интернету или попробуйте позже.
          </p>
        </div>
      </div>
    );
  }

  if (pizzas.length === 0) {
    return (
      <div className="menu-container">
        <div className="empty-container">
          <div className="empty-icon">🍕</div>
          <h3>Пицца недоступна</h3>
          <p>Заходите позже за нашим вкусным меню!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="menu-container">
      <InfoBanner>
        <div className="info-banner-title">Ciao a tutti! Mi chiamo Paolo!</div>
        <div className="info-banner-body">
        Пицца — это моё хобби и то, чем я готов делиться с любителями хрустящей пиццы из помпейской печи. Здесь вы можете заказать аутентичную пиццу 40 см, которую я приготовлю при 350 °C — при вас и для вас 😀. Для оформления процесса нужно создать предварительный заказ, и если я смогу его выполнить, вы сможете забрать пиццу в согласованное время.
        </div>
      </InfoBanner>
      
      <div className="menu-grid">
        {pizzas.map((pizza) => (
          <div key={pizza.id} className={`pizza-card ${!pizza.available ? 'pizza-unavailable' : ''}`}>
            <div className="pizza-image-container">
              {pizza.photoUri ? (
                <img 
                  src={pizza.photoUri} 
                  alt={pizza.name}
                  className="pizza-image"
                  loading="lazy"
                />
              ) : (
                <div className="pizza-placeholder">
                  <span className="pizza-emoji">🍕</span>
                </div>
              )}
              {!pizza.available && (
                <div className="unavailable-overlay">
                  <span className="unavailable-text">Нет в наличии</span>
                </div>
              )}
            </div>
            
            <div className="pizza-info">
              <h3 className="pizza-name">{pizza.name}</h3>
              <p className="pizza-description">{pizza.description}</p>
              <div className="pizza-footer">
                <span className="pizza-price">{pizza.price.toFixed(0)} ₽</span>
                {user && (
                  <button 
                    className={`add-button ${!pizza.available || isCartFull() ? 'add-button-disabled' : ''}`}
                    onClick={() => pizza.available && !isCartFull() && addToCart(pizza)}
                    disabled={!pizza.available || isCartFull()}
                    aria-label={
                      !pizza.available 
                        ? `${pizza.name} недоступна` 
                        : isCartFull() 
                        ? 'Корзина полна (максимум 10 пицц)' 
                        : `Добавить ${pizza.name} в корзину`
                    }
                  >
                    {!pizza.available 
                      ? 'Недоступно' 
                      : isCartFull() 
                      ? 'Корзина полна' 
                      : 'Добавить'
                    }
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MenuView;
