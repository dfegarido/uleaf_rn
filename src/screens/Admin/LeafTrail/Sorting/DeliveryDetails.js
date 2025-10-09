import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

const InfoRow = ({ label, value }) => (
    <View style={styles.row}>
        <Text style={styles.label}>{label}</Text>
        <Text style={styles.value}>{value}</Text>
    </View>
);

const DeliveryDetails = ({ details }) => (
    <View style={styles.container}>
        <Text style={styles.title}>Delivery Details</Text>
        <View style={styles.detailsBox}>
            <InfoRow label="Plant Flight" value={details.flightDate} />
            <InfoRow label="Date Received" value={details.receivedDate} />
        </View>
    </View>
);

const styles = StyleSheet.create({
    container: {
        backgroundColor: '#F5F6F6',
        paddingVertical: 16,
        gap: 12,
    },
    title: {
        paddingHorizontal: 15,
        fontFamily: 'Inter',
        fontWeight: '700',
        fontSize: 18,
        color: '#202325',
    },
    detailsBox: {
        paddingHorizontal: 15,
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 4,
    },
    label: {
        fontFamily: 'Inter',
        fontSize: 16,
        color: '#647276',
    },
    value: {
        fontFamily: 'Inter',
        fontWeight: '600',
        fontSize: 16,
        color: '#202325',
    },
});

export default DeliveryDetails;