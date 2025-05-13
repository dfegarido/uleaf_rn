import React, {useState} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  Button,
  Dimensions,
  StyleSheet,
  StatusBar,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {globalStyles} from '../../../assets/styles/styles';
import ActionSheet from '../../../components/ActionSheet/ActionSheet';
import CarouselSell from './components/CarouselSell';

import SinglePlantIcon from '../../../assets/sellicon/single.svg';
import GrowerPlantIcon from '../../../assets/sellicon/growers.svg';
import WholeSalePlantIcon from '../../../assets/sellicon/wholesale.svg';

import DuplicateIcon from '../../../assets/images/duplicate.svg';
import DraftIcon from '../../../assets/images/draft.svg';
import {useFocusEffect} from '@react-navigation/native';
const screenWidth = Dimensions.get('window').width;

const ScreenSell = ({navigation}) => {
  const insets = useSafeAreaInsets();

  useFocusEffect(() => {
    StatusBar.setBarStyle('dark-content');
    StatusBar.setBackgroundColor('#fff');
  });

  const [showSheet, setShowSheet] = useState(false);

  const openSheet = sheetOpen => {
    setShowSheet(!sheetOpen);
  };

  const handlePressSingle = () => {
    navigation.navigate('ScreenSingleSell');
  };
  const handlePressWholesale = () => {
    navigation.navigate('ScreenWholesaleSell');
  };
  const handlePressGrowers = () => {
    navigation.navigate('ScreenGrowersSell');
  };
  const handlePressDuplicate = () => {
    navigation.navigate('ScreenDuplicateSell');
  };
  const handlePressDraft = () => {
    navigation.navigate('ScreenDraftSell');
  };

  return (
    <View style={[styles.mainContent, {paddingTop: insets.top}]}>
      <View style={styles.mainContainer}>
        <View style={styles.topContainer}>
          <Text
            style={[
              globalStyles.textXLPrimaryDark,
              {textAlign: 'left', paddingTop: 5},
            ]}>
            Sell Plant
          </Text>
          <TouchableOpacity onPress={() => openSheet(showSheet)}>
            <Text style={globalStyles.textMDAccent}>Existing Listing</Text>
          </TouchableOpacity>
        </View>

        <View style={{paddingTop: 30}}>
          <Text style={globalStyles.textMDGrayDark}>Start from scratch</Text>
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              marginTop: 20,
            }}>
            <View style={[globalStyles.cardLightAccent, styles.cardMenu]}>
              <TouchableOpacity onPress={handlePressSingle}>
                <SinglePlantIcon width={42} height={52}></SinglePlantIcon>
                <Text style={[globalStyles.textLGAccentDark, {paddingTop: 10}]}>
                  Single Plant
                </Text>
              </TouchableOpacity>
            </View>
            <View style={[globalStyles.cardLightAccent, styles.cardMenu]}>
              <TouchableOpacity onPress={handlePressGrowers}>
                <GrowerPlantIcon width={42} height={52}></GrowerPlantIcon>
                <Text style={[globalStyles.textLGAccentDark, {paddingTop: 10}]}>
                  Grower's choice
                </Text>
              </TouchableOpacity>
            </View>
          </View>
          <View
            style={[
              globalStyles.cardLightAccent,
              styles.cardMenuFull,
              {marginTop: 10, justifyContent: 'center', alignItems: 'center'},
            ]}>
            <TouchableOpacity onPress={handlePressWholesale}>
              <WholeSalePlantIcon></WholeSalePlantIcon>
              <Text
                style={[
                  globalStyles.textLGAccentDark,
                  {paddingTop: 10, textAlign: 'center'},
                ]}>
                Wholesale
              </Text>
              <Text
                style={[
                  globalStyles.textMDAccent,
                  {paddingTop: 10, textAlign: 'center'},
                ]}>
                1 order = 10 plants
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={{paddingTop: 30}}>
          <Text style={[globalStyles.textMDGrayDark, {paddingBottom: 10}]}>
            Buyers Wishlist
          </Text>
          <CarouselSell />
        </View>

        <ActionSheet
          visible={showSheet}
          onClose={() => setShowSheet(false)}
          heightPercent={'25%'}>
          <View style={{padding: 20}}>
            <TouchableOpacity onPress={handlePressDuplicate}>
              <View
                style={{
                  borderColor: '#CDD3D4',
                  borderWidth: 1,
                  borderRadius: 10,
                  padding: 10,
                }}>
                <View style={{flexDirection: 'row'}}>
                  <DuplicateIcon width={50} height={50}></DuplicateIcon>
                  <View style={{flexDirection: 'column'}}>
                    <Text
                      style={[globalStyles.textLGGreyDark, {paddingLeft: 4}]}>
                      Duplicate an existing listing
                    </Text>
                    <Text
                      style={[globalStyles.textMDGreyLight, {paddingLeft: 4}]}>
                      Start with a similar listing to save time
                    </Text>
                  </View>
                </View>
              </View>
            </TouchableOpacity>
            <TouchableOpacity onPress={handlePressDraft}>
              <View
                style={{
                  borderColor: '#CDD3D4',
                  borderWidth: 1,
                  borderRadius: 10,
                  padding: 10,
                  marginTop: 10,
                }}>
                <View style={{flexDirection: 'row'}}>
                  <DraftIcon width={50} height={50}></DraftIcon>
                  <View style={{flexDirection: 'column'}}>
                    <Text
                      style={[globalStyles.textLGGreyDark, {paddingLeft: 4}]}>
                      Edit a draft listing
                    </Text>
                    <Text
                      style={[globalStyles.textMDGreyLight, {paddingLeft: 4}]}>
                      Finalize edit and publish
                    </Text>
                  </View>
                </View>
              </View>
            </TouchableOpacity>
          </View>
        </ActionSheet>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  mainContent: {
    flex: 1,
    backgroundColor: '#FFF',
  },
  mainContainer: {
    flex: 1,
    backgroundColor: '#fff',
    marginHorizontal: 20,
  },
  topContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  cardMenu: {padding: 20, width: screenWidth * 0.5 - 25},
  cardMenuFull: {padding: 20},
});

export default ScreenSell;
