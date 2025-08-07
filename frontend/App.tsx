import BottomTabs from './src/navigation/BottomTabs';
import Home from './src/screens/Home';
import { NavigationContainer } from '@react-navigation/native';

function App() {

  return (
    <NavigationContainer>
      <BottomTabs />
    </NavigationContainer>
  );
}

export default App;
