import React, {useState} from 'react';
import {View, Text, StyleSheet, TouchableOpacity} from 'react-native';
import ActionSheet from '../../../../components/ActionSheet/ActionSheet';
// import IconEx from '../../assets/icons/greylight/x-regular.svg';
// import {globalStyles} from '../../assets/styles/styles';
import IconEx from '../../../../assets/icons/greylight/x-regular.svg';
import {globalStyles} from '../../../../assets/styles/styles';
import IconNote from '../../../../assets/icons/greydark/note-edit.svg';
import IconTrash from '../../../../assets/icons/greydark/trash-regular.svg';
import IconRight from '../../../../assets/icons/greylight/caret-right-regular.svg';
import IconStocks from '../../../../assets/icons/greydark/box-regular.svg';

const ListingActionSheet = ({
  code,
  visible,
  onClose,
  onPressUpdateStockShow,
  showSheetUpdateStocks,
}) => {
  const renderSheetContent = () => {
    switch (code) {
      case 'Single Plant':
        return (
          <ActionSheet
            visible={visible}
            onClose={onClose}
            heightPercent={'15%'}>
            <View
              style={{
                marginHorizontal: 20,
                marginVertical: 20,
                flexDirection: 'column',
              }}>
              <View
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  paddingBottom: 20,
                }}>
                <View style={{flexDirection: 'row'}}>
                  <IconNote />
                  <Text style={{paddingLeft: 10, color: '#393D40'}}>
                    Edit Listing
                  </Text>
                </View>
                <View>
                  <IconRight width={20} height={20} />
                </View>
              </View>
              <View
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  paddingBottom: 20,
                }}>
                <View style={{flexDirection: 'row'}}>
                  <IconTrash width={20} height={20} />
                  <Text style={{paddingLeft: 10, color: '#393D40'}}>
                    Delete Listing
                  </Text>
                </View>
                <View>
                  <IconRight width={20} height={20} />
                </View>
              </View>
            </View>
          </ActionSheet>
        );
      // case 'L2':
      //   return (
      //     <ActionSheet
      //       visible={visible}
      //       onClose={onClose}
      //       heightPercent={'20%'}>
      //       <View
      //         style={{
      //           marginHorizontal: 20,
      //           marginVertical: 20,
      //           flexDirection: 'column',
      //         }}>
      //         <View
      //           style={{
      //             flexDirection: 'row',
      //             justifyContent: 'space-between',
      //             paddingBottom: 20,
      //           }}>
      //           <View style={{flexDirection: 'row'}}>
      //             <IconNote width={20} height={20} />
      //             <Text style={{paddingLeft: 10, color: '#393D40'}}>
      //               Edit Listing
      //             </Text>
      //           </View>
      //           <View>
      //             <IconRight width={20} height={20} />
      //           </View>
      //         </View>
      //         <View
      //           style={{
      //             flexDirection: 'row',
      //             justifyContent: 'space-between',
      //             paddingBottom: 20,
      //           }}>
      //           <TouchableOpacity onPress={() => onPressUpdateStockShow()}>
      //             <View style={{flexDirection: 'row'}}>
      //               <IconStocks width={20} height={20} />
      //               <Text style={{paddingLeft: 10, color: '#393D40'}}>
      //                 Update Stocks
      //               </Text>
      //             </View>
      //           </TouchableOpacity>

      //           <View>
      //             <IconRight width={20} height={20} />
      //           </View>
      //         </View>
      //         <View
      //           style={{
      //             flexDirection: 'row',
      //             justifyContent: 'space-between',
      //             paddingBottom: 20,
      //           }}>
      //           <View style={{flexDirection: 'row'}}>
      //             <IconTrash width={20} height={20} />
      //             <Text style={{paddingLeft: 10, color: '#393D40'}}>
      //               Delete Listing
      //             </Text>
      //           </View>
      //           <View>
      //             <IconRight width={20} height={20} />
      //           </View>
      //         </View>
      //       </View>
      //     </ActionSheet>
      //   );
      // case 'L3':
      //   return (
      //     <ActionSheet
      //       visible={visible}
      //       onClose={onClose}
      //       heightPercent={'20%'}>
      //       <View
      //         style={{
      //           marginHorizontal: 20,
      //           marginVertical: 20,
      //           flexDirection: 'column',
      //         }}>
      //         <View
      //           style={{
      //             flexDirection: 'row',
      //             justifyContent: 'space-between',
      //             paddingBottom: 20,
      //           }}>
      //           <View style={{flexDirection: 'row'}}>
      //             <IconNote width={20} height={20} />
      //             <Text style={{paddingLeft: 10, color: '#393D40'}}>
      //               Edit Listing
      //             </Text>
      //           </View>
      //           <View>
      //             <IconRight width={20} height={20} />
      //           </View>
      //         </View>
      //         <View
      //           style={{
      //             flexDirection: 'row',
      //             justifyContent: 'space-between',
      //             paddingBottom: 20,
      //           }}>
      //           <TouchableOpacity onPress={() => onPressUpdateStockShow()}>
      //             <View style={{flexDirection: 'row'}}>
      //               <IconStocks width={20} height={20} />
      //               <Text style={{paddingLeft: 10, color: '#393D40'}}>
      //                 Update Stocks
      //               </Text>
      //             </View>
      //           </TouchableOpacity>

      //           <View>
      //             <IconRight width={20} height={20} />
      //           </View>
      //         </View>
      //         <View
      //           style={{
      //             flexDirection: 'row',
      //             justifyContent: 'space-between',
      //             paddingBottom: 20,
      //           }}>
      //           <View style={{flexDirection: 'row'}}>
      //             <IconTrash width={20} height={20} />
      //             <Text style={{paddingLeft: 10, color: '#393D40'}}>
      //               Delete Listing
      //             </Text>
      //           </View>
      //           <View>
      //             <IconRight width={20} height={20} />
      //           </View>
      //         </View>
      //       </View>
      //     </ActionSheet>
      //   );
      default:
        return (
          <ActionSheet
            visible={visible}
            onClose={onClose}
            heightPercent={'20%'}>
            <View
              style={{
                marginHorizontal: 20,
                marginVertical: 20,
                flexDirection: 'column',
              }}>
              <View
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  paddingBottom: 20,
                }}>
                <View style={{flexDirection: 'row'}}>
                  <IconNote width={20} height={20} />
                  <Text style={{paddingLeft: 10, color: '#393D40'}}>
                    Edit Listing
                  </Text>
                </View>
                <View>
                  <IconRight width={20} height={20} />
                </View>
              </View>
              <View
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  paddingBottom: 20,
                }}>
                <TouchableOpacity onPress={() => onPressUpdateStockShow()}>
                  <View style={{flexDirection: 'row'}}>
                    <IconStocks width={20} height={20} />
                    <Text style={{paddingLeft: 10, color: '#393D40'}}>
                      Update Stocks
                    </Text>
                  </View>
                </TouchableOpacity>

                <View>
                  <IconRight width={20} height={20} />
                </View>
              </View>
              <View
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  paddingBottom: 20,
                }}>
                <View style={{flexDirection: 'row'}}>
                  <IconTrash width={20} height={20} />
                  <Text style={{paddingLeft: 10, color: '#393D40'}}>
                    Delete Listing
                  </Text>
                </View>
                <View>
                  <IconRight width={20} height={20} />
                </View>
              </View>
            </View>
          </ActionSheet>
        );
    }
  };

  return (
    <>
      <View>{renderSheetContent()}</View>
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

export default ListingActionSheet;
