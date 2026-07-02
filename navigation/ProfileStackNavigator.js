import React from 'react';
import { createStackNavigator, CardStyleInterpolators, TransitionPresets } from '@react-navigation/stack';
import ProfileScreen       from '../screens/ProfileScreen';
import EditProfileScreen   from '../screens/EditProfileScreen';
import AddVehicleScreen    from '../screens/AddVehicleScreen';
import SettingsScreen      from '../screens/SettingsScreen';
import ActivityScreen      from '../screens/ActivityScreen';
import SavedScreen         from '../screens/SavedScreen';
import CreateStoryScreen   from '../screens/CreateStoryScreen';
import CreatePostScreen    from '../screens/CreatePostScreen';
import ChangePasswordScreen from '../screens/ChangePasswordScreen';
import AboutScreen         from '../screens/AboutScreen';
import LegalScreen         from '../screens/LegalScreen';
import PostDetailScreen          from '../screens/PostDetailScreen';
import VehiclePlateSearchScreen  from '../screens/VehiclePlateSearchScreen';
import CertificationScreen       from '../screens/CertificationScreen';
import UserProfileScreen         from '../screens/UserProfileScreen';

const Stack = createStackNavigator();

const SCREEN_BASE = {
  headerShown: false,
  cardStyle: { backgroundColor: '#140102' },
  cardStyleInterpolator: CardStyleInterpolators.forHorizontalIOS,
  gestureEnabled: true,
};

const MODAL = { ...TransitionPresets.ModalSlideFromBottomIOS };

export default function ProfileStackNavigator() {
  return (
    <Stack.Navigator screenOptions={SCREEN_BASE}>
      {/* Racine — pas de swipe-back */}
      <Stack.Screen name="ProfileHome"     component={ProfileScreen}        options={{ gestureEnabled: false }} />

      {/* Écrans horizontaux classiques */}
      <Stack.Screen name="EditProfile"     component={EditProfileScreen} />
      {/* Settings slide du bas (chevron-down dans son header) */}
      <Stack.Screen name="Settings"        component={SettingsScreen}      options={{ ...TransitionPresets.ModalSlideFromBottomIOS }} />
      <Stack.Screen name="Activity"        component={ActivityScreen} />
      <Stack.Screen name="Saved"           component={SavedScreen} />
      <Stack.Screen name="ChangePassword"  component={ChangePasswordScreen} />
      <Stack.Screen name="About"           component={AboutScreen} />
      <Stack.Screen name="Legal"           component={LegalScreen} />
      <Stack.Screen name="PostDetail"       component={PostDetailScreen} />
      <Stack.Screen name="UserProfile"      component={UserProfileScreen} />
      <Stack.Screen name="VehiclePlateSearch" component={VehiclePlateSearchScreen}  options={{ ...TransitionPresets.ModalSlideFromBottomIOS }} />
      <Stack.Screen name="Certification"      component={CertificationScreen}       options={{ ...TransitionPresets.ModalSlideFromBottomIOS }} />

      {/* Modaux — slide from bottom */}
      <Stack.Screen name="AddVehicle"      component={AddVehicleScreen}     options={MODAL} />
      <Stack.Screen name="CreateStory"     component={CreateStoryScreen}    options={MODAL} />
      <Stack.Screen name="CreatePost"      component={CreatePostScreen}     options={MODAL} />
    </Stack.Navigator>
  );
}
