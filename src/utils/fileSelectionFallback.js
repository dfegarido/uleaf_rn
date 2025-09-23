/**
 * Alternative File Selection for Android
 * 
 * This provides a workaround for file selection when react-native-document-picker
 * has compatibility issues with certain React Native versions.
 */

import { Alert } from 'react-native';

export const selectFileAlternative = async () => {
  return new Promise((resolve, reject) => {
    Alert.alert(
      'Select File Method',
      'Choose how you want to provide your taxonomy file:',
      [
        { text: 'Cancel', style: 'cancel', onPress: () => reject(new Error('Cancelled')) },
        {
          text: 'Simulate CSV File',
          onPress: () => {
            const mockCSVFile = {
              name: 'my_taxonomy_data.csv',
              type: 'text/csv',
              size: 2048,
              uri: 'file://user/documents/my_taxonomy_data.csv',
              content: `genus_name,species_name,variegation,shipping_index,acclimation_index
Monstera,Deliciosa,None,3,4
Alocasia,Zebrina,Variegated,2,3
Philodendron,Birkin,None,4,5
Ficus,Lyrata,None,2,3
Pothos,Golden,None,5,4`
            };
            resolve(mockCSVFile);
          }
        },
        {
          text: 'Simulate Excel File',
          onPress: () => {
            const mockExcelFile = {
              name: 'taxonomy_import.xlsx',
              type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
              size: 3072,
              uri: 'file://user/documents/taxonomy_import.xlsx',
              content: 'Excel file simulation with taxonomy data'
            };
            resolve(mockExcelFile);
          }
        },
        {
          text: 'Upload Instructions',
          onPress: () => {
            Alert.alert(
              'File Upload Instructions',
              'To upload your own file:\n\n' +
              '1. Prepare your CSV/Excel file with required columns:\n' +
              '   • genus_name (required)\n' +
              '   • species_name (required)\n' +
              '   • variegation (optional)\n' +
              '   • shipping_index (optional 1-10)\n' +
              '   • acclimation_index (optional 1-10)\n\n' +
              '2. Save file to Downloads folder\n' +
              '3. Contact developer to enable real file picker\n\n' +
              'For now, use the simulation options to test the import flow.',
              [{ text: 'OK', onPress: () => reject(new Error('Instructions shown')) }]
            );
          }
        }
      ]
    );
  });
};
