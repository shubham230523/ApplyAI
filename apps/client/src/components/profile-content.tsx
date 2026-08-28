import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator, Platform, useWindowDimensions } from 'react-native';
import { Icon } from '@/components/ui/Icon';
import { Image } from 'expo-image';

interface ProfileContentProps {
  profile: any;
  loading: boolean;
  uploading: boolean;
  uploadingImage: boolean;
  onPickImage: () => void;
  onUploadResume: () => void;
  onSignOut: () => void;
}

export const ProfileContent: React.FC<ProfileContentProps> = ({
  profile,
  loading,
  uploading,
  uploadingImage,
  onPickImage,
  onUploadResume,
  onSignOut,
}) => {
  const { width } = useWindowDimensions();
  const isMobile = width < 768;

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center">
        <ActivityIndicator color="#2563eb" />
      </View>
    );
  }

  return (
    <ScrollView
      className="flex-1 w-full px-6"
      showsVerticalScrollIndicator={Platform.OS === 'web'}
      contentContainerStyle={{ flexGrow: 1 }}
    >
      <View className="py-8">
        <Text className={`${isMobile ? 'text-4xl' : 'text-3xl'} font-black text-gray-900 tracking-tight`}>Profile</Text>
        {profile?.email ? (
          <Text className={`${isMobile ? 'text-lg' : 'text-base'} text-gray-500 mt-1 font-medium`}>{profile.email}</Text>
        ) : null}
      </View>

      <View className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm mb-6">
        <View className="flex-row items-center mb-6">
          <TouchableOpacity
            onPress={onPickImage}
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
              />
            ) : null}

            {uploadingImage && (
              <View className="absolute inset-0 bg-black/20 items-center justify-center z-10">
                <ActivityIndicator color="white" size="small" />
              </View>
            )}
          </TouchableOpacity>
          <View className="ml-4">
            <Text className={`${isMobile ? 'text-2xl' : 'text-xl'} font-bold text-gray-900`}>{profile?.name || 'Complete your profile'}</Text>
            <Text className={`${isMobile ? 'text-base' : 'text-sm'} text-gray-400 font-medium`}>AI Recruitment Ready</Text>
          </View>
        </View>

        <Text className={`${isMobile ? 'text-[11px]' : 'text-xs'} font-black text-gray-400 uppercase tracking-widest mb-4`}>Resume & AI Data</Text>

        <TouchableOpacity
          onPress={onUploadResume}
          disabled={uploading}
          className="bg-blue-600 p-4 rounded-2xl flex-row justify-center items-center shadow-lg shadow-blue-100"
        >
          {uploading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Icon name="doc.fill.badge.plus" size={18} color="white" />
              <Text className={`${isMobile ? 'text-lg' : 'text-base'} text-white font-bold ml-2`}>Update AI Profile (PDF)</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      {profile && (
        <View className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm mb-6">
          <Text className={`${isMobile ? 'text-[11px]' : 'text-xs'} font-black text-gray-400 uppercase tracking-widest mb-6`}>Experience Highlights</Text>

          <View className="gap-6">
            <View>
              <Text className={`${isMobile ? 'text-[11px]' : 'text-[10px]'} text-gray-400 font-bold uppercase mb-1`}>Headline</Text>
              <Text className={`${isMobile ? 'text-xl' : 'text-lg'} text-gray-900 font-medium leading-tight`}>{profile.headline || 'Strategic Professional'}</Text>
            </View>

            <View className="flex-row gap-8">
              <View>
                <Text className={`${isMobile ? 'text-[11px]' : 'text-[10px]'} text-gray-400 font-bold uppercase mb-1`}>Experience</Text>
                <Text className={`${isMobile ? 'text-xl' : 'text-lg'} text-gray-900 font-bold`}>{profile.yearsExperience || 0} Years</Text>
              </View>
              <View className="flex-1">
                <Text className={`${isMobile ? 'text-[11px]' : 'text-[10px]'} text-gray-400 font-bold uppercase mb-1`}>Top Skills</Text>
                <Text className={`${isMobile ? 'text-xl' : 'text-lg'} text-gray-900 font-bold`} numberOfLines={1}>
                  {Array.isArray(profile.skills) ? profile.skills.slice(0, 3).join(', ') : 'Not set'}
                </Text>
              </View>
            </View>

            {profile.address && (
              <View>
                <Text className={`${isMobile ? 'text-[11px]' : 'text-[10px]'} text-gray-400 font-bold uppercase mb-1`}>Location</Text>
                <Text className={`${isMobile ? 'text-base' : 'text-sm'} text-gray-900 font-medium`}>{profile.address}</Text>
              </View>
            )}
          </View>
        </View>
      )}

      <TouchableOpacity
        onPress={onSignOut}
        className="flex-row items-center justify-center p-5 bg-red-50 rounded-2xl border border-red-100 mb-20"
      >
        <Icon name="rectangle.portrait.and.arrow.right" size={16} color="#ef4444" />
        <Text className={`${isMobile ? 'text-lg' : 'text-base'} text-red-500 font-bold ml-2`}>Sign Out Securely</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};
