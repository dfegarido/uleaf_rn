import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Dimensions,
  TouchableWithoutFeedback,
} from 'react-native';

// Import icons (assuming you have edit and delete icons)
import EditIcon from '../../../assets/admin-icons/edit.svg';
import DeleteIcon from '../../../assets/admin-icons/delete.svg';
import ArrowRightIcon from '../../../assets/admin-icons/arrow-right.svg';

const { width: screenWidth } = Dimensions.get('window');

const SpecieOptionsModal = ({ visible, onClose, onEdit, onDelete, specieName }) => {
  const handleEdit = () => {
    onEdit && onEdit();
    onClose();
  };

  const handleDelete = () => {
    onDelete && onDelete();
    onClose();
  };

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <View style={styles.modalContainer}>
              {/* Action Sheet */}
              <View style={styles.actionSheet}>
                {/* System Action Sheet Indicator */}
                <View style={styles.indicatorContainer}>
                  <View style={styles.indicatorBar} />
                </View>

                {/* Content */}
                <View style={styles.content}>
                  {/* Edit Option */}
                  <TouchableOpacity style={styles.option} onPress={handleEdit}>
                    <View style={styles.listLeft}>
                      <View style={styles.iconContainer}>
                        <EditIcon width={24} height={24} />
                      </View>
                      <Text style={styles.listTitle}>Update</Text>
                    </View>
                    <View style={styles.listRight}>
                      <View style={styles.iconContainer}>
                        <ArrowRightIcon width={24} height={24} />
                      </View>
                    </View>
                  </TouchableOpacity>

                  {/* Divider */}
                  <View style={styles.dividerContainer}>
                    <View style={styles.divider} />
                  </View>

                  {/* Delete Option */}
                  <TouchableOpacity style={styles.option} onPress={handleDelete}>
                    <View style={styles.listLeft}>
                      <View style={styles.iconContainer}>
                        <DeleteIcon width={24} height={24} />
                      </View>
                      <Text style={styles.listTitle}>Delete</Text>
                    </View>
                    <View style={styles.listRight}>
                      <View style={styles.iconContainer}>
                        <ArrowRightIcon width={24} height={24} />
                      </View>
                    </View>
                  </TouchableOpacity>

                  {/* Final Divider */}
                  <View style={styles.dividerContainer}>
                    <View style={styles.divider} />
                  </View>
                </View>

                {/* Action Home Indicator */}
                <View style={styles.actionHomeIndicator}>
                  <View style={styles.gestureBar} />
                </View>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'flex-start',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  modalContainer: {
    position: 'relative',
    width: screenWidth,
    height: 196,
  },
  actionSheet: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    paddingBottom: 34,
    width: screenWidth,
    height: 196,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  indicatorContainer: {
    width: screenWidth,
    height: 24,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  indicatorBar: {
    width: 48,
    height: 5,
    backgroundColor: '#E4E7E9',
    borderRadius: 100,
    marginTop: 8,
  },
  content: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    paddingTop: 8,
    width: screenWidth,
    height: 138,
  },
  option: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 8,
    gap: 8,
    width: screenWidth,
    height: 48,
  },
  listLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingLeft: 16,
    paddingRight: 0,
    gap: 8,
    flex: 1,
    height: 48,
    minHeight: 48,
  },
  iconContainer: {
    width: 24,
    height: 24,
  },
  listTitle: {
    fontFamily: 'Inter',
    fontWeight: '500',
    fontSize: 16,
    lineHeight: 22,
    color: '#393D40',
  },
  listRight: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingVertical: 8,
    paddingLeft: 0,
    paddingRight: 16,
    gap: 8,
    flex: 1,
    height: 48,
    minHeight: 48,
  },
  dividerContainer: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    paddingVertical: 8,
    width: screenWidth,
    height: 17,
  },
  divider: {
    width: screenWidth,
    height: 1,
    backgroundColor: '#E4E7E9',
  },
  actionHomeIndicator: {
    position: 'absolute',
    width: screenWidth,
    height: 34,
    left: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  gestureBar: {
    width: 148,
    height: 5,
    backgroundColor: '#202325',
    borderRadius: 100,
    marginBottom: 8,
  },
});

export default SpecieOptionsModal;
