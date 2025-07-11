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
      <ActionSheet visible={visible} onClose={onClose} heightPercent={'20%'}>
        <View
          style={{
            marginHorizontal: 20,
            marginVertical: 20,
            flexDirection: 'column',
          }}>
          <TouchableOpacity
            onPress={onPressDeliverToHub}
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              paddingBottom: 20,
            }}>
            <View style={{flexDirection: 'row'}}>
              <BoxIcon />
              <Text style={{paddingLeft: 10, color: '#393D40'}}>
                Deliver to Hub
              </Text>
            </View>
            <View>
              <IconRight width={20} height={20} />
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={onPressMissing}
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              paddingBottom: 20,
            }}>
            <View style={{flexDirection: 'row'}}>
              <ExCircleIcon />
              <Text style={{paddingLeft: 10, color: '#393D40'}}>
                Tag as missing
              </Text>
            </View>
            <View>
              <IconRight width={20} height={20} />
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={onPressCasualty}
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              paddingBottom: 20,
            }}>
            <View style={{flexDirection: 'row'}}>
              <ExCircleIcon />
              <Text style={{paddingLeft: 10, color: '#393D40'}}>
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
