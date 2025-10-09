import React from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

const TrayInput = () => (
    <View style={styles.container}>
        <View style={styles.inputContainer}>
            <Text style={styles.icon}>🌿</Text>
            <TextInput
                placeholder="Greenhouse / Tray Number"
                placeholderTextColor="#647276"
                style={styles.input}
            />
        </View>
        <TouchableOpacity style={styles.button}>
            <Text style={styles.buttonText}>Set</Text>
        </TouchableOpacity>
    </View>
);

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        paddingHorizontal: 15,
        paddingBottom: 20,
        gap: 8,
    },
    inputContainer: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#CDD3D4',
        borderRadius: 12,
        paddingHorizontal: 16,
        height: 48,
    },
    icon: { fontSize: 20, marginRight: 12 },
    input: {
        flex: 1,
        fontFamily: 'Inter',
        fontSize: 16,
        color: '#202325'
    },
    button: {
        backgroundColor: '#539461',
        borderRadius: 12,
        height: 48,
        justifyContent: 'center',
        paddingHorizontal: 20,
    },
    buttonText: {
        color: '#FFFFFF',
        fontFamily: 'Inter',
        fontWeight: '600',
        fontSize: 16,
    },
});

export default TrayInput;