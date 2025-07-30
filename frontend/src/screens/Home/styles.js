import { StyleSheet,Dimensions } from 'react-native';

const { width, height } = Dimensions.get('window');

export default StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 24,
  },
   input: {
    height: 150,
    borderColor: '#666',
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 10,
    marginTop: 8,
    textAlign: 'left',    
    textAlignVertical: 'top', 
  },
  picker: {
    height: 50,
    width: '100%',
  },
  traducaoBox: {
    backgroundColor: '#eef',
    padding: 15,
    borderRadius: 5,
  },
  traducaoTexto: {
    fontSize: 16,
    fontWeight: 'bold',
  },
});