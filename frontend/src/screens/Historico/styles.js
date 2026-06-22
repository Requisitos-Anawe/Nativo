import {StyleSheet} from 'react-native';

export default StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f4f5f4',
  },
  header: {
    backgroundColor: '#042d1f',
    paddingHorizontal: 24,
    paddingBottom: 28,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  backButton: {
    width: 36,
    height: 36,
    justifyContent: 'center',
  },
  headerTitle: {
    color: '#fff',
    fontSize: 26,
    fontWeight: 'bold',
    marginTop: 12,
  },
  headerSubtitle: {
    color: '#fff',
    opacity: 0.9,
    marginTop: 4,
  },
  content: {
    padding: 20,
    paddingBottom: 90,
  },
  emptyText: {
    textAlign: 'center',
    color: '#555',
    marginTop: 30,
  },
});
