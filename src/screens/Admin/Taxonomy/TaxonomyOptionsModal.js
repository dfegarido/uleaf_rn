import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Dimensions,
  Animated,
} from 'react-native';
import NewPlantIcon from '../../../assets/admin-icons/new-plant.svg';
import ImportDataIcon from '../../../assets/admin-icons/import-data.svg';

const { height: screenHeight } = Dimensions.get('window');

const TaxonomyOptionsModal = ({ visible, onClose, onNewPlantTaxonomy, onImportTaxonomy }) => {
  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <TouchableOpacity style={styles.overlayTouchable} onPress={onClose} />
        
        {/* Action Sheet */}
        <View style={styles.actionSheet}>
          {/* System Action Sheet Indicator */}
          <View style={styles.indicatorContainer}>
            <View style={styles.indicatorBar} />
          </View>
          
          {/* Content */}
          <View style={styles.content}>
            {/* New Plant Taxonomy Button */}
            <TouchableOpacity style={styles.button} onPress={onNewPlantTaxonomy}>
              <View style={styles.iconContainer}>
                <NewPlantIcon width={48} height={48} />
              </View>
              <View style={styles.textContainer}>
                <Text style={styles.buttonTitle}>New Plant Taxonomy</Text>
                <Text style={styles.buttonSubtitle}>Fill-up a form</Text>
              </View>
            </TouchableOpacity>
            
            {/* Import Taxonomy Data Button */}
            {/* <TouchableOpacity style={styles.button} onPress={onImportTaxonomy}>
              <View style={styles.iconContainer}>
                <ImportDataIcon width={48} height={48} />
              </View>
              <View style={styles.textContainer}>
                <Text style={styles.buttonTitle}>Import Taxonomy Data</Text>
                <Text style={styles.buttonSubtitle}>Upload spreadsheet file</Text>
              </View>
            </TouchableOpacity> */}
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  overlayTouchable: {
    flex: 1,
  },
  // Action Sheet - matching Figma specifications
  actionSheet: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    paddingBottom: 34,
    width: '100%',
    height: 254,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  // System Action Sheet Indicator
  indicatorContainer: {
    width: '100%',
    height: 24,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Indicator Bar
  indicatorBar: {
    width: 48,
    height: 5,
    backgroundColor: '#E4E7E9',
    borderRadius: 100,
    marginTop: 8,
  },
  // Content
  content: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    paddingHorizontal: 24,
    paddingVertical: 8,
    paddingBottom: 16,
    gap: 12,
    width: '100%',
    height: 196,
  },
  // Buttons
  button: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 16,
    gap: 16,
    width: '100%',
    height: 80,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CDD3D4',
    borderRadius: 12,
  },
  // Icon container
  iconContainer: {
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Text container
  textContainer: {
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'flex-start',
    gap: 4,
    flex: 1,
    height: 43,
  },
  // Button title
  buttonTitle: {
    fontFamily: 'Inter',
    fontStyle: 'normal',
    fontWeight: '700',
    fontSize: 16,
    lineHeight: 22,
    color: '#202325',
    alignSelf: 'stretch',
  },
  // Button subtitle
  buttonSubtitle: {
    fontFamily: 'Inter',
    fontStyle: 'normal',
    fontWeight: '500',
    fontSize: 12,
    lineHeight: 17,
    color: '#647276',
    alignSelf: 'stretch',
  },
});

export default TaxonomyOptionsModal;
