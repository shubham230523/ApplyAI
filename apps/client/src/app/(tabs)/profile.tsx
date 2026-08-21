import React, { useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as DocumentPicker from 'expo-document-picker';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useTheme } from '@/hooks/use-theme';
import { useAuth } from '@/contexts/auth';

export default function ProfileScreen() {
  const { user, signOut } = useAuth();
  const [uploading, setUploading] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const theme = useTheme();

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
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ThemedText type="title">Your Profile</ThemedText>
        <ThemedText themeColor="textSecondary">{user?.email}</ThemedText>

        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
          <ThemedView type="backgroundElement" style={styles.section}>
            <ThemedText type="subtitle">Resume</ThemedText>
            <TouchableOpacity
              onPress={handleUploadResume}
              disabled={uploading}
              className="bg-blue-600 p-4 rounded-xl mt-4 flex-row justify-center items-center"
            >
              {uploading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text className="text-white font-bold">Upload & Parse Resume (PDF)</Text>
              )}
            </TouchableOpacity>
          </ThemedView>

          {profile && (
            <ThemedView type="backgroundElement" style={styles.section}>
              <ThemedText type="subtitle">Extracted Details</ThemedText>
              <View className="mt-4 gap-2">
                <ThemedText>Name: {profile.name}</ThemedText>
                <ThemedText>Experience: {profile.yearsExperience} years</ThemedText>
                <ThemedText>Skills: {profile.skills?.join(', ')}</ThemedText>
                <ThemedText>Headline: {profile.headline}</ThemedText>
              </View>
            </ThemedView>
          )}

          <TouchableOpacity
            onPress={signOut}
            className="bg-red-500 p-4 rounded-xl mt-8"
          >
            <Text className="text-white text-center font-bold">Sign Out</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
    padding: 20,
  },
  scroll: {
    flex: 1,
    marginTop: 20,
  },
  scrollContent: {
    gap: 20,
  },
  section: {
    padding: 20,
    borderRadius: 16,
  },
});
