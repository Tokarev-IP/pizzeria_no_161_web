import { useState, useEffect } from 'react';
import { FirebaseOvenData } from '../firebase/FirebaseData';
import { getOvenData } from '../firebase/FirebaseFirestore';
import { useAuth } from '../context/AuthContext';

interface OvenUseCaseReturn {
  ovenData: FirebaseOvenData;
  loading: boolean;
  error: string | null;
  refreshOvenData: () => void;
  refreshOvenDataFromServer: () => void;
}

export const useOvenUseCase = (): OvenUseCaseReturn => {
  const [ovenData, setOvenData] = useState<FirebaseOvenData>({ hot: false });
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const { user, loading: authLoading } = useAuth();

  const fetchOvenData = async () => {
    try {
      console.log('🔄 Starting fetchOvenData...');
      setLoading(true);
      setError(null);
      
      // Fetch oven data from Firestore
      console.log('📡 Calling getOvenData()...');
      const data = await getOvenData();
      console.log('📦 Received oven data:', data);
      
      setOvenData(data);
      console.log('✅ Oven data set in state:', data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load oven data';
      console.error('❌ Error fetching oven data from Firestore:', err);
      setError(errorMessage);
      
      // Set default values on error to prevent UI issues
      setOvenData({ hot: false });
    } finally {
      setLoading(false);
      console.log('🏁 fetchOvenData completed');
    }
  };

  const refreshOvenData = () => {
    fetchOvenData();
  };

  const refreshOvenDataFromServer = () => {
    fetchOvenDataFromServer();
  };

  const fetchOvenDataFromServer = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch oven data from Firestore server (bypass cache)
      const data = await getOvenData(false);
      setOvenData(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load oven data';
      setError(errorMessage);
      console.error('Error fetching oven data from Firestore server:', err);
      
      // Set default values on error to prevent UI issues
      setOvenData({ hot: false });
    } finally {
      setLoading(false);
    }
  };

  // Only fetch oven data when user is authenticated (including anonymous)
  useEffect(() => {
    if (!authLoading && user) {
      console.log('User authenticated, fetching oven data...', { 
        userId: user.uid, 
        isAnonymous: user.isAnonymous 
      });
      fetchOvenData();
    } else if (!authLoading && !user) {
      console.log('No user authenticated, waiting for authentication...');
      setLoading(false);
    }
  }, [user, authLoading]);

  return {
    ovenData,
    loading,
    error,
    refreshOvenData,
    refreshOvenDataFromServer
  };
};

