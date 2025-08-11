import { View, Text, Button, StyleSheet } from 'react-native';

const ScanQR = () => {
    return (
        <View>
            <Text>Scan QR</Text>
            <Button title="Scan QR" onPress={() => {}} />
        </View>
    );
};

export default ScanQR;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
});