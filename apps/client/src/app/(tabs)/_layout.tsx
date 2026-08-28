import React, { useState, useEffect } from 'react';
import { Tabs, Slot, Link, usePathname, useRouter } from 'expo-router';
import { View, Text, TouchableOpacity, useWindowDimensions, Platform, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon } from '@/components/ui/icon';
import { useAuth } from '@/contexts/auth';
import { ProfileContent } from '@/components/profile-content';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';

function SidebarItem({ name, icon, label, active, onPress }: { name: string, icon: any, label: string, active: boolean, onPress?: () => void }) {
  return (
    <Link href={`/${name}`} asChild>
      <TouchableOpacity
        onPress={onPress}
        className={`flex-row items-center px-3 py-2 rounded-xl mb-1.5 ${active ? 'bg-slate-900 shadow-lg shadow-slate-200' : 'hover:bg-slate-50'}`}
      >
        <Icon
          name={icon}
          size={16}
          color={active ? '#ffffff' : '#64748b'}
        />
        <Text
          className={`ml-2.5 text-sm font-bold tracking-tight ${active ? 'text-white' : 'text-slate-600'}`}
          style={{ fontFamily: 'Geist' }}
        >
          {label}
        </Text>
      </TouchableOpacity>
    </Link>
  );
}

const Header = ({ onMenuPress, onProfilePress }: { onMenuPress: () => void, onProfilePress: () => void }) => {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const isMobile = width < 768;

  return (
    <View
      className="flex-row items-center justify-between px-4 border-b border-slate-100 bg-white z-30"
      style={{ paddingTop: insets.top, height: 64 + insets.top }}
    >
      <TouchableOpacity onPress={onMenuPress} className="w-10 h-10 items-center justify-center rounded-full hover:bg-slate-50">
        <Icon name="line.3.horizontal" size={24} color="#0f172a" />
      </TouchableOpacity>
      <View className="flex-row items-center">
        <Text className={`font-black text-slate-900 tracking-tighter ${isMobile ? 'text-xl' : 'text-lg'}`} style={{ fontFamily: 'Geist' }}>ApplyAI</Text>
      </View>
      <TouchableOpacity onPress={onProfilePress} className="w-10 h-10 items-center justify-center rounded-full hover:bg-slate-50">
        <Icon name="person.circle" size={26} color="#0f172a" />
      </TouchableOpacity>
    </View>
  );
};

export default function TabsLayout() {
  const { width } = useWindowDimensions();
  const pathname = usePathname();
  const router = useRouter();
  const { session, signOut } = useAuth();
  const insets = useSafeAreaInsets();

  const [isLeftDrawerOpen, setLeftDrawerOpen] = useState(false);
  const [isRightDrawerOpen, setRightDrawerOpen] = useState(false);

  // Profile logic for the drawer
  const [profile, setProfile] = useState<any>(null);
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  const isDesktop = width > 1024;
  const isMobile = width < 768;

  const fetchProfile = async () => {
    if (!session) return;
    setLoadingProfile(true);
    const apiUrl = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:4002';
    try {
      const response = await fetch(`${apiUrl}/api/profile`, {
        headers: { 'Authorization': `Bearer ${session?.access_token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setProfile(data);
      }
    } catch (e) {
      console.error('Fetch profile error:', e);
    } finally {
      setLoadingProfile(false);
    }
  };

  useEffect(() => {
    if (isRightDrawerOpen && !profile) {
      fetchProfile();
    }
  }, [isRightDrawerOpen]);

  const handlePickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      quality: 1,
    });
    if (!result.canceled) uploadImage(result.assets[0]);
  };

  const uploadImage = async (asset: ImagePicker.ImagePickerAsset) => {
    setUploadingImage(true);
    const apiUrl = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:4002';
    try {
      const formData = new FormData();
      // Use fetch to get blob for compatibility with Expo's new fetch implementation
      const response = await fetch(asset.uri);
      const blob = await response.blob();

      // Detect mimetype: priority to blob.type, then asset.mimeType, then URI extension
      let mimeType = blob.type;
      if (!mimeType || mimeType === 'text/plain' || mimeType === 'application/octet-stream') {
        mimeType = asset.mimeType || (asset.uri.toLowerCase().endsWith('.png') ? 'image/png' : 'image/jpeg');
      }

      const fileExt = mimeType.includes('png') ? 'png' : 'jpg';
      const imageBlob = new Blob([blob], { type: mimeType });
      formData.append('file', imageBlob, `profile.${fileExt}`);

      const uploadResponse = await fetch(`${apiUrl}/api/profile/image`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${session?.access_token}` },
        body: formData,
      });
      if (uploadResponse.ok) {
        const { imageUrl } = await uploadResponse.json();
        setProfile((prev: any) => ({ ...prev, profileImageUrl: `${imageUrl}?t=${Date.now()}` }));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setUploadingImage(false);
    }
  };

  const handleUploadResume = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({ type: 'application/pdf' });
      if (result.canceled) return;
      setUploading(true);
      const file = result.assets[0];

      const formData = new FormData();
      // Use fetch to get blob for compatibility with Expo's new fetch implementation
      const response = await fetch(file.uri);
      const blob = await response.blob();

      // Ensure the blob is explicitly marked as a PDF
      const pdfBlob = new Blob([blob], { type: 'application/pdf' });
      formData.append('file', pdfBlob, file.name);

      const apiUrl = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:4002';
      const uploadResponse = await fetch(`${apiUrl}/api/resume/upload`, {
        method: 'POST',
        body: formData,
        headers: { 'Accept': 'application/json', 'Authorization': `Bearer ${session?.access_token}` },
      });

      const data = await uploadResponse.json();
      if (uploadResponse.ok) {
        // Navigate first
        router.push({ pathname: '/job-form', params: { data: JSON.stringify(data.extractedData) } });

        // Then close drawer
        setTimeout(() => {
          setRightDrawerOpen(false);
        }, 100);
      } else {
        const fullError = data.message ? `${data.error}: ${data.message}` : (data.error || 'Upload failed');
        Alert.alert('Upload Error', fullError);
      }
    } catch (error: any) {
      console.error('Upload error:', error);
      Alert.alert('Error', error.message || 'Something went wrong');
    } finally {
      setUploading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      setRightDrawerOpen(false);
      await signOut();
    } catch (e) {
      console.error('Sign out error:', e);
      Alert.alert('Error', 'Failed to sign out. Please try again.');
    }
  };

  if (isDesktop) {
    return (
      <View
        className="flex-1 flex-row bg-white overflow-hidden"
        style={Platform.OS === 'web' ? { height: '100vh' } : { flex: 1 }}
      >
        {/* Sidebar */}
        <View className="w-64 border-r border-slate-100 p-4 bg-white h-full">
          <View className="mb-8 ml-2">
            <Text className="text-xl font-black text-slate-900 tracking-tighter" style={{ fontFamily: 'Geist' }}>ApplyAI</Text>
            <Text className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-0.5">Recruitment Hub</Text>
          </View>

          <View className="flex-1">
            <SidebarItem
              name="assistant"
              icon="sparkles.fill"
              label="Assistant"
              active={pathname.includes('/assistant')}
            />
            <SidebarItem
              name="applications"
              icon="briefcase.fill"
              label="Applications"
              active={pathname.includes('/applications')}
            />
            <SidebarItem
              name="profile"
              icon="person.fill"
              label="My Profile"
              active={pathname.includes('/profile')}
            />
          </View>

          <TouchableOpacity
            onPress={handleSignOut}
            className="flex-row items-center p-3 rounded-xl hover:bg-red-50"
          >
            <Icon name="rectangle.portrait.and.arrow.right" size={16} color="#ef4444" />
            <Text className="ml-2 text-sm font-bold text-red-500">Sign Out</Text>
          </TouchableOpacity>
        </View>

        {/* Content */}
        <View className="flex-1 bg-slate-50/30 h-full overflow-hidden">
          <Slot />
        </View>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-white">
      <Header
        onMenuPress={() => setLeftDrawerOpen(true)}
        onProfilePress={() => setRightDrawerOpen(true)}
      />

      <View className="flex-1" style={{ paddingBottom: insets.bottom }}>
        <Tabs screenOptions={{
          tabBarStyle: { display: 'none' },
          headerShown: false,
        }}>
          <Tabs.Screen name="assistant" options={{ title: 'Assistant' }} />
          <Tabs.Screen name="applications" options={{ title: 'Applications' }} />
          <Tabs.Screen name="profile" options={{ title: 'Profile' }} />
        </Tabs>
      </View>

      {/* Left Drawer (Navigation) */}
      {isLeftDrawerOpen && (
        <View className="absolute inset-0 z-50 flex-row">
          <TouchableOpacity
            className="absolute inset-0 bg-slate-900/40"
            activeOpacity={1}
            onPress={() => setLeftDrawerOpen(false)}
          />
          <View className="w-72 bg-white h-full p-10 shadow-2xl" style={{ paddingTop: insets.top + 48 }}>
             <View className="flex-row justify-between items-center mb-16">
                <Text className={`font-black text-slate-900 tracking-tighter ${isMobile ? 'text-4xl' : 'text-2xl'}`} style={{ fontFamily: 'Geist' }}>ApplyAI</Text>
                <TouchableOpacity onPress={() => setLeftDrawerOpen(false)}>
                  <Icon name="xmark" size={28} color="#64748b" />
                </TouchableOpacity>
             </View>

             <View className="flex-1 gap-8">
                <SidebarItem
                  name="assistant"
                  icon="sparkles.fill"
                  label="Assistant"
                  active={pathname.includes('/assistant')}
                  onPress={() => setLeftDrawerOpen(false)}
                />
                <SidebarItem
                  name="applications"
                  icon="briefcase.fill"
                  label="Applications"
                  active={pathname.includes('/applications')}
                  onPress={() => setLeftDrawerOpen(false)}
                />
             </View>
          </View>
        </View>
      )}

      {/* Right Drawer (Profile) */}
      {isRightDrawerOpen && (
        <View className="absolute inset-0 z-50 flex-row justify-end">
          <TouchableOpacity
            className="absolute inset-0 bg-slate-900/40"
            activeOpacity={1}
            onPress={() => setRightDrawerOpen(false)}
          />
          <View className={`${isMobile ? 'w-full' : 'w-80'} bg-white h-full shadow-2xl overflow-hidden`} style={{ paddingTop: insets.top }}>
             <View className="flex-row justify-between items-center p-6 border-b border-slate-100">
                <Text className={`font-bold text-slate-900 ${isMobile ? 'text-xl' : 'text-lg'}`}>My Workspace</Text>
                <TouchableOpacity onPress={() => setRightDrawerOpen(false)}>
                  <Icon name="xmark" size={20} color="#64748b" />
                </TouchableOpacity>
             </View>

             <ProfileContent
                profile={profile}
                loading={loadingProfile}
                uploading={uploading}
                uploadingImage={uploadingImage}
                onPickImage={handlePickImage}
                onUploadResume={handleUploadResume}
                onSignOut={handleSignOut}
             />
          </View>
        </View>
      )}
    </View>
  );
}
