import { StyleSheet } from 'react-native';

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: 340,
    minHeight: 154,
    alignItems: 'flex-start',
    padding: 0,
    gap: 8,
  },
  popover: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    paddingTop: 16,
    paddingLeft: 0,
    paddingRight: 0,
    paddingBottom: 0,
    width: 340,
    minHeight: 98,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CDD3D4',
    borderRadius: 12,
  },
  textContainer: {
    flexDirection: 'column',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingBottom: 16,
    gap: 8,
    width: 340,
    minHeight: 82,
  },
  titleText: {
    width: 292,
    minHeight: 66,
    fontFamily: 'Inter',
    fontStyle: 'normal',
    fontWeight: '600',
    fontSize: 16,
    lineHeight: 22, // 140% of 16px
    textAlign: 'center',
    color: '#202325',
    flexShrink: 1,
  },
  actionContainer: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    padding: 0,
    width: 340,
    minHeight: 48,
  },
  cancelButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 24,
    width: 340,
    minHeight: 48,
    backgroundColor: '#F5F6F6',
    borderRadius: 12,
  },
  cancelButtonText: {
    fontFamily: 'Inter',
    fontStyle: 'normal',
    fontWeight: '600',
    fontSize: 16,
    lineHeight: 16,
    color: '#393D40',
  },
});

export default styles;

