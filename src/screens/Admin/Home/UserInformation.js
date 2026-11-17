import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert, TextInput, Modal, Switch } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { useSafeAreaInsets, SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import BackIcon from '../../../assets/iconnav/caret-left-bold.svg';
import PhFlag from '../../../assets/buyer-icons/philippines-flag.svg';
import ThFlag from '../../../assets/buyer-icons/thailand-flag.svg';
import IdFlag from '../../../assets/buyer-icons/indonesia-flag.svg';
import UsFlag from '../../../assets/buyer-icons/usa-flag.svg';
import Loading from '../../../components/Loading';
import { getStoredAuthToken } from '../../../utils/getStoredAuthToken';
import { API_CONFIG } from '../../../config/apiConfig';
import { deleteUserApi } from '../../../components/Api/deleteUserApi';
import { getB2BAccountApi, setB2BBusinessApi } from '../../../components/Api/b2bAccountApi';
import { GREEN, GREEN_DARK, INK, MUTED, PAGE_BG, PencilGlyph, RolePill, StatusPill, TrashGlyph, UserAvatar } from './AdminUserUi';

const UserInformation = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { user } = route.params || {};
  const insets = useSafeAreaInsets();
  const [isAccountActive, setIsAccountActive] = useState(user?.status?.toLowerCase() === 'active');
  const [liveSellingEnabled, setLiveSellingEnabled] = useState(
    () => String(user?.liveFlag || '').toLowerCase() === 'yes',
  );
  const [isUpdatingLiveFlag, setIsUpdatingLiveFlag] = useState(false);
  const [businessEnabled, setBusinessEnabled] = useState(false);
  const [businessEligible, setBusinessEligible] = useState(false);
  const [isLoadingBusiness, setIsLoadingBusiness] = useState(false);
  const [isUpdatingBusiness, setIsUpdatingBusiness] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [isCountryModalVisible, setIsCountryModalVisible] = useState(false);
  const [isBuyerTypeModalVisible, setIsBuyerTypeModalVisible] = useState(false);
  const [isDeletingUser, setIsDeletingUser] = useState(false);
  
  // Available countries (Buyers are US only)
  const countries = [
    { code: 'US', name: 'United States' },
    { code: 'PH', name: 'Philippines' },
    { code: 'TH', name: 'Thailand' },
    { code: 'ID', name: 'Indonesia' },
    { code: 'SG', name: 'Singapore' },
    { code: 'VN', name: 'Vietnam' },
    { code: 'TW', name: 'Taiwan' },
  ];
  
  // Editable fields state
  const [editableFields, setEditableFields] = useState({
    country: user?.country || '',
    countryCode: user?.countryCode || '',
    gardenOrCompanyName: user?.gardenOrCompanyName || '',
    firstName: '',
    lastName: '',
    contactNumber: user?.contactNumber || user?.phone || '',
    buyerType: user?.buddy_type || user?.buyerType || '' // Read from buddy_type field in Firestore
  });
  
  // Form editing mode
  const [isEditing, setIsEditing] = useState(false);

  if (!user) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>No user data provided</Text>
      </View>
    );
  }

  // Convert country name to country code
  const getCountryCodeFromName = (countryName) => {
    if (!countryName) return '';
    
    const nameToCodeMap = {
      'United States': 'US',
      'Philippines': 'PH',
      'Thailand': 'TH',
      'Indonesia': 'ID',
      'Singapore': 'SG',
      'Vietnam': 'VN',
      'Taiwan': 'TW',
    };
    
    // If it's already a country code, just return it
    if (Object.values(nameToCodeMap).includes(countryName)) {
      return countryName;
    }
    
    // Return the code if it exists in our map, otherwise return the name
    return nameToCodeMap[countryName] || countryName;
  };
  
  // Convert country code to full country name
  const getFullCountryName = (countryCode) => {
    if (!countryCode) return '';
    
    const countryMap = {
      'US': 'United States',
      'PH': 'Philippines',
      'TH': 'Thailand',
      'ID': 'Indonesia',
      'SG': 'Singapore',
      'VN': 'Vietnam',
      'TW': 'Taiwan',
    };
    
    // If it's already a full country name, just return it
    if (Object.values(countryMap).includes(countryCode)) {
      return countryCode;
    }
    
    // Return the full name if it exists in our map, otherwise return the code
    return countryMap[countryCode] || countryCode;
  };

  // Extract first and last name properly
  let firstName = user?.firstName || '';
  let lastName = user?.lastName || '';
  
  // Fallback to splitting user.name if firstName and lastName are not available
  if ((!firstName || !lastName) && user?.name) {
    const nameParts = user.name.split(' ');
    const extractedFirstName = nameParts[0] || '';
    const extractedLastName = nameParts.slice(1).join(' ') || '';
    if (!firstName) firstName = extractedFirstName;
    if (!lastName) lastName = extractedLastName;
  }

  // Check if user is a buyer (check both role and rawRole for compatibility)
  const isBuyer = user?.role?.toLowerCase() === 'buyer' || user?.rawRole?.toLowerCase() === 'buyer';
  const isSupplier =
    user?.role === 'Supplier' || user?.rawRole?.toLowerCase() === 'supplier';

  // The saved values, used to fill the form and to throw away edits on Cancel.
  const initialFields = () => {
    const countryCode = user.country && user.country.length <= 2 ? user.country : '';
    const countryName = getFullCountryName(user.country) || '';
    return {
      country: countryName || 'United States',
      countryCode: countryCode || 'US',
      gardenOrCompanyName: user.gardenOrCompanyName || '',
      firstName: (firstName || '').trim(),
      lastName: (lastName || '').trim(),
      contactNumber: user.contactNumber || user.phone || '',
      buyerType: user.buddy_type || user.buyerType || '', // Read from buddy_type field in Firestore
    };
  };

  useEffect(() => {
    if (user) setEditableFields(initialFields());
  }, [user]);

  useEffect(() => {
    setLiveSellingEnabled(String(user?.liveFlag || '').toLowerCase() === 'yes');
  }, [user?.id, user?.liveFlag]);

  useEffect(() => {
    const supplierId = user?.id || user?.userId;
    if (!isSupplier || !supplierId) {
      setBusinessEligible(false);
      return;
    }
    let cancelled = false;
    (async () => {
      setIsLoadingBusiness(true);
      const result = await getB2BAccountApi({uid: supplierId, collectionName: 'supplier'});
      if (cancelled) return;
      const accountClass = result?.data?.account?.accountClass || '';
      const eligible = accountClass === 'Asia Seller' || accountClass === 'Asia Business';
      setBusinessEligible(eligible);
      setBusinessEnabled(result?.data?.account?.canSelfSwitch === true);
      setIsLoadingBusiness(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [isSupplier, user?.id, user?.userId]);

  // Handle user profile update
  const handleProfileUpdate = async () => {
    if (isUpdatingProfile) return;
    
    try {
      setIsUpdatingProfile(true);
      
      // Get auth token
      const authToken = await getStoredAuthToken();
      if (!authToken) {
        throw new Error('Authentication token not available');
      }
      
      // Prepare request data
      const requestData = {
        userId: user.id || user.userId,
        // Send the full country name (e.g., "Philippines", "Thailand") to the API
        country: editableFields.country || getFullCountryName(editableFields.countryCode),
        gardenOrCompanyName: editableFields.gardenOrCompanyName,
        firstName: editableFields.firstName,
        lastName: editableFields.lastName,
        contactNumber: editableFields.contactNumber
      };
      
      // Only include buyerType if user is a buyer
      if (isBuyer) {
        requestData.buyerType = editableFields.buyerType || '';
      }
      
      console.log('Updating user profile:', requestData);
      
      // Make API call to update user
      const response = await fetch(`${API_CONFIG.BASE_URL}/updateUserStatus`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify(requestData)
      });
      
      const responseText = await response.text();
      console.log('Response:', responseText);
      
      let responseData;
      try {
        responseData = JSON.parse(responseText);
      } catch (e) {
        console.error('Error parsing response:', e);
        throw new Error('Invalid response from server');
      }
      
      if (!response.ok) {
        throw new Error(responseData.error || responseData.message || 'Failed to update user profile');
      }
      
      // Turn off editing mode
      setIsEditing(false);
      
      // Show success message
      Alert.alert(
        "Success",
        "User profile updated successfully.",
        [{ text: "OK" }]
      );
      
    } catch (error) {
      console.error('Error updating user profile:', error);
      
      // Show error message
      Alert.alert(
        "Error",
        `Failed to update user profile: ${error.message}`,
        [{ text: "OK" }]
      );
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  // Toggle editing mode
  const toggleEditMode = () => {
    if (isUpdatingProfile) return;
    
    if (isEditing) {
      // If we're currently editing, submit the changes
      handleProfileUpdate();
    } else {
      // If we're not editing, enter edit mode
      // Make sure country information is properly set before entering edit mode
      if (!editableFields.country && user.country) {
        const countryCode = user.country && user.country.length <= 2 ? user.country : '';
        const countryName = getFullCountryName(user.country) || '';
        
        setEditableFields(prev => ({
          ...prev,
          country: countryName,
          countryCode: countryCode || getCountryCodeFromName(countryName)
        }));
      }
      setIsEditing(true);
    }
  };
  
  // Handle country selection
  const handleCountrySelect = (country) => {
    // Store the full country name for display, but keep track of the code too
    setEditableFields(prev => ({
      ...prev, 
      country: country.name,
      countryCode: country.code // Store the code for API calls
    }));
    setIsCountryModalVisible(false);
  };

  // Handle buyer type selection
  const handleBuyerTypeSelect = (buyerType) => {
    setEditableFields(prev => ({
      ...prev,
      buyerType: buyerType
    }));
    setIsBuyerTypeModalVisible(false);
  };

  // Handle account status toggle
  const handleAccountStatusToggle = async () => {
    // Don't allow multiple simultaneous updates
    if (isUpdatingStatus) return;
    
    try {
      setIsUpdatingStatus(true);
      
      // API only accepts "active" | "de-activate"
      const newStatus = isAccountActive ? 'de-activate' : 'active';
      
      // Get auth token
      const authToken = await getStoredAuthToken();
      if (!authToken) {
        throw new Error('Authentication token not available');
      }
      
      // Prepare request data
      const requestData = {
        userId: user.id || user.userId,
        status: newStatus
      };
      
      console.log('Updating user status:', requestData);
      
      // Make API call to update user status
      const response = await fetch(`${API_CONFIG.BASE_URL}/updateUserStatus`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify(requestData)
      });
      
      const responseText = await response.text();
      console.log('Response:', responseText);
      
      let responseData;
      try {
        responseData = JSON.parse(responseText);
      } catch (e) {
        console.error('Error parsing response:', e);
        throw new Error('Invalid response from server');
      }
      
      if (!response.ok) {
        throw new Error(responseData.error || responseData.message || 'Failed to update user status');
      }
      
      // Update local state
      setIsAccountActive(!isAccountActive);
      
      // Show success message
      Alert.alert(
        "Success",
        `User account has been ${newStatus === 'active' ? 'activated' : 'deactivated'} successfully.`,
        [{ text: "OK" }]
      );
      
    } catch (error) {
      console.error('Error updating user status:', error);
      
      // Show error message
      Alert.alert(
        "Error",
        `Failed to update user status: ${error.message}`,
        [{ text: "OK" }]
      );
    } finally {
      setIsUpdatingStatus(false);
    }
  };


  const handleLiveSellingToggle = async () => {
    if (!isSupplier || isUpdatingLiveFlag) return;
    const nextFlag = liveSellingEnabled ? 'No' : 'Yes';
    try {
      setIsUpdatingLiveFlag(true);
      const authToken = await getStoredAuthToken();
      if (!authToken) {
        throw new Error('Authentication token not available');
      }
      const requestData = {
        userId: user.id || user.userId,
        liveFlag: nextFlag,
      };
      const response = await fetch(`${API_CONFIG.BASE_URL}/updateUserStatus`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify(requestData),
      });
      const responseText = await response.text();
      let responseData;
      try {
        responseData = JSON.parse(responseText);
      } catch (e) {
        throw new Error('Invalid response from server');
      }
      if (!response.ok) {
        throw new Error(responseData.message || responseData.error || 'Failed to update live selling');
      }
      setLiveSellingEnabled(nextFlag === 'Yes');
      Alert.alert(
        'Success',
        nextFlag === 'Yes'
          ? 'Live selling is enabled for this supplier.'
          : 'Live selling is disabled for this supplier.',
        [{ text: 'OK' }],
      );
    } catch (error) {
      console.error('Error updating liveFlag:', error);
      Alert.alert(
        'Error',
        `Failed to update live selling: ${error.message}`,
        [{ text: 'OK' }],
      );
    } finally {
      setIsUpdatingLiveFlag(false);
    }
  };

  const handleBusinessToggle = async () => {
    if (!isSupplier || !businessEligible || isUpdatingBusiness) return;
    const nextEnabled = !businessEnabled;
    if (nextEnabled && !liveSellingEnabled) {
      Alert.alert(
        'Live selling is off',
        'Turn Live selling on before setting this supplier to Business. They stay Asia Seller until then.',
        [{text: 'OK'}],
      );
      return;
    }
    try {
      setIsUpdatingBusiness(true);
      const result = await setB2BBusinessApi({
        uid: user.id || user.userId,
        enabled: nextEnabled,
        liveFlag: liveSellingEnabled ? 'Yes' : 'No',
      });
      if (!result.success) {
        throw new Error(result.error || 'Failed to update business setting');
      }
      setBusinessEnabled(
        nextEnabled && (result.data?.canSelfSwitch === true || result.data?.enabled === true),
      );
      Alert.alert(
        'Success',
        nextEnabled
          ? 'This garden can now switch between Garden Partner and mainstream.'
          : 'This garden can no longer switch. They stay a Garden Partner.',
        [{text: 'OK'}],
      );
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to update business setting', [{text: 'OK'}]);
    } finally {
      setIsUpdatingBusiness(false);
    }
  };

  // Handle user deletion with useCallback to avoid React hook errors
  const confirmDeleteUser = useCallback(async () => {
    try {
      setIsDeletingUser(true);
      
      const userId = user.id || user.userId;
      console.log('Deleting user with ID:', userId);
      
      const response = await deleteUserApi(userId, "Deleted by administrator");
      console.log('Delete response:', response);
      
      Alert.alert(
        "Success",
        "User account has been deleted successfully",
        [
          { 
            text: "OK",
            onPress: () => navigation.goBack()
          }
        ]
      );
    } catch (error) {
      console.error('Error deleting user:', error);
      
      Alert.alert(
        "Error",
        `Failed to delete user: ${error.message}`,
        [{ text: "OK" }]
      );
    } finally {
      setIsDeletingUser(false);
    }
  }, [user, navigation]);

  const handleDeleteUser = useCallback(() => {
    Alert.alert(
      "Delete User",
      `Are you sure you want to delete this user account? This action cannot be undone.`,
      [
        { 
          text: "Cancel",
          style: "cancel"
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: confirmDeleteUser
        }
      ]
    );
  }, [confirmDeleteUser]);

  const isSellerView = !isBuyer;
  const garden = String(editableFields.gardenOrCompanyName || user.gardenOrCompanyName || '').trim();
  const personName = `${editableFields.firstName || ''} ${editableFields.lastName || ''}`.replace(/\s+/g, ' ').trim() || user.name;
  // Sellers are known by their garden; the person's name moves to the line below.
  const heroTitle = isSellerView && garden ? garden : personName;
  const email = user.email || '';
  const countryCode = getCountryCodeFromName(editableFields.country);
  const buyerTypeLabel = editableFields.buyerType
    ? editableFields.buyerType.charAt(0).toUpperCase() + editableFields.buyerType.slice(1)
    : '';

  const setField = (key) => (text) => setEditableFields(prev => ({ ...prev, [key]: text }));

  const cancelEdit = () => {
    setEditableFields(initialFields());
    setIsEditing(false);
  };

  return (
    <SafeAreaView style={styles.container} edges={['left', 'right']}>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel="Back"
          onPress={() => navigation.goBack()}
          style={styles.iconButton}
          activeOpacity={0.8}>
          <BackIcon width={22} height={22} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{isSellerView ? 'Seller' : 'Buyer'} details</Text>
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel="Delete user"
          onPress={handleDeleteUser}
          disabled={isDeletingUser}
          style={[styles.iconButton, styles.deleteButton]}
          activeOpacity={0.8}>
          {isDeletingUser ? <Loading visible size={20} color="#C8341C" /> : <TrashGlyph />}
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>
        {/* Who this is, at a glance */}
        <Animated.View entering={FadeInUp.duration(280)} style={styles.heroCard}>
          <UserAvatar user={user} title={heroTitle} size={80} />
          <Text style={styles.heroTitle} numberOfLines={2}>{heroTitle}</Text>
          {isSellerView && garden ? (
            <Text style={styles.heroSub} numberOfLines={1}>{personName}</Text>
          ) : null}
          <Text style={styles.heroSub} numberOfLines={1}>
            {[user.username ? `@${user.username}` : null, email].filter(Boolean).join('  ·  ')}
          </Text>
          <View style={styles.heroPills}>
            <StatusPill
              status={isAccountActive ? 'active' : 'inactive'}
              label={isAccountActive ? 'Active' : 'Inactive'}
            />
            <RolePill isSeller={isSellerView} />
            {user.isVip ? (
              <View style={styles.vipPill}>
                <Text style={styles.vipText}>VIP</Text>
              </View>
            ) : null}
          </View>
        </Animated.View>

        {!isAccountActive && (
          <Animated.View entering={FadeInUp.duration(280).delay(40)} style={styles.alertBox}>
            <Text style={styles.alertTitle}>This account is inactive</Text>
            <Text style={styles.alertMessage}>They can't sign in or buy until you switch Account active back on.</Text>
          </Animated.View>
        )}

        {/* Account switches */}
        <Animated.View entering={FadeInUp.duration(280).delay(80)}>
          <Text style={styles.sectionLabel}>Account</Text>
          <View style={styles.card}>
            <ToggleRow
              label="Account active"
              hint={isAccountActive ? 'Can sign in and use the app' : 'Blocked from signing in'}
              value={isAccountActive}
              busy={isUpdatingStatus}
              onChange={handleAccountStatusToggle}
            />
            {isSupplier && (
              <ToggleRow
                divider
                label="Live selling"
                hint="Can run lives and add live listings"
                value={liveSellingEnabled}
                busy={isUpdatingLiveFlag}
                onChange={handleLiveSellingToggle}
              />
            )}
            {isSupplier && (isLoadingBusiness || businessEligible) && (
              <ToggleRow
                divider
                label="Business"
                hint="Can switch between Garden Partner and mainstream"
                value={businessEnabled}
                busy={isLoadingBusiness || isUpdatingBusiness}
                disabled={!businessEligible}
                onChange={handleBusinessToggle}
              />
            )}
          </View>
        </Animated.View>

        {/* Profile details: read-only until Edit details is pressed */}
        <Animated.View entering={FadeInUp.duration(280).delay(120)}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionLabel}>Details</Text>
            {isEditing ? <Text style={styles.editingTag}>Editing</Text> : null}
          </View>
          <View style={styles.card}>
            <FieldRow label="Country">
              {isEditing ? (
                <TouchableOpacity style={styles.input} onPress={() => setIsCountryModalVisible(true)} activeOpacity={0.8}>
                  <View style={styles.inline}>
                    <CountryFlag code={countryCode} />
                    <Text style={[styles.inputText, !editableFields.country && styles.placeholder]}>
                      {editableFields.country || 'Select country'}
                    </Text>
                  </View>
                  <Text style={styles.chevron}>›</Text>
                </TouchableOpacity>
              ) : (
                <View style={styles.inline}>
                  <CountryFlag code={countryCode} />
                  <Text style={styles.value}>{editableFields.country || 'Not set'}</Text>
                </View>
              )}
            </FieldRow>

            {isSellerView && (
              <FieldRow divider label="Garden / company">
                {isEditing ? (
                  <TextInput
                    style={[styles.input, styles.inputText]}
                    value={editableFields.gardenOrCompanyName}
                    onChangeText={setField('gardenOrCompanyName')}
                    placeholder="Garden or company name"
                    placeholderTextColor={MUTED}
                  />
                ) : (
                  <Text style={[styles.value, !editableFields.gardenOrCompanyName && styles.placeholder]}>
                    {editableFields.gardenOrCompanyName || 'Not provided'}
                  </Text>
                )}
              </FieldRow>
            )}

            <FieldRow divider label="First name">
              {isEditing ? (
                <TextInput
                  style={[styles.input, styles.inputText]}
                  value={editableFields.firstName}
                  onChangeText={setField('firstName')}
                  placeholder="First name"
                  placeholderTextColor={MUTED}
                />
              ) : (
                <Text style={[styles.value, !editableFields.firstName && styles.placeholder]}>
                  {editableFields.firstName || 'Not provided'}
                </Text>
              )}
            </FieldRow>

            <FieldRow divider label="Last name">
              {isEditing ? (
                <TextInput
                  style={[styles.input, styles.inputText]}
                  value={editableFields.lastName}
                  onChangeText={setField('lastName')}
                  placeholder="Last name"
                  placeholderTextColor={MUTED}
                />
              ) : (
                <Text style={[styles.value, !editableFields.lastName && styles.placeholder]}>
                  {editableFields.lastName || 'Not provided'}
                </Text>
              )}
            </FieldRow>

            <FieldRow divider label="Contact number">
              {isEditing ? (
                <TextInput
                  style={[styles.input, styles.inputText]}
                  value={editableFields.contactNumber}
                  onChangeText={setField('contactNumber')}
                  placeholder="Contact number"
                  keyboardType="phone-pad"
                  placeholderTextColor={MUTED}
                />
              ) : (
                <Text style={[styles.value, !editableFields.contactNumber && styles.placeholder]}>
                  {editableFields.contactNumber || 'Not provided'}
                </Text>
              )}
            </FieldRow>

            {isBuyer && (
              <FieldRow divider label="Buyer type">
                {isEditing ? (
                  <TouchableOpacity style={styles.input} onPress={() => setIsBuyerTypeModalVisible(true)} activeOpacity={0.8}>
                    <Text style={[styles.inputText, !buyerTypeLabel && styles.placeholder]}>
                      {buyerTypeLabel || 'Select buyer type (optional)'}
                    </Text>
                    <Text style={styles.chevron}>›</Text>
                  </TouchableOpacity>
                ) : (
                  <Text style={[styles.value, !buyerTypeLabel && styles.placeholder]}>{buyerTypeLabel || 'Not set'}</Text>
                )}
              </FieldRow>
            )}

            <FieldRow divider label="Email">
              <Text style={[styles.value, !email && styles.placeholder]} selectable>{email || 'Not provided'}</Text>
            </FieldRow>
          </View>
        </Animated.View>
      </ScrollView>

      {/* Primary action in the thumb zone */}
      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 12) }]}>
        {isEditing ? (
          <>
            <TouchableOpacity
              style={[styles.button, styles.secondaryButton]}
              onPress={cancelEdit}
              disabled={isUpdatingProfile}
              activeOpacity={0.85}>
              <Text style={styles.secondaryButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, styles.primaryButton, isUpdatingProfile && styles.disabledButton]}
              onPress={toggleEditMode}
              disabled={isUpdatingProfile}
              activeOpacity={0.85}>
              {isUpdatingProfile ? (
                <Loading visible size={20} color="#FFFFFF" />
              ) : (
                <Text style={styles.primaryButtonText}>Save changes</Text>
              )}
            </TouchableOpacity>
          </>
        ) : (
          <TouchableOpacity style={[styles.button, styles.primaryButton]} onPress={toggleEditMode} activeOpacity={0.85}>
            <PencilGlyph color="#FFFFFF" />
            <Text style={styles.primaryButtonText}>Edit details</Text>
          </TouchableOpacity>
        )}
      </View>

      <OptionSheet
        visible={isCountryModalVisible}
        title="Select country"
        onClose={() => setIsCountryModalVisible(false)}
        options={countries.map(c => ({ key: c.code, label: c.name, flag: c.code, selected: editableFields.country === c.name, onPress: () => handleCountrySelect(c) }))}
      />
      <OptionSheet
        visible={isBuyerTypeModalVisible}
        title="Buyer type"
        onClose={() => setIsBuyerTypeModalVisible(false)}
        options={[
          { key: 'none', label: 'None', selected: !editableFields.buyerType, onPress: () => handleBuyerTypeSelect('') },
          { key: 'receiver', label: 'Receiver', selected: editableFields.buyerType === 'receiver', onPress: () => handleBuyerTypeSelect('receiver') },
          { key: 'joiner', label: 'Joiner', selected: editableFields.buyerType === 'joiner', onPress: () => handleBuyerTypeSelect('joiner') },
        ]}
      />
    </SafeAreaView>
  );
};

const FLAG_ICONS = { US: UsFlag, PH: PhFlag, TH: ThFlag, ID: IdFlag };
const FLAG_EMOJI = { SG: '🇸🇬', VN: '🇻🇳', TW: '🇹🇼' };

const CountryFlag = ({ code, size = 20 }) => {
  const Icon = FLAG_ICONS[code];
  if (Icon) return <Icon width={size} height={size} />;
  if (FLAG_EMOJI[code]) return <Text style={{ fontSize: size - 2 }}>{FLAG_EMOJI[code]}</Text>;
  return null;
};

const ToggleRow = ({ label, hint, value, busy, disabled, onChange, divider }) => (
  <View style={[styles.row, divider && styles.rowDivider]}>
    <View style={styles.rowText}>
      <Text style={styles.rowLabel}>{label}</Text>
      {hint ? <Text style={styles.rowHint}>{hint}</Text> : null}
    </View>
    {busy ? (
      <View style={styles.switchSlot}>
        <Loading visible size={22} color={GREEN} />
      </View>
    ) : (
      <Switch
        value={value}
        onValueChange={onChange}
        disabled={disabled}
        trackColor={{ false: '#D5D9D4', true: GREEN }}
        ios_backgroundColor="#D5D9D4"
        thumbColor="#FFFFFF"
      />
    )}
  </View>
);

const FieldRow = ({ label, children, divider }) => (
  <View style={[styles.field, divider && styles.rowDivider]}>
    <Text style={styles.fieldLabel}>{label}</Text>
    {children}
  </View>
);

const OptionSheet = ({ visible, title, options, onClose }) => {
  const insets = useSafeAreaInsets();
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableOpacity style={styles.sheetOverlay} activeOpacity={1} onPress={onClose}>
        <TouchableOpacity activeOpacity={1} style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 16) }]}>
          <View style={styles.sheetHandle} />
          <Text style={styles.sheetTitle}>{title}</Text>
          <ScrollView>
            {options.map(o => (
              <TouchableOpacity key={o.key} style={styles.option} onPress={o.onPress} activeOpacity={0.8}>
                <View style={styles.inline}>
                  {o.flag ? <CountryFlag code={o.flag} size={24} /> : null}
                  <Text style={[styles.optionText, o.selected && styles.optionTextSelected]}>{o.label}</Text>
                </View>
                {o.selected ? <Text style={styles.check}>✓</Text> : null}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: PAGE_BG,
  },
  errorText: {
    padding: 24,
    color: MUTED,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 8,
    backgroundColor: PAGE_BG,
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#E9ECE8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteButton: {
    backgroundColor: '#FDECEA',
  },
  headerTitle: {
    fontFamily: 'Inter',
    fontSize: 18,
    fontWeight: '700',
    color: INK,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 32,
    gap: 16,
  },
  heroCard: {
    alignItems: 'center',
    gap: 4,
    paddingVertical: 24,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    shadowColor: GREEN_DARK,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.07,
    shadowRadius: 16,
    elevation: 2,
  },
  heroTitle: {
    marginTop: 12,
    fontFamily: 'Inter',
    fontSize: 20,
    fontWeight: '700',
    color: INK,
    textAlign: 'center',
  },
  heroSub: {
    fontFamily: 'Inter',
    fontSize: 14,
    color: MUTED,
    textAlign: 'center',
  },
  heroPills: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 12,
  },
  vipPill: {
    height: 24,
    paddingHorizontal: 8,
    borderRadius: 12,
    justifyContent: 'center',
    backgroundColor: '#FFF3D6',
  },
  vipText: {
    fontFamily: 'Inter',
    fontSize: 12,
    fontWeight: '700',
    color: '#8A6100',
  },
  alertBox: {
    padding: 16,
    borderRadius: 16,
    backgroundColor: '#FDECEA',
    gap: 4,
  },
  alertTitle: {
    fontFamily: 'Inter',
    fontSize: 14,
    fontWeight: '700',
    color: '#B3261E',
  },
  alertMessage: {
    fontFamily: 'Inter',
    fontSize: 14,
    color: '#7A2E28',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionLabel: {
    marginBottom: 8,
    marginLeft: 4,
    fontFamily: 'Inter',
    fontSize: 13,
    fontWeight: '700',
    color: MUTED,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  editingTag: {
    marginBottom: 8,
    fontFamily: 'Inter',
    fontSize: 12,
    fontWeight: '700',
    color: GREEN_DARK,
  },
  card: {
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    shadowColor: GREEN_DARK,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 2,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 16,
  },
  rowDivider: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#E4E7E9',
  },
  rowText: {
    flex: 1,
    gap: 2,
  },
  rowLabel: {
    fontFamily: 'Inter',
    fontSize: 16,
    fontWeight: '600',
    color: INK,
  },
  rowHint: {
    fontFamily: 'Inter',
    fontSize: 13,
    color: MUTED,
  },
  switchSlot: {
    width: 51,
    alignItems: 'center',
  },
  field: {
    paddingVertical: 12,
    gap: 4,
  },
  fieldLabel: {
    fontFamily: 'Inter',
    fontSize: 13,
    color: MUTED,
  },
  value: {
    fontFamily: 'Inter',
    fontSize: 16,
    fontWeight: '600',
    color: INK,
  },
  placeholder: {
    color: '#9AA4A8',
    fontWeight: '400',
  },
  inline: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  input: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#C7E2CC',
    backgroundColor: '#F7FBF7',
  },
  inputText: {
    fontFamily: 'Inter',
    fontSize: 16,
    color: INK,
  },
  chevron: {
    fontSize: 22,
    color: MUTED,
  },
  footer: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 16,
    paddingTop: 12,
    backgroundColor: PAGE_BG,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#E4E7E9',
  },
  button: {
    flex: 1,
    height: 52,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  primaryButton: {
    backgroundColor: GREEN,
    shadowColor: GREEN,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 4,
  },
  primaryButtonText: {
    fontFamily: 'Inter',
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  secondaryButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D5D9D4',
  },
  secondaryButtonText: {
    fontFamily: 'Inter',
    fontSize: 16,
    fontWeight: '700',
    color: INK,
  },
  disabledButton: {
    opacity: 0.7,
  },
  sheetOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  sheet: {
    maxHeight: '70%',
    paddingHorizontal: 16,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    backgroundColor: '#FFFFFF',
  },
  sheetHandle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    marginTop: 8,
    backgroundColor: '#D5D9D4',
  },
  sheetTitle: {
    paddingVertical: 16,
    fontFamily: 'Inter',
    fontSize: 18,
    fontWeight: '700',
    color: INK,
  },
  option: {
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#E4E7E9',
  },
  optionText: {
    fontFamily: 'Inter',
    fontSize: 16,
    color: INK,
  },
  optionTextSelected: {
    fontWeight: '700',
    color: GREEN_DARK,
  },
  check: {
    fontSize: 18,
    fontWeight: '700',
    color: GREEN,
  },
});

export default UserInformation;
