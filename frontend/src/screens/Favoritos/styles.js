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
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#dcdcdc',
    paddingHorizontal: 12,
    marginBottom: 18,
  },
  searchInput: {
    flex: 1,
    height: 44,
    marginLeft: 8,
    color: '#1A1A1A',
  },
  emptyText: {
    textAlign: 'center',
    color: '#555',
    marginTop: 30,
  },
});
