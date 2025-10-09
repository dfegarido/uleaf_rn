import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const CustomTabBar = ({ navigationState, jumpTo }) => (
    <View style={styles.tabBar}>
        {navigationState.routes.map((route, i) => {
            const isFocused = navigationState.index === i;
            return (
                <TouchableOpacity
                    key={route.key}
                    onPress={() => jumpTo(route.key)}
                    style={[styles.tabItem, { width: 160 }]}
                >
                    <View style={styles.tabContent}>
                        <Text style={isFocused ? styles.tabTextFocused : styles.tabText}>
                            {route.title}
                        </Text>
                        <View style={styles.badgeContainer}>
                            <Text style={styles.badgeText}>{route.count}</Text>
                        </View>
                    </View>
                    <View style={isFocused ? styles.indicator : styles.indicatorHidden} />
                </TouchableOpacity>
            );
        })}
    </View>
);

const styles = StyleSheet.create({
    tabBar: {
        flexDirection: 'row',
        backgroundColor: '#FFFFFF',
        borderBottomWidth: 1,
        borderColor: '#CDD3D4',
        paddingHorizontal: 15,
        justifyContent: 'flex-start',
    },
    tabItem: {
        alignItems: 'center',
        paddingTop: 8,
    },
    tabContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        height: 24,
        marginBottom: 12,
    },
    tabText: {
        fontFamily: 'Inter',
        fontSize: 16,
        color: '#647276',
    },
    tabTextFocused: {
        fontFamily: 'Inter',
        fontSize: 16,
        fontWeight: '600',
        color: '#202325',
    },
    badgeContainer: {
        backgroundColor: '#E7522F',
        borderRadius: 10,
        paddingHorizontal: 6,
        paddingVertical: 2,
        marginLeft: 8,
        minWidth: 22,
        height: 18,
        justifyContent: 'center',
        alignItems: 'center',
    },
    badgeText: {
        color: '#FFFFFF',
        fontSize: 12,
        fontWeight: '600',
    },
    indicator: {
        height: 3,
        width: '100%',
        backgroundColor: '#202325',
    },
    indicatorHidden: {
        height: 3,
        width: '100%',
        backgroundColor: 'transparent',
    },
});

export default CustomTabBar;