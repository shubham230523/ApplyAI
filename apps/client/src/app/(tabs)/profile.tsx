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
    const apiUrl = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:4002';
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
      allowsEditing: false,
      quality: 1,
    });

    if (!result.canceled) {
      uploadImage(result.assets[0]);
    }
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
        headers: {
          'Authorization': `Bearer ${session?.access_token}`,
        },
        body: formData,
      });

      if (uploadResponse.ok) {
        const { imageUrl } = await uploadResponse.json();
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
      // Use fetch to get blob for compatibility with Expo's new fetch implementation
      const blobResponse = await fetch(file.uri);
      const blob = await blobResponse.blob();

      // Ensure the blob is explicitly marked as a PDF
      const pdfBlob = new Blob([blob], { type: 'application/pdf' });
      formData.append('file', pdfBlob, file.name);

      const apiUrl = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:4002';
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

  const handleSignOut = async () => {
    try {
      await signOut();
      // No need for manual router.replace('/') as RootLayout handles navigation based on session state
    } catch (e) {
      console.error('Sign out error:', e);
      Alert.alert('Error', 'Failed to sign out. Please try again.');
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
        onSignOut={handleSignOut}
      />
    </SafeAreaView>
  );
}
