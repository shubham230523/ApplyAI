import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator, Alert, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { Icon } from '@/components/ui/icon';
import { useAuth } from '@/contexts/auth';
import { useRouter } from 'expo-router';
import { Image } from 'expo-image';

export default function ProfileScreen() {
  const { session, user, signOut } = useAuth();
  const router = useRouter();
  const [uploading, setUploading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);

  const fetchProfile = async () => {
    const apiUrl = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:4000';
    try {
      const response = await fetch(`${apiUrl}/api/profile`, {
        headers: {
          'Authorization': `Bearer ${session?.access_token}`,
        },
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
    if (session) fetchProfile();
  }, [session]);

  const handlePickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      uploadImage(result.assets[0]);
    }
  };

  const uploadImage = async (asset: ImagePicker.ImagePickerAsset) => {
    setUploadingImage(true);
    const apiUrl = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:4000';
    const formData = new FormData();

    if (Platform.OS === 'web') {
      const blob = await fetch(asset.uri).then(r => r.blob());
      formData.append('file', blob, 'profile.jpg');
    } else {
      formData.append('file', {
        uri: asset.uri,
        name: 'profile.jpg',
        type: 'image/jpeg',
      } as any);
    }

    try {
      const response = await fetch(`${apiUrl}/api/profile/image`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session?.access_token}`,
        },
        body: formData,
      });

      if (response.ok) {
        const { imageUrl } = await response.json();
        // Force refresh by adding a timestamp
        const cacheBusterUrl = `${imageUrl}?t=${Date.now()}`;
        setProfile((prev: any) => ({ ...prev, profileImageUrl: cacheBusterUrl }));
        Alert.alert('Success', 'Profile image updated successfully.');
      } else {
        throw new Error('Failed to upload image');
      }
    } catch (e) {
      console.error(e);
      Alert.alert('Upload Error', 'Failed to upload profile picture.');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleUploadResume = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/pdf',
        copyToCacheDirectory: true,
      });

      if (result.canceled) return;

      setUploading(true);
      const file = result.assets[0];

      const formData = new FormData();
      if (Platform.OS === 'web') {
        const blob = await fetch(file.uri).then(r => r.blob());
        formData.append('file', blob, file.name);
      } else {
        // @ts-ignore
        formData.append('file', {
          uri: file.uri,
          name: file.name,
          type: 'application/pdf',
        });
      }

      const apiUrl = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:4000';
      const response = await fetch(`${apiUrl}/api/resume/upload`, {
        method: 'POST',
        body: formData,
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`,
        },
      });

      const data = await response.json();
      if (response.ok) {
        // Navigate to Job Form with extracted data
        router.push({
          pathname: '/job-form',
          params: { data: JSON.stringify(data.extractedData) }
        });
      } else {
        Alert.alert('Error', data.error || 'Failed to upload resume');
      }
    } catch (error) {
      console.error('Upload error:', error);
      Alert.alert('Error', 'Something went wrong during upload');
    } finally {
      setUploading(false);
    }
  };

  if (loadingProfile) {
    return (
      <View className="flex-1 justify-center items-center bg-gray-50">
        <ActivityIndicator color="#2563eb" />
      </View>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <ScrollView className="flex-1 w-full max-w-4xl mx-auto px-6">
        <View className="py-8">
          <Text className="text-3xl font-black text-gray-900 tracking-tight">Profile</Text>
          {profile?.email ? (
            <Text className="text-gray-500 mt-1 font-medium">{profile.email}</Text>
          ) : null}
        </View>

        <View className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm mb-6">
          <View className="flex-row items-center mb-6">
            <TouchableOpacity
              onPress={handlePickImage}
              disabled={uploadingImage}
              className="w-16 h-16 bg-white rounded-2xl items-center justify-center overflow-hidden border border-gray-100 relative"
            >
              <View className="w-full h-full items-center justify-center bg-blue-50">
                <Icon name="person.fill" size={32} color="#2563eb" />
              </View>

              {profile?.profileImageUrl ? (
                <Image
                  key={profile.profileImageUrl}
                  source={{ uri: profile.profileImageUrl }}
                  style={{ width: '100%', height: '100%', position: 'absolute', top: 0, left: 0 }}
                  contentFit="cover"
                  transition={200}
                  onLoad={() => console.log('Profile image loaded')}
                  onError={(e) => console.error('Image load error:', e)}
                />
              ) : null}

              {uploadingImage && (
                <View className="absolute inset-0 bg-black/20 items-center justify-center z-10">
                  <ActivityIndicator color="white" size="small" />
                </View>
              )}
            </TouchableOpacity>
            <View className="ml-4">
              <Text className="text-xl font-bold text-gray-900">{profile?.name || 'Complete your profile'}</Text>
              <Text className="text-gray-400 font-medium">AI Recruitment Ready</Text>
            </View>
          </View>

          <Text className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4">Resume & AI Data</Text>

          <TouchableOpacity
            onPress={handleUploadResume}
            disabled={uploading}
            className="bg-blue-600 p-4 rounded-2xl flex-row justify-center items-center shadow-lg shadow-blue-100"
          >
            {uploading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Icon name="doc.fill.badge.plus" size={18} color="white" />
                <Text className="text-white font-bold ml-2">Update AI Profile (PDF)</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {profile && (
          <View className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm mb-6">
            <Text className="text-xs font-black text-gray-400 uppercase tracking-widest mb-6">Experience Highlights</Text>

            <View className="gap-6">
              <View>
                <Text className="text-gray-400 text-[10px] font-bold uppercase mb-1">Headline</Text>
                <Text className="text-gray-900 font-medium text-lg leading-tight">{profile.headline || 'Strategic Professional'}</Text>
              </View>

              <View className="flex-row gap-8">
                <View>
                  <Text className="text-gray-400 text-[10px] font-bold uppercase mb-1">Experience</Text>
                  <Text className="text-gray-900 font-bold text-lg">{profile.yearsExperience || 0} Years</Text>
                </View>
                <View className="flex-1">
                  <Text className="text-gray-400 text-[10px] font-bold uppercase mb-1">Top Skills</Text>
                  <Text className="text-gray-900 font-bold text-lg" numberOfLines={1}>
                    {Array.isArray(profile.skills) ? profile.skills.slice(0, 3).join(', ') : 'Not set'}
                  </Text>
                </View>
              </View>

              {profile.address && (
                <View>
                  <Text className="text-gray-400 text-[10px] font-bold uppercase mb-1">Location</Text>
                  <Text className="text-gray-900 font-medium text-sm">{profile.address}</Text>
                </View>
              )}
            </View>
          </View>
        )}

        <TouchableOpacity
          onPress={signOut}
          className="flex-row items-center justify-center p-5 bg-red-50 rounded-2xl border border-red-100 mb-20"
        >
          <Icon name="rectangle.portrait.and.arrow.right" size={16} color="#ef4444" />
          <Text className="text-red-500 font-bold ml-2">Sign Out Securely</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}
