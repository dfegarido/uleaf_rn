import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';

// Import icons
import BackIcon from '../../../assets/iconnav/caret-left-bold.svg';
import DownIcon from '../../../assets/admin-icons/arrow-down.svg';

const EditSpecieScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const insets = useSafeAreaInsets();
  
  // Get the specie data passed from the previous screen
  const { specieData = {} } = route.params || {};
  
  console.log('Received specieData:', specieData); // Debug log
  
  const [specieName, setSpecieName] = useState(specieData.name || '');
  const [variegation, setVariegation] = useState(specieData.variegation || '');
  const [shippingIndex, setShippingIndex] = useState(specieData.shipping || '');
  const [acclimationIndex, setAcclimationIndex] = useState(specieData.acclimation || '');

  const handleGoBack = () => {
    navigation.goBack();
  };

  const handleSave = () => {
    const updatedSpecie = {
      ...specieData,
      name: specieName,
      variegation,
      shipping: shippingIndex,
      acclimation: acclimationIndex,
    };
    console.log('Saving updated specie:', updatedSpecie);
    // TODO: Save the updated specie data
    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.container} edges={[]}>
      {/* Navigation / Title Bar: Main */}
      <View style={styles.navigationTitleBar}>
        {/* Status Bar */}
        <View style={styles.statusBar}>
          {/* Left Side */}
          <View style={styles.leftSide}>
            <View style={styles.time} />
          </View>
          
          {/* Right Side */}
          <View style={styles.rightSide}>
            <View style={styles.mobileSignal} />
            <View style={styles.wifi} />
            <View style={styles.battery} />
          </View>
        </View>

        {/* Content */}
        <View style={styles.navContent}>
          {/* Controls */}
          <View style={styles.controls}>
            {/* Back */}
            <TouchableOpacity onPress={handleGoBack} style={styles.backButton}>
              <BackIcon width={24} height={24} />
            </TouchableOpacity>
            
            {/* Title */}
            <Text style={styles.title}>Update Specie</Text>
          </View>
        </View>
      </View>

      {/* Content */}
      <View style={styles.content}>
        <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Form Taxonomy */}
        <View style={styles.formTaxonomy}>
          {/* Specie Name */}
          <View style={styles.inputSection}>
            <View style={styles.textField}>
              <Text style={styles.label}>
                Specie name <Text style={styles.asterisk}>*</Text>
              </Text>
              <View style={styles.textInput}>
                <TextInput
                  style={styles.placeholder}
                  value={specieName}
                  onChangeText={setSpecieName}
                  placeholder={specieData.name || "Accuminate"}
                  placeholderTextColor="#647276"
                />
              </View>
            </View>
          </View>

          {/* Variegation */}
          <View style={styles.inputSection}>
            <View style={styles.textField}>
              <Text style={styles.label}>Variegation</Text>
              <View style={styles.textInputWithIcon}>
                <TextInput
                  style={styles.placeholder}
                  value={variegation}
                  onChangeText={setVariegation}
                  placeholder={specieData.variegation || "Select..."}
                  placeholderTextColor="#647276"
                />
                <View style={styles.iconRight}>
                  <DownIcon width={24} height={24} />
                </View>
              </View>
            </View>
          </View>

          {/* Shipping Index */}
          <View style={styles.inputSection}>
            <View style={styles.textField}>
              <Text style={styles.label}>
                Shipping index <Text style={styles.asterisk}>*</Text>
              </Text>
              <View style={styles.textInputWithIcon}>
                <TextInput
                  style={styles.placeholder}
                  value={shippingIndex}
                  onChangeText={setShippingIndex}
                  placeholder={specieData.shipping || "(7-10)"}
                  placeholderTextColor="#647276"
                />
                <View style={styles.iconRight}>
                  <DownIcon width={24} height={24} />
                </View>
              </View>
            </View>
          </View>

          {/* Acclimation Index */}
          <View style={styles.inputSection}>
            <View style={styles.textField}>
              <Text style={styles.label}>
                Acclimation index <Text style={styles.asterisk}>*</Text>
              </Text>
              <View style={styles.textInputWithIcon}>
                <TextInput
                  style={styles.placeholder}
                  value={acclimationIndex}
                  onChangeText={setAcclimationIndex}
                  placeholder={specieData.acclimation || "(4-6)"}
                  placeholderTextColor="#647276"
                />
                <View style={styles.iconRight}>
                  <DownIcon width={24} height={24} />
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* Action */}
        <View style={styles.actionSection}>
          <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
            <View style={styles.buttonText}>
              <Text style={styles.buttonLabel}>Update Specie</Text>
            </View>
          </TouchableOpacity>
        </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  
  // Navigation / Title Bar: Main
  navigationTitleBar: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    padding: 0,
    position: 'absolute',
    width: '100%',
    height: 106,
    minHeight: 106,
    left: 0,
    top: 0,
    backgroundColor: '#FFFFFF',
    zIndex: 2,
  },
  
  // Status Bar
  statusBar: {
    width: '100%',
    height: 48,
    position: 'relative',
  },
  
  // Left Side
  leftSide: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 0,
    gap: 5,
    position: 'absolute',
    width: 54,
    height: 12,
    left: 15,
    top: 18,
  },
  
  // Time
  time: {
    width: 28.43,
    height: 11.09,
    backgroundColor: '#202325',
  },
  
  // Right Side
  rightSide: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 0,
    gap: 5,
    position: 'absolute',
    width: 66.6,
    height: 12,
    right: 15,
    top: 18,
  },
  
  // Mobile Signal
  mobileSignal: {
    width: 17,
    height: 10.67,
    backgroundColor: '#202325',
  },
  
  // Wifi
  wifi: {
    width: 15.27,
    height: 10.97,
    backgroundColor: '#202325',
  },
  
  // Battery
  battery: {
    width: 24.33,
    height: 11.33,
    backgroundColor: '#202325',
  },
  
  // Content - Navigation Header
  navContent: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    padding: 0,
    width: '100%',
    height: 58,
    minHeight: 58,
  },
  
  // Controls
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 6,
    paddingBottom: 12,
    paddingHorizontal: 16,
    width: '100%',
    height: 58,
    minHeight: 58,
    position: 'relative',
  },
  
  // Back Button
  backButton: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 0,
  },
  
  // Title
  title: {
    position: 'absolute',
    width: 240,
    height: 24,
    left: '50%',
    marginLeft: -120, // Half of width to center
    top: 14,
    fontFamily: 'Inter',
    fontWeight: '700',
    fontSize: 18,
    lineHeight: 24,
    textAlign: 'center',
    color: '#202325',
    zIndex: 2,
  },
  
  // Navigation / Title Bar: Main
  placeholder: {
    width: 24,
    height: 24,
  },
  
  // Form Taxonomy
  
  // Status Bar
  statusBar: {
    width: '100%',
    height: 48,
    position: 'relative',
  },
  
  // Left Side
  leftSide: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 0,
    gap: 5,
    position: 'absolute',
    width: 54,
    height: 12,
    left: 15,
    top: 18,
  },
  
  // Time
  time: {
    width: 28.43,
    height: 11.09,
    backgroundColor: '#202325',
  },
  
  // Right Side
  rightSide: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 0,
    gap: 5,
    position: 'absolute',
    width: 66.6,
    height: 12,
    right: 15,
    top: 18,
  },
  
  // Mobile Signal
  mobileSignal: {
    width: 17,
    height: 10.67,
    backgroundColor: '#202325',
  },
  
  // Wifi
  wifi: {
    width: 15.27,
    height: 10.97,
    backgroundColor: '#202325',
  },
  
  // Battery (Vector)
  battery: {
    width: 24.33,
    height: 11.33,
    backgroundColor: '#202325',
  },
  
  // Nav Content
  navContent: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    padding: 0,
    width: '100%',
    height: 58,
    minHeight: 58,
  },
  
  // Controls
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 6,
    paddingHorizontal: 16,
    paddingBottom: 12,
    width: '100%',
    height: 58,
    minHeight: 58,
    position: 'relative',
  },
  
  // Back
  backButton: {
    width: 24,
    height: 24,
  },
  
  // Title
  title: {
    position: 'absolute',
    width: 240,
    height: 24,
    left: '50%',
    marginLeft: -120, // calc(50% - 240px/2 + 0.5px)
    top: 14,
    fontFamily: 'Inter',
    fontWeight: '700',
    fontSize: 18,
    lineHeight: 24,
    textAlign: 'center',
    color: '#202325',
  },
  
  // Content
  content: {
    flex: 1,
    paddingTop: 106, // Account for navigation bar height
    paddingHorizontal: 16,
    alignItems: 'center', // Center the content
    width: '100%',
  },
  
  scrollContent: {
    flex: 1,
    paddingBottom: 20, // Add some bottom padding
    width: '100%',
  },
  
  // Form Taxonomy
  formTaxonomy: {
    flexDirection: 'column',
    alignItems: 'center', // Center form elements
    padding: 0,
    paddingTop: 18, // Add top padding for better spacing
    width: '100%',
    gap: 16, // Add gap between form elements
  },
  
  // Input Section (Price, Quantity, Variegation, Size)
  inputSection: {
    flexDirection: 'column',
    alignItems: 'center', // Center input elements
    paddingVertical: 0,
    paddingHorizontal: 0,
    marginBottom: 16,
    width: '100%',
  },
  
  // Text Field Container
  textField: {
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'flex-start',
    padding: 0,
    gap: 8,
    width: 327,
    height: 78,
  },
  
  // Label
  label: {
    width: 327,
    height: 22,
    fontFamily: 'Inter',
    fontWeight: '500',
    fontSize: 16,
    lineHeight: 22, // 140% of 16px
    color: '#393D40',
  },
  
  // Asterisk for required fields
  asterisk: {
    color: '#FF0000',
  },
  
  // Text Input (without icon)
  textInput: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 12,
    width: 327,
    height: 48,
    minHeight: 48,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CDD3D4',
    borderRadius: 12,
  },
  
  // Text Input (with icon)
  textInputWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 12,
    width: 327,
    height: 48,
    minHeight: 48,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CDD3D4',
    borderRadius: 12,
  },
  
  // Placeholder/Input Text
  placeholder: {
    flex: 1,
    height: 22,
    fontFamily: 'Inter',
    fontWeight: '500',
    fontSize: 16,
    lineHeight: 22, // 140% of 16px
    color: '#647276',
    paddingVertical: 0,
  },
  
  // Icon Right
  iconRight: {
    width: 24,
    height: 24,
  },
  
  // Action Section
  actionSection: {
    alignItems: 'center', // Center the button
    paddingTop: 12, // Reduced from 24 to bring button closer
    paddingHorizontal: 16,
    paddingBottom: 16,
    width: '100%',
  },
  
  // Save Button (Controls / Button)
  saveButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 24,
    width: 327,
    height: 48,
    minHeight: 48,
    backgroundColor: '#539461',
    borderRadius: 12,
  },
  
  // Button Text Container
  buttonText: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  // Button Label
  buttonLabel: {
    fontFamily: 'Inter',
    fontWeight: '600',
    fontSize: 16,
    color: '#FFFFFF',
    textAlign: 'center',
  },
});

export default EditSpecieScreen;
