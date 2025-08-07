import { StyleSheet } from 'react-native';

export default StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 24,
  },

  input: {
    height: 150,
    borderWidth: 1,
    borderRadius: 24,
    borderColor: "#d6d6d6",
    paddingHorizontal: 20,
    textAlign: 'left',    
    textAlignVertical: 'top', 
    marginBottom: 24
  },

  actions: {
    width: '100%',
    justifyContent: 'center',
    alignItems: 'flex-end',
    marginBottom: 10
  },

  button: {
    width: 120,
    backgroundColor: '#CC005F',
    paddingVertical: 8,
    borderRadius: 4,
    alignItems: 'center',
  },

  textButton: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },

  divisor: {
    width: '100%',
    height: 1,
    backgroundColor: "#D9D9D9",
    marginBottom: 15
  },

  translateActions: {
    width: '100%',
    color: "#fff",
    height: 'auto',
    marginBottom: 10
  },

  categoriaTexto: {
    fontSize: 12,
    fontFamily: 'InterDisplay-SemiBold',
    color: "#003066"
  },

  traducaoBox: {
    paddingVertical: 32,
  },

  traducaoTexto: {
    fontSize: 20,
    fontWeight: 'bold',
  },

  copyText: {
    fontSize: 10,
    color: "#fff"
  },

  copy: {
    backgroundColor: "rgba(0, 48, 102, 0.5)",
    padding: 6,
    borderRadius: 6,
    width: 80,
    alignItems: 'center'
  }

});