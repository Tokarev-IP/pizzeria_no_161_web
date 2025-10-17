import React from 'react';
import './Header.css';
import logo from '../pizzeria_161-playstore.png';

const Header: React.FC = () => {
  return (
    <header className="app-header" data-header>
      <img src={logo} alt="Pizzeria No161 logo" className="app-header__logo" />
      <h1 className="app-header__title">Pizzeria No 161</h1>
    </header>
  );
};

export default Header;


