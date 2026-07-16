import React from 'react';
import { ActivityIndicator,
    Alert,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import ScanQrIcon from '../../assets/admin-icons/qr.svg';
import DownloadIcon from '../../assets/icons/accent/download.svg';
import BackSolidIcon from '../../assets/iconnav/caret-left-bold.svg';
import SearchIcon from '../../assets/icons/greylight/magnifying-glass-regular';
import PrintIcon from '../../assets/icons/greylight/printer.svg';
import CheckIcon from '../../assets/admin-icons/check.svg';
import CloseIcon from '../../assets/admin-icons/x.svg';

const ScreenHeader = ({
    navigation,
    onBackPress,
    scarQr,
    search,
    title,
    onSearchPress,
    searchActive,
    searchValue,
    onSearchChange,
    onSearchSubmit,
    onSearchClear,
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
    onScanPress,
    scanQrParams,
}) => {
    const handleBackPress = () => {
        if (typeof onBackPress === 'function') {
            onBackPress();
            return;
        }
        navigation.goBack();
    };

    const handlePrintPress = () => {
        if (typeof onPrint === 'function') {
            onPrint();
            return;
        }
        Alert.alert('Print', 'Print is not available on this screen.');
    };

    const handleExportPress = () => {
        if (typeof onDownloadCsv === 'function') {
            onDownloadCsv();
            return;
        }
        Alert.alert('Export', 'Export is not available on this screen.');
    };

    return (
        <View style={styles.header}>
            <TouchableOpacity
                style={styles.backButton}
                onPress={selectionMode ? onCancelSelection : handleBackPress}>
                {selectionMode ? <CloseIcon /> : <BackSolidIcon />}
            </TouchableOpacity>

            <View style={styles.headerCenter}>
                {!searchActive && !selectionMode && (
                    <Text style={styles.headerTitle} numberOfLines={1} ellipsizeMode="tail">
                        {title}
                    </Text>
                )}
                {selectionMode && (
                    <Text style={styles.headerTitleSelection} numberOfLines={1} ellipsizeMode="tail">
                        {selectedCount} selected
                    </Text>
                )}

            {searchActive && (
                <View style={styles.searchInputContainer}>
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
                    {searchValue && searchValue.length > 0 && (
                        <TouchableOpacity
                            style={styles.clearButton}
                            onPress={onSearchClear}
                            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                        >
                            <CloseIcon width={16} height={16} />
                        </TouchableOpacity>
                    )}
                </View>
            )}
            </View>

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
                        onPress={handlePrintPress}
                        accessibilityLabel="Print barcode"
                    >
                        <PrintIcon width={22} height={22} />
                    </TouchableOpacity>
                )}

                {downloadCsv && !searchActive && (
                    <TouchableOpacity 
                        style={[styles.headerAction, downloadLoading && styles.headerActionDisabled]} 
                        onPress={handleExportPress}
                        disabled={downloadLoading}
                        accessibilityLabel="Export data"
                    >
                        {downloadLoading ? (
                            <ActivityIndicator size="small" color="#539461" />
                        ) : (
                            <DownloadIcon width={22} height={22} />
                        )}
                    </TouchableOpacity>
                )}

                {scarQr && !searchActive && (
                    <TouchableOpacity
                        style={styles.headerActionScan}
                        onPress={() => {
                            if (typeof onScanPress === 'function') {
                                onScanPress();
                                return;
                            }
                            navigation.navigate('LeafTrailScanQRAdminScreen', scanQrParams || {});
                        }}
                        accessibilityLabel="Scan QR code">
                        <ScanQrIcon width={40} height={40} />
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
        paddingHorizontal: 16,
        paddingVertical: 10,
        backgroundColor: '#FFFFFF',
        minHeight: 58,
    },
    backButton: {
        flexShrink: 0,
        marginRight: 4,
    },
    headerCenter: {
        flex: 1,
        minWidth: 0,
        justifyContent: 'center',
        marginHorizontal: 4,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#202325',
    },
    headerTitleSelection: {
        fontSize: 16,
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
    searchInputContainer: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F6F7F6',
        borderRadius: 8,
        paddingHorizontal: 12,
        height: 40,
    },
    clearButton: {
        padding: 4,
        marginLeft: 8,
    },
    rightActions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        flexShrink: 0,
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
    /** Scan uses qr.svg’s built-in rounded rect — no extra TouchableOpacity border. */
    headerActionScan: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerActionDisabled: {
        opacity: 0.5,
        backgroundColor: '#F5F6F6',
    },
});

export default ScreenHeader;
