import React, { ReactNode } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';

type Props = {
  children: ReactNode;
};

const ScreenContainer = ({ children }: Props) => {
  return <ScrollView>
    <View style={styles.container}>{children}</View>
  </ScrollView>;
};

export default ScreenContainer;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 24,
  },
});
