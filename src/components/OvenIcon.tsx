import React from 'react';
import ReactDOM from 'react-dom';
import { useOvenUseCase } from '../menu/OvenUseCase';
import './OvenIcon.css';
import hotOvenImage from '../hot_oven_very_small.png';
import coldOvenImage from '../oven_cold_very_small.png';

const OvenIcon: React.FC = () => {
  const { ovenData } = useOvenUseCase();
  const [isOpen, setIsOpen] = React.useState(false);

  const toggleOpen = () => setIsOpen(prev => !prev);

  const handleBackdropClick: React.MouseEventHandler<HTMLDivElement> = (e) => {
    if (e.target === e.currentTarget) setIsOpen(false);
  };

  React.useEffect(() => {
    if (isOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => { document.body.style.overflow = originalOverflow; };
    }
  }, [isOpen]);

  const portalRoot = document.body;

  return (
    <>
      <div className="oven-icon-container">
        <div 
          className="oven-icon" 
          onClick={toggleOpen} 
          role="button" 
          aria-label="Показать состояние печи" 
          tabIndex={0} 
          onKeyDown={(e) => { 
            if (e.key === 'Enter' || e.key === ' ') { 
              e.preventDefault(); 
              toggleOpen(); 
            } 
          }}
        >
          <img 
            src={ovenData.hot ? hotOvenImage : coldOvenImage} 
            alt={ovenData.hot ? 'Горячая печь' : 'Холодная печь'} 
            className="oven-image"
          />
        </div>
      </div>
      {isOpen && ReactDOM.createPortal(
        <div className="oven-backdrop" onClick={handleBackdropClick}>
          <div className="oven-modal" role="dialog" aria-modal="true" aria-label="Состояние печи">
            <div className="oven-modal-header">
              <h3>Состояние печи</h3>
              <button className="oven-close" onClick={() => setIsOpen(false)} aria-label="Закрыть">✕</button>
            </div>
            <div className="oven-modal-body">
              <div className="oven-status">
                <img 
                  src={ovenData.hot ? hotOvenImage : coldOvenImage} 
                  alt={ovenData.hot ? 'Горячая печь' : 'Холодная печь'} 
                  className="oven-status-image"
                />
                <p className="oven-status-text">
                  {ovenData.hot 
                    ? 'Печь сейчас раскаленная — делайте заказ!'
                    : 'Печь сейчас холодная, заказ доступен только на завтра'}
                </p>
              </div>
            </div>
          </div>
        </div>,
        portalRoot
      )}
    </>
  );
};

export default OvenIcon;
