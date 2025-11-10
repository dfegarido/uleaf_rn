import React, {useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Touchable,
} from 'react-native';
import ActionSheet from '../../../../components/ActionSheet/ActionSheet';
// import IconEx from '../../assets/icons/greylight/x-regular.svg';
// import {globalStyles} from '../../assets/styles/styles';
import IconEx from '../../../../assets/icons/greylight/x-regular.svg';
import {globalStyles} from '../../../../assets/styles/styles';
import IconNote from '../../../../assets/icons/greydark/note-edit.svg';
import IconTrash from '../../../../assets/icons/greydark/trash-regular.svg';
import IconRight from '../../../../assets/icons/greylight/caret-right-regular.svg';
import IconStocks from '../../../../assets/icons/greydark/box-regular.svg';
import BoxIcon from '../../../../assets/icons/greydark/box-regular.svg';
import ExCircleIcon from '../../../../assets/icons/greydark/x-circle.svg';

const DeliverActionSheetEdit = ({
  visible,
  onClose,
  onPressDeliverToHub,
  onPressMissing,
  onPressCasualty,
}) => {
  return (
    <>
      <ActionSheet visible={visible} onClose={onClose} heightPercent={'35%'}>
        <View
          style={{
            paddingHorizontal: 20,
            paddingTop: 20,
            paddingBottom: 10,
            flexDirection: 'column',
          }}>
          <TouchableOpacity
            onPress={() => {
              onPressDeliverToHub();
            }}
            activeOpacity={0.7}
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              paddingVertical: 16,
              paddingHorizontal: 4,
              borderBottomWidth: 1,
              borderBottomColor: '#E4E7E9',
            }}>
            <View style={{flexDirection: 'row', alignItems: 'center', flex: 1}}>
              <BoxIcon width={20} height={20} />
              <Text style={{paddingLeft: 12, color: '#393D40', fontSize: 16}}>
                Deliver to Hub
              </Text>
            </View>
            <View>
              <IconRight width={20} height={20} />
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => {
              onPressMissing();
            }}
            activeOpacity={0.7}
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              paddingVertical: 16,
              paddingHorizontal: 4,
              borderBottomWidth: 1,
              borderBottomColor: '#E4E7E9',
            }}>
            <View style={{flexDirection: 'row', alignItems: 'center', flex: 1}}>
              <ExCircleIcon width={20} height={20} />
              <Text style={{paddingLeft: 12, color: '#393D40', fontSize: 16}}>
                Tag as missing
              </Text>
            </View>
            <View>
              <IconRight width={20} height={20} />
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => {
              onPressCasualty();
            }}
            activeOpacity={0.7}
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              paddingVertical: 16,
              paddingHorizontal: 4,
            }}>
            <View style={{flexDirection: 'row', alignItems: 'center', flex: 1}}>
              <ExCircleIcon width={20} height={20} />
              <Text style={{paddingLeft: 12, color: '#393D40', fontSize: 16}}>
                Tag as casualty
              </Text>
            </View>
            <View>
              <IconRight width={20} height={20} />
            </View>
          </TouchableOpacity>
        </View>
      </ActionSheet>
    </>
  );
};

const styles = StyleSheet.create({
  sheetTitleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 20,
  },
  sheetTitle: {
    color: '#202325',
    fontSize: 18,
  },
});

export default DeliverActionSheetEdit;
