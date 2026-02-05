import React from 'react';
import {
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import ScanQrIcon from '../../assets/admin-icons/qr.svg';
import DownloadIcon from '../../assets/admin-icons/download.svg';
import BackSolidIcon from '../../assets/iconnav/caret-left-bold.svg';
import SearchIcon from '../../assets/icons/greylight/magnifying-glass-regular';
import PrintIcon from '../../assets/icons/greylight/printer.svg';
import CheckIcon from '../../assets/admin-icons/check.svg';
import CloseIcon from '../../assets/admin-icons/x.svg';

const ScreenHeader = ({
    navigation,
    scarQr,
    search,
    title,
    onSearchPress,
    searchActive,
    searchValue,
    onSearchChange,
    onSearchSubmit,
    inputRef,
    searchPlaceholder='Search',
    downloadCsv=false,
    onDownloadCsv,
    downloadLoading=false,
    printButton=false,
    onPrint,
    selectionMode=false,
    onCancelSelection,
    selectedCount=0,
    onSelectAll,
    totalItemsCount=0,
}) => {
    return (
        <View style={styles.header}>
            <TouchableOpacity onPress={selectionMode ? onCancelSelection : () => navigation.goBack()}>
                {selectionMode ? <CloseIcon /> : <BackSolidIcon />}
            </TouchableOpacity>

            {!searchActive && !selectionMode && <Text style={styles.headerTitle}>{title}</Text>}
            {selectionMode && <Text style={styles.headerTitle}>{selectedCount} selected</Text>}

            {searchActive && (
                <TextInput
                    ref={inputRef}
                    style={styles.headerSearchInput}
                    placeholder={searchPlaceholder}
                    placeholderTextColor="#647276"
                    value={searchValue}
                    onChangeText={onSearchChange}
                    onSubmitEditing={onSearchSubmit}
                    returnKeyType="search"
                />
            )}

            <View style={styles.rightActions}>
                {selectionMode && onSelectAll && (
                    <TouchableOpacity 
                        style={styles.selectAllButton} 
                        onPress={onSelectAll}
                    >
                        <Text style={styles.selectAllText}>
                            {selectedCount === totalItemsCount ? 'Deselect All' : 'Select All'}
                        </Text>
                    </TouchableOpacity>
                )}

                {printButton && !searchActive && (
                    <TouchableOpacity 
                        style={styles.headerAction} 
                        onPress={onPrint}
                    >
                        <PrintIcon />
                    </TouchableOpacity>
                )}

                {downloadCsv && !searchActive && (
                    <TouchableOpacity 
                        style={[styles.headerAction, downloadLoading && styles.headerActionDisabled]} 
                        onPress={onDownloadCsv}
                        disabled={downloadLoading}
                    >
                        <DownloadIcon style={downloadLoading && { opacity: 0.5 }} />
                    </TouchableOpacity>
                )}

                {scarQr && !searchActive && (
                    <TouchableOpacity style={styles.headerAction} onPress={() => navigation.navigate('LeafTrailScanQRAdminScreen')}>
                        <ScanQrIcon />
                    </TouchableOpacity>
                )}

                {search && !searchActive && (
                    <TouchableOpacity style={styles.headerAction} onPress={onSearchPress}>
                        <SearchIcon />
                    </TouchableOpacity>
                )}

                {search && searchActive && (
                    <TouchableOpacity style={styles.headerAction} onPress={onSearchSubmit}>
                        <SearchIcon />
                    </TouchableOpacity>
                )}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
// Header
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 10,
        backgroundColor: '#FFFFFF',
        height: 58,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#202325',
    },
    headerSearchInput: {
        flex: 1,
        height: 40,
        backgroundColor: '#F6F7F6',
        borderRadius: 8,
        paddingHorizontal: 12,
        fontFamily: 'Inter',
        fontSize: 14,
        color: '#202325',
    },
    rightActions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    selectAllButton: {
        paddingHorizontal: 12,
        paddingVertical: 8,
        backgroundColor: '#F2F7F3',
        borderRadius: 8,
        marginRight: 4,
    },
    selectAllText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#23C16B',
    },
    headerAction: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#CDD3D4',
        borderRadius: 12,
    },
    headerActionDisabled: {
        opacity: 0.5,
        backgroundColor: '#F5F6F6',
    },
});

export default ScreenHeader;
