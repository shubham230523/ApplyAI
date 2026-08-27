import React, { useState, useEffect } from 'react';
import { View, ActivityIndicator, Alert, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { ProfileContent } from '@/components/profile-content';
import { useAuth } from '@/contexts/auth';
import { useRouter } from 'expo-router';

export default function ProfileScreen() {
  const { session, signOut } = useAuth();
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
    <SafeAreaView className="flex-1 bg-gray-50" edges={['bottom', 'left', 'right']}>
      <ProfileContent
        profile={profile}
        loading={loadingProfile}
        uploading={uploading}
        uploadingImage={uploadingImage}
        onPickImage={handlePickImage}
        onUploadResume={handleUploadResume}
        onSignOut={signOut}
      />
    </SafeAreaView>
  );
}
