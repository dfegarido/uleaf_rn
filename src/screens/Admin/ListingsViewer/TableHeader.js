import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { IMAGE_CELL_TOTAL, COLUMN_INNER_PADDING } from './constants';

/**
 * TableHeader
 * Props:
 * - columns: array of { key, label, width }
 * - imageWidth: number width of the leading image column spacer so header aligns with rows
 */
const TableHeader = ({ columns, imageWidth = IMAGE_CELL_TOTAL }) => {
  const cols = Array.isArray(columns) && columns.length > 0 ? columns : [
    { key: 'code', label: 'Code', width: 160 },
    { key: 'name', label: 'Name', width: 320 },
    { key: 'type', label: 'Type', width: 160 },
  ];

  // Show all columns in header. For the 'image' column render a cell with width imageWidth
  const visibleCols = cols;

  return (
    <View style={styles.tableHeader} accessibilityRole="header">
      {visibleCols.map((column) => {
        const width = column.key === 'image' ? imageWidth : (column.width || 160);
        const alignCenter = column.key === 'image';
        return (
          <View
            key={column.key}
            style={[
              styles.headerCell,
              { width, alignItems: alignCenter ? 'center' : 'flex-start' },
              !alignCenter && { paddingLeft: COLUMN_INNER_PADDING }
            ]}
          >
            <Text style={[styles.headerText, alignCenter && { textAlign: 'center' }]}>{column.label}</Text>
          </View>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  tableHeader: { flexDirection: 'row', alignItems: 'flex-end', paddingHorizontal: 15, paddingVertical: 8, gap: 12, backgroundColor: '#E4E7E9', borderBottomWidth: 1, borderBottomColor: '#CDD3D4', height: 36 },
  headerCell: { justifyContent: 'center', alignItems: 'flex-start' },
  headerText: { fontWeight: '500', color: '#647276' },
  headerTextBold: { fontWeight: '700', color: '#202325' },
});

export default TableHeader;
