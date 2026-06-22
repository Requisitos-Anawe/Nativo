import {StyleSheet} from 'react-native';

export default StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f4f5f4',
  },
  header: {
    backgroundColor: '#042d1f',
    width: '100%',
    paddingBottom: 42,
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    position: 'relative',
  },
  backButton: {
    position: 'absolute',
    left: 24,
    bottom: 42,
    padding: 4,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 28,
    fontWeight: 'bold',
    fontFamily: 'InterDisplay-SemiBold',
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 28,
    paddingTop: 36,
    paddingBottom: 120,
  },
  label: {
    color: '#1A1A1A',
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 8,
  },
  input: {
    minHeight: 52,
    backgroundColor: '#fff',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#dcdcdc',
    paddingHorizontal: 14,
    color: '#1A1A1A',
    fontSize: 15,
    marginBottom: 18,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  saveButton: {
    marginTop: 12,
    backgroundColor: '#042d1f',
    minHeight: 54,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonDisabled: {
    opacity: 0.7,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  errorText: {
    color: '#B00020',
    textAlign: 'center',
    fontSize: 15,
    marginTop: 24,
  },
});