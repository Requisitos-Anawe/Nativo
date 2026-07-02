import { StyleSheet, Dimensions } from 'react-native';

const { width } = Dimensions.get('window');

export default StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f4f5f4',
    paddingHorizontal: 24,
    paddingTop: 40,
  },

  // Language selectors
  languageContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 30,
  },
  languageDropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#dcdcdc',
    paddingHorizontal: 15,
    paddingVertical: 10,
    width: '40%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  languageText: {
    color: '#a0a0a0',
    fontSize: 14,
    fontFamily: 'InterDisplay-SemiBold',
    fontWeight: 'bold',
  },

  // Input Area
  inputContainer: {
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#dcdcdc',
    padding: 15,
    minHeight: 120,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    position: 'relative',
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    textAlignVertical: 'top',
    paddingRight: 30, // space for clear icon
  },
  clearIcon: {
    position: 'absolute',
    top: 15,
    right: 15,
    zIndex: 2,
  },

  // Translate Button
  actions: {
    width: '100%',
    alignItems: 'flex-end',
    marginBottom: 30,
  },
  button: {
    backgroundColor: '#042d1f',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  textButton: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },

  // Output Area
  outputContainer: {
    backgroundColor: '#ececec',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#dcdcdc',
    padding: 15,
    minHeight: 120,
    marginBottom: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    position: 'relative',
  },
  outputText: {
    fontSize: 16,
    color: '#333',
    marginBottom: 30,
  },
  outputActions: {
    flexDirection: 'row',
    alignItems: 'center',
    position: 'absolute',
    bottom: -10,
    right: 15,
    gap: 15,
  },

  // Bottom Graphics
  graphicsContainer: {
    flexDirection: 'row',
    gap: 15,
    marginBottom: 30,
  },
  graphicBoxRed: {
    width: 100,
    height: 100,
    backgroundColor: '#F5E8C7',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 4,
  },
  graphicBoxGreen: {
    width: 100,
    height: 100,
    backgroundColor: '#A3D9B1',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 4,
  },

  // Floating Info Button
  infoButton: {
    position: 'absolute',
    bottom: 150,
    right: 24,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#888',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  }
});