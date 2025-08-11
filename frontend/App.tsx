import { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Login from './src/screens/Login';
import MenuModal from './src/components/MenuModal';
import AppNavigator from './src/navigation/AppNavigator';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);

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

  return (
    <NavigationContainer>
      {isAuthenticated ? (
        <>
          <AppNavigator onMenuPress={() => setMenuVisible(true)} />
          <MenuModal
            visible={menuVisible}
            onClose={() => setMenuVisible(false)}
            onLogout={() => setIsAuthenticated(false)}
          />
        </>
      ) : (
        <Login onLoginSuccess={() => setIsAuthenticated(true)} />
      )}
    </NavigationContainer>
  );
}

export default App;
