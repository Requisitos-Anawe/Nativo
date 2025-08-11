import { useEffect, useState } from 'react';
import BottomTabs from './src/navigation/BottomTabs';
import { NavigationContainer } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Login from './src/screens/Login';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const checkToken = async () => {
      const token = await AsyncStorage.getItem('token');
      setIsAuthenticated(!!token);
    };

    checkToken();
  }, []);

  if (isAuthenticated === null) {
    return null;
  }
  console.log('isAuthenticated: ',isAuthenticated);

  return (
    <NavigationContainer>
      {isAuthenticated ? <BottomTabs /> : <Login onLoginSuccess={() => setIsAuthenticated(true)} />}
    </NavigationContainer>
  );
}

export default App;
