import { StyleSheet } from 'react-native';

const styles = StyleSheet.create({
  joinersListContainer: {
    flex: 1,
    width: '100%',
  },
  joinersContainer: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    paddingTop: 6,
    paddingBottom: 40,
    backgroundColor: '#F5F6F6',
    flex: 1,
    width: '100%',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  noteContainer: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    paddingHorizontal: 24,
    paddingVertical: 12,
    gap: 8,
    width: '100%',
    minHeight: 64,
    borderRadius: 0,
    alignSelf: 'stretch',
    flexGrow: 0,
  },
  noteText: {
    flex: 1,
    fontFamily: 'Inter',
    fontStyle: 'normal',
    fontWeight: '500',
    fontSize: 16,
    lineHeight: 22,
    color: '#393D40',
    alignSelf: 'stretch',
    flexWrap: 'wrap',
  },
});

export default styles;

