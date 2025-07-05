import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Platform,
  Dimensions,
  FlatList,
  Image,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useFocusEffect} from '@react-navigation/native';

// Import icons - using a placeholder for the back arrow and action icon
import BackIcon from '../../../assets/iconnav/caret-left-bold.svg';
import DownloadIcon from '../../../assets/icons/accent/download.svg';

const qrCodeData = [
  {
    date: 'July 05, 2025',
    page: '1 of 2',
    qrcodes: [
      {id: '1', code: 'PLANT-001'},
      {id: '2', code: 'PLANT-002'},
      {id: '3', code: 'PLANT-003'},
      {id: '4', code: 'PLANT-004'},
      {id: '5', code: 'PLANT-005'},
      {id: '6', code: 'PLANT-006'},
      {id: '7', code: 'PLANT-007'},
      {id: '8', code: 'PLANT-008'},
      {id: '9', code: 'PLANT-009'},
      {id: '10', code: 'PLANT-010'},
      {id: '11', code: 'PLANT-011'},
      {id: '12', code: 'PLANT-012'},
      {id: '13', code: 'PLANT-013'},
      {id: '14', code: 'PLANT-014'},
      {id: '15', code: 'PLANT-015'},
      {id: '16', code: 'PLANT-016'},
      {id: '17', code: 'PLANT-017'},
      {id: '18', code: 'PLANT-018'},
      {id: '19', code: 'PLANT-019'},
      {id: '20', code: 'PLANT-020'},
    ],
  },
  {
    date: 'July 06, 2025',
    page: '2 of 2',
    qrcodes: [
      {id: '21', code: 'PLANT-021'},
      {id: '22', code: 'PLANT-022'},
      {id: '23', code: 'PLANT-023'},
      {id: '24', code: 'PLANT-024'},
      {id: '25', code: 'PLANT-025'},
      {id: '26', code: 'PLANT-026'},
      {id: '27', code: 'PLANT-027'},
      {id: '28', code: 'PLANT-028'},
      {id: '29', code: 'PLANT-029'},
      {id: '30', code: 'PLANT-030'},
      {id: '31', code: 'PLANT-031'},
      {id: '32', code: 'PLANT-032'},
      {id: '33', code: 'PLANT-033'},
      {id: '34', code: 'PLANT-034'},
      {id: '35', code: 'PLANT-035'},
      {id: '36', code: 'PLANT-036'},
      {id: '37', code: 'PLANT-037'},
      {id: '38', code: 'PLANT-038'},
      {id: '39', code: 'PLANT-039'},
      {id: '40', code: 'PLANT-040'},
    ],
  },
];

const ScreenExportQR = ({navigation}) => {
  const insets = useSafeAreaInsets();

  useFocusEffect(() => {
    if (Platform.OS === 'android') {
      StatusBar.setBarStyle('dark-content');
      StatusBar.setBackgroundColor('#fff');
    }
  });

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.content}>
        <View style={styles.controls}>
          {/* Back Button */}
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}>
            <BackIcon width={24} height={24} />
          </TouchableOpacity>

          {/* Navbar Right */}
          <View style={styles.navbarRight}>
            {/* Search - Hidden by default */}
            <View style={[styles.searchButton, {display: 'none'}]}>
              {/* Search icon would go here */}
            </View>

            {/* Action Button */}
            <TouchableOpacity style={styles.actionButton}>
              <DownloadIcon width={24} height={24} />
            </TouchableOpacity>

            {/* Profile - Hidden by default */}
            <View style={[styles.profileButton, {display: 'none'}]}>
              {/* Profile content would go here */}
            </View>

            {/* Page - Hidden by default */}
            <View style={[styles.pageButton, {display: 'none'}]}>
              {/* Page content would go here */}
            </View>

            {/* Link - Hidden by default */}
            <View style={[styles.linkButton, {display: 'none'}]}>
              {/* Link content would go here */}
            </View>
          </View>

          {/* Title */}
          <Text style={styles.title}>Export QR Code</Text>
        </View>
      </View>

      {/* Main Content Area */}
      <View style={styles.mainContent}>
        <FlatList
          data={qrCodeData}
          keyExtractor={(item, index) => `page-${index}`}
          renderItem={({item: pageData}) => (
            <View style={styles.pageContainer}>
              <View style={styles.contentWrapper}>
                <View style={styles.detailsContainer}>
                  <View style={styles.dateContainer}>
                    <Text style={styles.dateLabel}>Date generated:</Text>
                    <Text style={styles.dateText}>Jun-22-2025 08:11PM</Text>
                  </View>
                  <View style={styles.pageInfoContainer}>
                    <Text style={styles.pageText}>Page {pageData.page.split(' ')[0]}</Text>
                  </View>
                </View>
                <View style={styles.qrListContainer}>
                  {pageData.qrcodes.map((item, index) => {
                    const row = Math.floor(index / 4);
                    const col = index % 4;
                    // Calculate positions based on available width
                    const containerWidth = Dimensions.get('window').width - 48; // Account for padding
                    const itemWidth = 80;
                    const spacing = (containerWidth - (itemWidth * 4)) / 3; // Space between items
                    const left = col * (itemWidth + spacing);
                    const top = row * itemWidth; // No vertical spacing between rows
                    
                    return (
                      <View 
                        key={item.id}
                        style={[
                          styles.qrItemContainer,
                          {
                            left: left,
                            top: top,
                          }
                        ]}
                      >
                        <View style={styles.qrItemContent}>
                          <View style={styles.qrContentInner}>
                            <Image
                              source={require('../../../assets/images/qr-code.png')}
                              style={styles.qrCodeImage}
                            />
                            <Text style={styles.plantCode}>{item.code}</Text>
                          </View>
                        </View>
                      </View>
                    );
                  })}
                </View>
              </View>
            </View>
          )}
        />
      </View>
    </SafeAreaView>
  );
};

export default ScreenExportQR;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  content: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    padding: 0,
    width: Dimensions.get('window').width,
    height: 58,
    minHeight: 58,
    alignSelf: 'stretch',
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 6,
    paddingHorizontal: 16,
    paddingBottom: 12,
    width: Dimensions.get('window').width,
    height: 58,
    minHeight: 58,
    alignSelf: 'stretch',
    position: 'relative',
  },
  backButton: {
    width: 24,
    height: 24,
    zIndex: 0,
  },
  navbarRight: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    padding: 0,
    gap: 12,
    width: 319,
    height: 40,
    flex: 1,
    zIndex: 1,
  },
  searchButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    width: 40,
    height: 40,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CDD3D4',
    borderRadius: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    width: 40,
    height: 40,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CDD3D4',
    borderRadius: 12,
  },
  profileButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 4,
    width: 40,
    height: 40,
  },
  pageButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 6,
    width: 33,
    height: 32,
    minHeight: 32,
    borderRadius: 1000,
  },
  linkButton: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingHorizontal: 8,
    width: 54,
    height: 22,
  },
  title: {
    position: 'absolute',
    width: 240,
    height: 24,
    left: Dimensions.get('window').width / 2 - 240 / 2 + 0.5,
    top: 14,
    fontWeight: '700',
    fontSize: 18,
    lineHeight: 24,
    textAlign: 'center',
    color: '#202325',
    zIndex: 2,
  },
  mainContent: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 0,
    paddingHorizontal: 16,
  },
  pageContainer: {
    flexDirection: 'column',
    alignItems: 'center',
    padding: 0,
    width: Dimensions.get('window').width - 32, // Fit screen with padding
    backgroundColor: '#FFFFFF',
    flex: 0,
    marginBottom: 20,
  },
  contentWrapper: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    paddingVertical: 16,
    paddingHorizontal: 8,
    width: '100%',
    flex: 0,
    alignSelf: 'stretch',
  },
  detailsContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 0,
    paddingVertical: 0,
    gap: 12,
    width: '100%',
    height: 48,
    flex: 0,
    alignSelf: 'stretch',
    marginBottom: 8,
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 0,
    paddingVertical: 0,
    gap: 4,
    width: 280.5,
    height: 12,
    flex: 0,
    order: 0,
  },
  dateLabel: {
    width: 78,
    height: 12,
    fontFamily: 'Inter',
    fontWeight: '500',
    fontSize: 10,
    lineHeight: 12,
    color: '#202325',
    flex: 0,
    order: 0,
  },
  dateText: {
    width: 110,
    height: 12,
    fontFamily: 'Inter',
    fontWeight: '700',
    fontSize: 10,
    lineHeight: 12,
    color: '#202325',
    flex: 0,
    order: 1,
  },
  pageInfoContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingHorizontal: 0,
    paddingVertical: 0,
    gap: 10,
    width: 280.5,
    height: 12,
    flex: 1,
    order: 1,
  },
  pageText: {
    width: 32,
    height: 12,
    fontFamily: 'Inter',
    fontWeight: '500',
    fontSize: 10,
    lineHeight: 12,
    color: '#202325',
    textAlign: 'right',
    flex: 0,
    order: 0,
  },
  qrList: {
    width: '100%',
    alignSelf: 'stretch',
    flex: 0,
  },
  qrListContainer: {
    position: 'relative',
    width: '100%',
    minHeight: 400,
  },
  qrItemContainer: {
    position: 'absolute',
    width: 80, // Scaled for mobile
    height: 80, // Scaled for mobile
  },
  qrItemContent: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8, // Scaled for mobile
    gap: 4, // Scaled for mobile
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CDD3D4',
    width: '100%',
    height: '100%',
  },
  qrContentInner: {
    flexDirection: 'column',
    alignItems: 'center',
    paddingHorizontal: 0,
    paddingVertical: 0,
    gap: 4, // Scaled for mobile
    width: '100%',
    flex: 1,
  },
  qrCodeImage: {
    width: 55, // Scaled for mobile
    height: 55, // Scaled for mobile
    flex: 0,
  },
  plantCode: {
    fontFamily: 'Inter',
    fontWeight: '700',
    fontSize: 8, // Scaled for mobile
    lineHeight: 10, // Scaled for mobile
    textAlign: 'center',
    color: '#202325',
    alignSelf: 'stretch',
    flex: 0,
  },
});
