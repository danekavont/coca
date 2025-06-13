import { Tabs } from 'expo-router';
import React, { useState, useRef, useEffect } from 'react';
import { Platform, View, Text, TouchableOpacity, Modal, StyleSheet, Alert, Animated, Easing, Pressable } from 'react-native';

import { HapticTab } from '@/components/HapticTab';
import { IconSymbol } from '@/components/ui/IconSymbol';
import TabBarBackground from '@/components/ui/TabBarBackground';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';

import { auth } from '../lib/firebase';
import { signOut } from 'firebase/auth';

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const [menuVisible, setMenuVisible] = useState(false);
  const [menuAnim] = useState(new Animated.Value(0));
  const user = auth.currentUser;

  // Animation for rotating the IconSymbol
  const iconSpinAnim = useRef(new Animated.Value(0)).current;

  // Animate to 540deg when opened, back to 0deg when closed
  useEffect(() => {
    Animated.timing(iconSpinAnim, {
      toValue: menuVisible ? 1 : 0,
      duration: 400,
      useNativeDriver: true,
      easing: Easing.out(Easing.exp),
    }).start();
  }, [menuVisible, iconSpinAnim]);

  const openMenu = () => {
    setMenuVisible(true);
    Animated.timing(menuAnim, {
      toValue: 1,
      duration: 220,
      useNativeDriver: true,
      easing: Easing.out(Easing.exp),
    }).start();
  };

  const closeMenu = () => {
    Animated.timing(menuAnim, {
      toValue: 0,
      duration: 160,
      useNativeDriver: true,
      easing: Easing.in(Easing.exp),
    }).start(() => setMenuVisible(false));
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      closeMenu();
    } catch (err: any) {
      Alert.alert("Error", err.message);
    }
  };

  // Animation styles
  const menuTranslate = menuAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-40, 0],
  });
  const menuOpacity = menuAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

  // Icon rotation style (540deg when open, 0deg when closed)
  const iconSpin = iconSpinAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '540deg'],
  });

  return (
    <View style={{ flex: 1 }}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: Colors[colorScheme ?? 'light'].tint }]}>
        <Text style={[styles.headerTitle, { color: '#fff' }]}>CoCa</Text>
        <TouchableOpacity onPress={menuVisible ? closeMenu : openMenu} style={styles.menuButton}>
          <Animated.View style={{ transform: [{ rotate: iconSpin }] }}>
            <IconSymbol name="menuunfold" size={28} color="#fff" />
          </Animated.View>
        </TouchableOpacity>
      </View>

      {/* Burger Menu Modal with snappy animation */}
      <Modal
        visible={menuVisible}
        transparent
        animationType="none"
        onRequestClose={closeMenu}
      >
        <Pressable style={styles.modalOverlay} onPress={closeMenu}>
          <Animated.View
            style={[
              styles.menuContainer,
              {
                opacity: menuOpacity,
                transform: [{ translateY: menuTranslate }],
              },
            ]}
          >
            <Text style={styles.menuTitle}>User Info</Text>
            <Text style={styles.menuText}>{user?.email ?? "Not logged in"}</Text>
            <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
              <Text style={styles.logoutText}>Logout</Text>
            </TouchableOpacity>
          </Animated.View>
        </Pressable>
      </Modal>

      {/* Tabs */}
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
          tabBarButton: HapticTab,
          tabBarBackground: TabBarBackground,
          tabBarItemStyle: {
            marginHorizontal: -1, 
          },
          tabBarStyle: Platform.select({
            ios: {
              position: 'absolute',
            },
            default: {},
          }),
        }}
      >
        <Tabs.Screen
          name="medications"
          options={{
            title: 'Medications',
            tabBarIcon: ({ color }) => (
              <IconSymbol size={28} name="pills.fill" color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="appointments"
          options={{
            title: 'Appointments',
            tabBarIcon: ({ color }) => (
              <IconSymbol size={28} name="calendar" color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="index"
          options={{
            title: 'Home',
            tabBarIcon: ({ color }) => (
              <IconSymbol size={28} name="house.fill" color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="records"
          options={{
            title: 'Records',
            tabBarIcon: ({ color }) => (
              <IconSymbol size={28} name="doc.text.fill" color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="resources"
          options={{
            title: 'Explore',
            tabBarIcon: ({ color }) => (
              <IconSymbol size={28} name="book.fill" color={color} />
            ),
          }}
        />
      </Tabs>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    height: 56,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    zIndex: 10,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
  },
  menuButton: {
    padding: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.18)',
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
  },
  menuContainer: {
    width: 220,
    backgroundColor: '#fff',
    borderRadius: 8,
    marginTop: 56,
    marginRight: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 6,
  },
  menuTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  menuText: {
    fontSize: 15,
    marginBottom: 16,
    color: '#333',
  },
  logoutButton: {
    backgroundColor: '#f44',
    borderRadius: 6,
    paddingVertical: 8,
    alignItems: 'center',
  },
  logoutText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 15,
  },
});
