import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useAuth } from '../context/AuthContext';
import { Colors, Spacing } from '../utils/theme';

// Auth screens
import LoginScreen    from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';

// Main screens
import HomeScreen          from '../screens/home/HomeScreen';
import MyTasksScreen       from '../screens/tasks/MyTasksScreen';
import TaskDetailScreen    from '../screens/tasks/TaskDetailScreen';
import WalletScreen        from '../screens/wallet/WalletScreen';
import DepositScreen       from '../screens/wallet/DepositScreen';
import TeamScreen          from '../screens/team/TeamScreen';
import ProfileScreen       from '../screens/profile/ProfileScreen';
import NotificationsScreen from '../screens/notifications/NotificationsScreen';

// Lazy-load remaining screens to keep bundle lean
const IncomeDashboard = require('../screens/home/IncomeDashboardScreen').default;
const HandbookScreen  = require('../screens/home/HandbookScreen').default;
const InviteScreen    = require('../screens/home/InviteScreen').default;
const RecordsScreen   = require('../screens/home/RecordsScreen').default;
const ReferralScreen  = require('../screens/home/ReferralScreen').default;

const Stack = createNativeStackNavigator();
const Tab   = createBottomTabNavigator();

const TAB_ICONS = {
  Home:    { default: '🏠', active: '🏠' },
  Tasks:   { default: '📋', active: '📋' },
  Wallet:  { default: '💳', active: '💳' },
  Team:    { default: '👥', active: '👥' },
  Profile: { default: '👤', active: '👤' },
};

function CustomTabBar({ state, descriptors, navigation }) {
  return (
    <View style={tabStyles.bar}>
      {state.routes.map((route, index) => {
        const { options } = descriptors[route.key];
        const isFocused = state.index === index;
        const icons = TAB_ICONS[route.name] || { default: '●', active: '●' };

        return (
          <TouchableOpacity
            key={route.key}
            accessibilityRole="button"
            accessibilityState={isFocused ? { selected: true } : {}}
            onPress={() => {
              const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
              if (!isFocused && !event.defaultPrevented) navigation.navigate(route.name);
            }}
            style={tabStyles.tab}
            activeOpacity={0.7}
          >
            <Text style={[tabStyles.icon, isFocused && tabStyles.iconActive]}>{icons.default}</Text>
            <Text style={[tabStyles.label, isFocused && tabStyles.labelActive]}>{route.name}</Text>
            {isFocused && <View style={tabStyles.indicator} />}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

function HomeTabs() {
  return (
    <Tab.Navigator
      tabBar={props => <CustomTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tab.Screen name="Home"    component={HomeStack} />
      <Tab.Screen name="Tasks"   component={TasksStack} />
      <Tab.Screen name="Wallet"  component={WalletStack} />
      <Tab.Screen name="Team"    component={TeamStack} />
      <Tab.Screen name="Profile" component={ProfileStack} />
    </Tab.Navigator>
  );
}

function HomeStack() {
  return (
    <Stack.Navigator screenOptions={screenOpts}>
      <Stack.Screen name="HomeScreen"    component={HomeScreen}          options={{ headerShown: false }} />
      <Stack.Screen name="TaskDetail"    component={TaskDetailScreen}    options={{ title: 'Task detail', ...headerOpts }} />
      <Stack.Screen name="Notifications" component={NotificationsScreen} options={{ title: 'Notifications', ...headerOpts }} />
      <Stack.Screen name="Income"        component={IncomeDashboard}     options={{ title: 'Income', ...headerOpts }} />
      <Stack.Screen name="Handbook"      component={HandbookScreen}      options={{ title: 'Handbook', ...headerOpts }} />
      <Stack.Screen name="Invite"        component={InviteScreen}        options={{ title: 'Invite & Earn', ...headerOpts }} />
      <Stack.Screen name="Records"       component={RecordsScreen}       options={{ title: 'Financial records', ...headerOpts }} />
      <Stack.Screen name="Referral"      component={ReferralScreen}      options={{ title: 'Referrals', ...headerOpts }} />
    </Stack.Navigator>
  );
}

function TasksStack() {
  return (
    <Stack.Navigator screenOptions={screenOpts}>
      <Stack.Screen name="MyTasks"    component={MyTasksScreen}    options={{ headerShown: false }} />
      <Stack.Screen name="TaskDetail" component={TaskDetailScreen} options={{ title: 'Task detail', ...headerOpts }} />
    </Stack.Navigator>
  );
}

function WalletStack() {
  return (
    <Stack.Navigator screenOptions={screenOpts}>
      <Stack.Screen name="WalletScreen" component={WalletScreen}  options={{ headerShown: false }} />
      <Stack.Screen name="Deposit"      component={DepositScreen} options={{ title: 'Deposit funds', ...headerOpts }} />
      <Stack.Screen name="Records"      component={RecordsScreen} options={{ title: 'Financial records', ...headerOpts }} />
    </Stack.Navigator>
  );
}

function TeamStack() {
  return (
    <Stack.Navigator screenOptions={screenOpts}>
      <Stack.Screen name="TeamScreen" component={TeamScreen}  options={{ headerShown: false }} />
      <Stack.Screen name="Invite"     component={InviteScreen} options={{ title: 'Invite & Earn', ...headerOpts }} />
    </Stack.Navigator>
  );
}

function ProfileStack() {
  return (
    <Stack.Navigator screenOptions={screenOpts}>
      <Stack.Screen name="ProfileScreen" component={ProfileScreen}  options={{ headerShown: false }} />
      <Stack.Screen name="Records"       component={RecordsScreen}  options={{ title: 'Financial records', ...headerOpts }} />
      <Stack.Screen name="Handbook"      component={HandbookScreen} options={{ title: 'Handbook', ...headerOpts }} />
      <Stack.Screen name="Income"        component={IncomeDashboard} options={{ title: 'Income', ...headerOpts }} />
      <Stack.Screen name="Invite"        component={InviteScreen}   options={{ title: 'Invite & Earn', ...headerOpts }} />
    </Stack.Navigator>
  );
}

const screenOpts = { animation: 'slide_from_right' };
const headerOpts = {
  headerShown: true,
  headerStyle: { backgroundColor: Colors.surface },
  headerTintColor: Colors.primary,
  headerTitleStyle: { fontWeight: '600', color: Colors.text },
  headerShadowVisible: false,
};

export default function AppNavigator() {
  const { user, loading } = useAuth();

  if (loading) return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.surface }}>
      <Text style={{ fontSize: 32, fontWeight: '800', color: Colors.primary }}>GigWork</Text>
    </View>
  );

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {user ? (
          <Stack.Screen name="Main" component={HomeTabs} />
        ) : (
          <>
            <Stack.Screen name="Login"    component={LoginScreen} />
            <Stack.Screen name="Register" component={RegisterScreen} options={{ animation: 'slide_from_right' }} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const tabStyles = StyleSheet.create({
  bar:       { flexDirection: 'row', backgroundColor: Colors.surface, borderTopWidth: 0.5, borderTopColor: Colors.border, paddingBottom: 20, paddingTop: 8 },
  tab:       { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 2, position: 'relative' },
  icon:      { fontSize: 22 },
  iconActive:{ transform: [{ scale: 1.05 }] },
  label:     { fontSize: 10, color: Colors.text3, fontWeight: '500' },
  labelActive:{ color: Colors.primary, fontWeight: '700' },
  indicator: { position: 'absolute', bottom: -8, width: 20, height: 3, backgroundColor: Colors.primary, borderRadius: 2 },
});
