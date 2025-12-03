import React, { useState } from 'react';
import {
  Image,
  Modal,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import SearchIcon from '../../assets/admin-icons/search.svg';
import CloseIcon from '../../assets/admin-icons/x.svg';

const JoinerItem = ({ name, avatarUrl, onSelect }) => (
  <TouchableOpacity style={styles.joinerItemContainer} onPress={onSelect}>
    {/* Avatar */}
    <View style={styles.avatarWrapper}>
      <View style={styles.avatarContainer}>
        <Image source={{ uri: avatarUrl }} style={styles.avatar} />
      </View>
    </View>

    {/* Details */}
    <View style={styles.detailsContainer}>
      <Text style={styles.joinerName}>{name}</Text>
    </View>
  </TouchableOpacity>
);

const JoinerFilter = ({ isVisible, onClose, onSelectJoiner, onReset, joiners = [] }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const scrollRef = React.useRef(null);

  // Filter joiners based on the search query
  const filteredJoiners = joiners.filter(joiner => {
    const name = joiner.name || '';
    return name.toLowerCase().includes(searchQuery.toLowerCase())
  });

  const handleSelect = (joiner) => {
    onSelectJoiner(joiner?.id || null);
    onClose();
  };

  const handleReset = () => {
    if (onReset && typeof onReset === 'function') {
      onReset();
    }
  };

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={isVisible}
      onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.modalOverlay}>
          <TouchableWithoutFeedback>
            <View style={styles.actionSheetContainer}>
              <KeyboardAvoidingView 
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                keyboardVerticalOffset={80}
              >
                <SafeAreaView style={styles.safeAreaContainer} edges={['top', 'left', 'right', 'bottom']}>
                {/* Title */}
                <View style={styles.titleContainer}>
                  <Text style={styles.titleText}>Joiner</Text>
                  
                  {/* Close */}
                  <TouchableOpacity 
                    style={styles.closeButton}
                    onPress={onClose}
                    activeOpacity={0.7}
                  >
                    <CloseIcon width={24} height={24} style={styles.closeIcon} />
                  </TouchableOpacity>
                </View>

                {/* Content */}
                <View style={styles.contentContainer}>
                  {/* Search Field */}
                  <View style={styles.searchFieldContainer}>
                    <SearchIcon width={24} height={24} />
                    <TextInput
                      style={styles.textInput}
                      placeholder="Search"
                      placeholderTextColor="#647276"
                      value={searchQuery}
                      onChangeText={setSearchQuery}
                      onFocus={() => {
                        setTimeout(() => {
                          try {
                            if (scrollRef && scrollRef.current && typeof scrollRef.current.scrollTo === 'function') {
                              scrollRef.current.scrollTo({ y: 0, animated: true });
                            }
                          } catch (e) {
                            // ignore
                          }
                        }, 120);
                      }}
                      caretColor="#539461"
                      selectionColor="#539461"
                      autoCorrect={false}
                      autoCapitalize="none"
                      allowFontScaling={false}
                      editable={true}
                    />
                  </View>

                  {/* Lists */}
                  <ScrollView 
                    ref={scrollRef}
                    style={styles.listsContainer} 
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={[
                      styles.listsContentContainer,
                      filteredJoiners.length === 0 && styles.listsContentContainerEmpty
                    ]}
                  >
                    {filteredJoiners.length === 0 ? (
                      <View style={styles.emptyStateContainer}>
                        <Text style={styles.emptyStateText}>No joiners found</Text>
                        <Text style={styles.emptyStateSubtext}>
                          {searchQuery ? 'Try adjusting your search' : 'No joiner data available for these orders'}
                        </Text>
                      </View>
                    ) : (
                      filteredJoiners.map((joiner, index) => (
                        <View key={joiner.id}>
                          {/* Social / Option User List */}
                          <JoinerItem
                            name={joiner.name}
                            avatarUrl={joiner.avatar}
                            onSelect={() => handleSelect(joiner)}
                          />
                          {/* Divider */}
                          {index < filteredJoiners.length - 1 && (
                            <View style={styles.dividerWrapper}>
                              <View style={styles.divider} />
                            </View>
                          )}
                        </View>
                      ))
                    )}
                  </ScrollView>
                </View>

                {/* Action */}
                <View style={styles.actionContainer}>
                  {/* Button View */}
                  <TouchableOpacity 
                    style={styles.buttonView} 
                    onPress={onClose}
                    activeOpacity={0.7}
                  >
                    {/* Text */}
                    <View style={styles.buttonTextContainer}>
                      <Text style={styles.buttonText}>View All</Text>
                    </View>
                  </TouchableOpacity>
                </View>

                </SafeAreaView>
              </KeyboardAvoidingView>

              {/* System / Home Indicator */}
              <View style={styles.homeIndicator}>
                <View style={styles.gestureBar} />
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

// --- Styles ---
const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  // Filter: Joiner
  filterContainer: {
    flexDirection: 'column',
    justifyContent: 'flex-end',
    alignItems: 'flex-start',
    padding: 0,
    position: 'relative',
    width: '100%',
    height: 569,
  },
  // Action Sheet
  actionSheetContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: 620,
    height: '80%',
  },
  // Title
  titleContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'flex-start',
    paddingTop: 24,
    paddingBottom: 12,
    paddingHorizontal: 24,
    gap: 16,
    width: '100%',
    height: 60,
    backgroundColor: '#FFFFFF',
    flex: 0,
  },
  // Text
  titleText: {
    width: 287,
    height: 24,
    fontFamily: 'Inter',
    fontStyle: 'normal',
    fontWeight: '700',
    fontSize: 18,
    lineHeight: 24,
    color: '#202325',
    flex: 0,
    flexGrow: 1,
  },
  // Close
  closeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 0,
    gap: 12,
    width: 24,
    height: 24,
    flex: 0,
  },
  // Icon
  closeIcon: {
    width: 24,
    height: 24,
    flex: 0,
  },
  // Content
  contentContainer: {
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'flex-start',
    paddingVertical: 8,
    paddingHorizontal: 24,
    gap: 8,
    width: '100%',
    height: 415,
    flex: 0,
    alignSelf: 'stretch',
  },
  // Search Field
  searchFieldContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#CDD3D4',
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 48,
    gap: 8,
  },
  // Text Field
  textFieldContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 12,
    width: '100%',
    height: 48,
    minHeight: 48,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CDD3D4',
    borderRadius: 12,
    flex: 0,
    alignSelf: 'stretch',
  },
  // Icon: Left
  searchIcon: {
    width: 24,
    height: 24,
    flex: 0,
  },
  // Placeholder / Text Input
  textInput: {
    flex: 1,
    fontFamily: 'Inter',
    fontWeight: '500',
    fontSize: 16,
    color: '#202325',
    height: '100%',
  },
  // Lists
  listsContainer: {
    width: '100%',
    height: 343,
    flex: 0,
    alignSelf: 'stretch',
  },
  listsContentContainer: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    paddingVertical: 16,
    paddingHorizontal: 0,
    gap: 6,
  },
  listsContentContainerEmpty: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Empty State
  emptyStateContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 24,
  },
  emptyStateText: {
    fontFamily: 'Inter',
    fontWeight: '600',
    fontSize: 16,
    color: '#393D40',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyStateSubtext: {
    fontFamily: 'Inter',
    fontWeight: '500',
    fontSize: 14,
    color: '#647276',
    textAlign: 'center',
  },
  // Social / Option User List
  joinerItemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 0,
    width: '100%',
    height: 39,
    flex: 0,
    alignSelf: 'stretch',
  },
  // Avatar wrapper
  avatarWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 0,
    gap: 10,
    width: 40,
    height: 40,
    flex: 0,
  },
  // Avatar
  avatarContainer: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    padding: 0,
    width: 40,
    minWidth: 40,
    height: 40,
    minHeight: 40,
    borderRadius: 1000,
    flex: 0,
  },
  // avatar image
  avatar: {
    width: 40,
    height: 40,
    borderWidth: 1,
    borderColor: '#539461',
    borderRadius: 1000,
    flex: 0,
  },
  // Details
  detailsContainer: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    padding: 0,
    width: 279,
    height: 22,
    flex: 1,
    marginLeft: 8,
  },
  // Text
  joinerName: {
    width: '100%',
    height: 22,
    fontFamily: 'Inter',
    fontStyle: 'normal',
    fontWeight: '700',
    fontSize: 16,
    lineHeight: 22,
    color: '#202325',
    flex: 0,
    alignSelf: 'stretch',
  },
  // Divider wrapper
  dividerWrapper: {
    flexDirection: 'column',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 0,
    width: '100%',
    height: 17,
    flex: 0,
    alignSelf: 'stretch',
  },
  // Divider
  divider: {
    width: '100%',
    height: 1,
    backgroundColor: '#E4E7E9',
    flex: 0,
    alignSelf: 'stretch',
  },
  // Action
  actionContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingTop: 12,
    paddingBottom: 0,
    paddingHorizontal: 24,
    gap: 8,
    width: '100%',
    height: 60,
    flex: 0,
    alignSelf: 'stretch',
  },
  // Reset Button
  resetButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 24,
    height: 48,
    minHeight: 48,
    backgroundColor: '#F2F7F3',
    borderRadius: 12,
    flex: 1,
  },
  resetButtonText: {
    fontFamily: 'Inter',
    fontStyle: 'normal',
    fontWeight: '600',
    fontSize: 16,
    lineHeight: 16,
    color: '#539461',
  },
  // Button View
  buttonView: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 24,
    width: '100%',
    height: 48,
    minHeight: 48,
    backgroundColor: '#539461',
    borderRadius: 12,
    flex: 1,
  },
  // Text container
  buttonTextContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 0,
    paddingHorizontal: 8,
    gap: 8,
    width: 79,
    height: 16,
    flex: 0,
  },
  // Button text
  buttonText: {
    width: 63,
    height: 16,
    fontFamily: 'Inter',
    fontStyle: 'normal',
    fontWeight: '600',
    fontSize: 16,
    lineHeight: 16,
    color: '#FFFFFF',
    flex: 0,
  },
  safeAreaContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  // System / Home Indicator
  homeIndicator: {
    width: '100%',
    height: 34,
    backgroundColor: '#FFFFFF',
    flex: 0,
  },
  // Gesture Bar
  gestureBar: {
    position: 'absolute',
    width: 148,
    height: 5,
    left: '50%',
    marginLeft: -74,
    bottom: 8,
    backgroundColor: '#202325',
    borderRadius: 100,
  },
});

export default JoinerFilter;
