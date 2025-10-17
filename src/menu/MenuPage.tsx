import React from 'react';
import MenuView from './MenuView';
import AuthGuard from '../components/AuthGuard';
import { useMenuUseCase } from './MenuUseCase';

const MenuPage: React.FC = () => {
  const { pizzas, loading, error, refreshMenu, refreshMenuFromServer } = useMenuUseCase();

  return (
    <AuthGuard>
      <div className="menu-page">
        <MenuView 
          pizzas={pizzas}
          loading={loading}
          error={error}
          onRefreshFromServer={refreshMenuFromServer}
        />
      </div>
    </AuthGuard>
  );
};

export default MenuPage;
