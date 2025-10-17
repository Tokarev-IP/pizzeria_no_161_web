import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { getMainOpenStatus } from '../firebase/FirebaseFirestore';
import relaxImg from '../Pizza_relax_1.png';

interface MainGuardProps {
  children: React.ReactNode;
}

const MainGuard: React.FC<MainGuardProps> = ({ children }) => {
  const { user, loading: authLoading, error: authError } = useAuth();
  const [loading, setLoading] = useState<boolean>(true);
  const [isOpen, setIsOpen] = useState<boolean>(true);

  useEffect(() => {
    const fetchMain = async () => {
      if (authLoading || !user || authError) {
        return;
      }
      setLoading(true);
      try {
        const open = await getMainOpenStatus();
        setIsOpen(open);
      } finally {
        setLoading(false);
      }
    };
    fetchMain();
  }, [authLoading, user, authError]);

  if (authLoading || loading) {
    return (
      <div className="auth-loading-container">
        <div className="auth-loading-spinner"></div>
        <p>Загрузка...</p>
      </div>
    );
  }

  if (!isOpen) {
    return (
      <div className="auth-error-container main-closed-simple" style={{ textAlign: 'center' }}>
        <div className="main-closed-simple-center">
          <h3>Сегодня мы отдыхаем</h3>
          <img src={relaxImg} alt="Сегодня мы отдыхаем" />
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default MainGuard;


