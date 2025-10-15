import React from 'react';
import {
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import ScanQrIcon from '../../assets/admin-icons/qr.svg';
import BackSolidIcon from '../../assets/iconnav/caret-left-bold.svg';
import SearchIcon from '../../assets/icons/greylight/magnifying-glass-regular';

const ScreenHeader = ({navigation, scarQr, search, title}) => {
    return (
        <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()}>
                <BackSolidIcon />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>{title}</Text>
            {scarQr && 
                <TouchableOpacity style={styles.headerAction} onPress={() => navigation.navigate('LeafTrailScanQRAdminScreen')}>
                    <ScanQrIcon />
                </TouchableOpacity>
            }

            {search && 
                <TouchableOpacity style={styles.headerAction}>
                    <SearchIcon />
                </TouchableOpacity>
            }
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