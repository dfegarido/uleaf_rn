import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';

// Placeholder for the flag icon, you would use a real flag component
const Flag = ({ country }) => <Text>{country}</Text>;

const PlantCard = ({ plant }) => (
    <View style={styles.card}>
        <Image source={{ uri: plant.image }} style={styles.plantImage} />
        <View style={styles.details}>
            <View>
                <View style={styles.row}>
                    <Text style={styles.code}>{plant.code}</Text>
                    <View style={styles.countryContainer}>
                        <Text style={styles.countryText}>{plant.country}</Text>
                        <Flag country={plant.country} />
                    </View>
                </View>
                <Text style={styles.name}>{plant.genus} {plant.species}</Text>
                <Text style={styles.subtext}>{plant.variegation} • {plant.size}</Text>
            </View>
            <View style={styles.row}>
                <View style={styles.typeChip}>
                    <Text style={styles.typeText}>{plant.listingType}</Text>
                </View>
                <Text style={styles.quantity}>{plant.quantity}</Text>
            </View>
        </View>
    </View>
);

const styles = StyleSheet.create({
    card: {
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        padding: 12,
        flexDirection: 'row',
        gap: 12,
    },
    plantImage: {
        width: 96,
        height: 128,
        borderRadius: 8,
    },
    details: {
        flex: 1,
        justifyContent: 'space-between',
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    code: {
        fontFamily: 'Inter',
        fontSize: 16,
        color: '#647276',
    },
    countryContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    countryText: {
        fontFamily: 'Inter',
        fontWeight: '600',
        fontSize: 16,
        color: '#556065',
    },
    name: {
        fontFamily: 'Inter',
        fontWeight: '700',
        fontSize: 16,
        color: '#202325',
        marginVertical: 4,
    },
    subtext: {
        fontFamily: 'Inter',
        fontSize: 16,
        color: '#647276',
    },
    typeChip: {
        backgroundColor: '#202325',
        borderRadius: 6,
        paddingHorizontal: 8,
        paddingVertical: 2,
    },
    typeText: {
        color: '#FFFFFF',
        fontFamily: 'Inter',
        fontWeight: '600',
        fontSize: 12,
    },
    quantity: {
        fontFamily: 'Inter',
        fontWeight: '600',
        fontSize: 16,
        color: '#393D40',
    },
});

export default PlantCard;