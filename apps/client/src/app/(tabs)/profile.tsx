import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as DocumentPicker from 'expo-document-picker';
import { Icon } from '@/components/ui/icon';
import { useAuth } from '@/contexts/auth';

export default function ProfileScreen() {
  const { user, signOut } = useAuth();
  const [uploading, setUploading] = useState(false);
  const [profile, setProfile] = useState<any>(null);

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
      // @ts-ignore
      formData.append('resume', {
        uri: file.uri,
        name: file.name,
        type: 'application/pdf',
      });

      const response = await fetch('http://localhost:4000/api/resume/upload', {
        method: 'POST',
        body: formData,
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'multipart/form-data',
        },
      });

      const data = await response.json();
      if (response.ok) {
        setProfile(data.profile);
        Alert.alert('Success', 'Resume parsed and profile updated!');
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

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <ScrollView className="flex-1 w-full max-w-4xl mx-auto px-6">
        <View className="py-8">
          <Text className="text-3xl font-black text-gray-900 tracking-tight">Profile</Text>
          <Text className="text-gray-500 mt-1 font-medium">{user?.email || 'Guest User'}</Text>
        </View>

        <View className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm mb-6">
          <View className="flex-row items-center mb-6">
            <View className="w-16 h-16 bg-blue-100 rounded-full items-center justify-center">
              <Icon name="person.fill" size={32} color="#2563eb" />
            </View>
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
                <Text className="text-gray-900 font-medium text-lg leading-tight">{profile.headline || 'Not set'}</Text>
              </View>

              <View className="flex-row gap-8">
                <View>
                  <Text className="text-gray-400 text-[10px] font-bold uppercase mb-1">Experience</Text>
                  <Text className="text-gray-900 font-bold text-lg">{profile.yearsExperience} Years</Text>
                </View>
                <View className="flex-1">
                  <Text className="text-gray-400 text-[10px] font-bold uppercase mb-1">Top Skills</Text>
                  <Text className="text-gray-900 font-bold text-lg" numberOfLines={1}>{profile.skills?.slice(0, 3).join(', ')}</Text>
                </View>
              </View>
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
