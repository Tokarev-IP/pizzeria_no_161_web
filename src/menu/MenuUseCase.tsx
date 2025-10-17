import { useState, useEffect } from 'react';
import { FirebasePizzaData } from '../firebase/FirebaseData';
import { getPizzaData, testFirestoreConnection } from '../firebase/FirebaseFirestore';
import { useAuth } from '../context/AuthContext';

interface MenuUseCaseReturn {
  pizzas: FirebasePizzaData[];
  loading: boolean;
  error: string | null;
  refreshMenu: () => void;
  refreshMenuFromServer: () => void;
}

export const useMenuUseCase = (): MenuUseCaseReturn => {
  const [pizzas, setPizzas] = useState<FirebasePizzaData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const { user, loading: authLoading } = useAuth();


  const fetchPizzas = async () => {
    try {
      console.log('🔄 Starting fetchPizzas...');
      setLoading(true);
      setError(null);
      
      // First test the connection
      console.log('🧪 Testing Firestore connection...');
      await testFirestoreConnection();
      
      // Fetch pizza data from Firestore
      console.log('📡 Calling getPizzaData()...');
      const pizzasData = await getPizzaData();
      console.log('📦 Received pizza data:', pizzasData);
      
      setPizzas(pizzasData);
      console.log('✅ Pizza data set in state:', pizzasData.length, 'pizzas');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load menu';
      console.error('❌ Error fetching pizzas from Firestore:', err);
      setError(errorMessage);
      
      // Set empty array on error to prevent UI issues
      setPizzas([]);
    } finally {
      setLoading(false);
      console.log('🏁 fetchPizzas completed');
    }
  };


  const refreshMenu = () => {
    fetchPizzas();
  };

  const refreshMenuFromServer = () => {
    fetchPizzasFromServer();
  };

  const fetchPizzasFromServer = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch pizza data from Firestore server (bypass cache)
      const pizzasData = await getPizzaData(false);
      setPizzas(pizzasData);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load menu';
      setError(errorMessage);
      console.error('Error fetching pizzas from Firestore server:', err);
      
      // Set empty array on error to prevent UI issues
      setPizzas([]);
    } finally {
      setLoading(false);
    }
  };

  // Only fetch pizzas when user is authenticated (including anonymous)
  useEffect(() => {
    if (!authLoading && user) {
      console.log('User authenticated, fetching pizza data...', { 
        userId: user.uid, 
        isAnonymous: user.isAnonymous 
      });
      fetchPizzas();
    } else if (!authLoading && !user) {
      console.log('No user authenticated, waiting for authentication...');
      setLoading(false);
    }
  }, [user, authLoading]);

  return {
    pizzas,
    loading,
    error,
    refreshMenu,
    refreshMenuFromServer
  };
};
