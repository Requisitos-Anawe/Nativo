import React from 'react';
import { Text, TextProps, StyleSheet, TextStyle } from 'react-native';

interface AppTextProps extends TextProps {
  style?: TextStyle | TextStyle[];
  children: React.ReactNode;
}

const AppText: React.FC<AppTextProps> = ({ children, style, ...rest }) => {
  return (
    <Text style={[styles.text, style]} {...rest}>
      {children}
    </Text>
  );
};

const styles = StyleSheet.create({
  text: {
    fontFamily: 'Inter',
  },
});

export default AppText;
