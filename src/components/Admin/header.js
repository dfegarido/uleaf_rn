import React from 'react';
import {
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    TextInput,
} from 'react-native';
import ScanQrIcon from '../../assets/admin-icons/qr.svg';
import BackSolidIcon from '../../assets/iconnav/caret-left-bold.svg';
import SearchIcon from '../../assets/icons/greylight/magnifying-glass-regular';

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
}) => {
    return (
        <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()}>
                <BackSolidIcon />
            </TouchableOpacity>

            {!searchActive && <Text style={styles.headerTitle}>{title}</Text>}

            {searchActive && (
                <TextInput
                    ref={inputRef}
                    style={styles.headerSearchInput}
                    placeholder="Search orders, plants, buyers, gardens..."
                    placeholderTextColor="#647276"
                    value={searchValue}
                    onChangeText={onSearchChange}
                    onSubmitEditing={onSearchSubmit}
                    returnKeyType="search"
                />
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
    headerAction: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#CDD3D4',
        borderRadius: 12,
    },
});

export default ScreenHeader;
