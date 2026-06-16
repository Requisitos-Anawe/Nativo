import {NavigationContainer} from '@react-navigation/native';
import {useAuth} from '../contexts/AuthContext';
import AppStack from './AppStack';
import {Navigation as AuthNavigation} from './AuthStack';

export function RootNavigator() {
  const {user} = useAuth();

  if (!user) {
    return <AuthNavigation />;
  }

  const perfil =
    typeof user.perfil === 'string'
      ? user.perfil
      : user.perfil?.descricao || '';

  return (
    <NavigationContainer>
      <AppStack perfil={perfil} />
    </NavigationContainer>
  );
}