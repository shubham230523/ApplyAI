import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Platform } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Icon } from '@/components/ui/Icon';
import { ApplicationDetail } from '@applyai/shared-types';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ApplicationDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [application, setApplication] = useState<ApplicationDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchApplication = async () => {
      const apiUrl = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:4000';
      try {
        const response = await fetch(`${apiUrl}/api/applications/${id}`);
        if (!response.ok) {
           throw new Error(`Server returned ${response.status}`);
        }
        const data = await response.json();
        setApplication(data);
      } catch (error) {
        console.error('Fetch error in Application Details:', error);
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchApplication();
  }, [id]);

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-gray-50">
        <ActivityIndicator color="#2563eb" />
      </View>
    );
  }

  if (!application) {
    return (
      <View className="flex-1 justify-center items-center bg-gray-50">
        <Text className="text-gray-400 font-bold">Application not found.</Text>
        <TouchableOpacity onPress={() => router.back()} className="mt-4">
          <Text className="text-blue-600 font-bold">Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const appliedDate = new Date(application.appliedAt).toLocaleDateString(undefined, {
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  });

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <View className="px-5 py-4 flex-row items-center bg-white border-b border-gray-100">
        <TouchableOpacity onPress={() => router.back()} className="p-2">
          <Icon name="chevron.left" size={20} color="#1f2937" />
        </TouchableOpacity>
        <Text className="text-lg font-bold text-gray-900 ml-2">Application Detail</Text>
      </View>

      <ScrollView className="flex-1">
        <View className="p-6">
          {/* Header Card */}
          <View className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm mb-6">
            <View className="flex-row items-center mb-6">
              <View className="w-16 h-16 bg-gray-50 rounded-2xl items-center justify-center border border-gray-100 overflow-hidden">
                <Image
                  source={{ uri: application.companyLogoUrl }}
                  style={{ width: '100%', height: '100%' }}
                  contentFit="contain"
                  placeholder={{ uri: `https://api.dicebear.com/7.x/initials/svg?seed=${application.companyName}` }}
                />
              </View>
              <View className="flex-1 ml-4">
                <Text className="text-xl font-bold text-gray-900">{application.jobTitle}</Text>
                <Text className="text-base text-gray-500 font-medium">{application.companyName}</Text>
              </View>
            </View>

            <View className="flex-row items-center justify-between pt-6 border-t border-gray-50">
              <View>
                <Text className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Status</Text>
                <View className="bg-blue-50 px-3 py-1 rounded-full self-start">
                  <Text className="text-blue-600 text-[10px] font-black uppercase tracking-wider">{application.status}</Text>
                </View>
              </View>
              <View className="items-end">
                <Text className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Applied On</Text>
                <Text className="text-sm font-bold text-gray-900">{appliedDate}</Text>
              </View>
            </View>
          </View>

          {/* AI Cover Letter Section */}
          <View className="bg-blue-900 p-8 rounded-[32px] shadow-xl mb-6">
            <View className="flex-row items-center mb-6">
              <View className="bg-blue-400 w-2.5 h-2.5 rounded-full mr-3" />
              <Text className="text-blue-200 font-bold uppercase text-[10px] tracking-widest">AI Generated Response</Text>
            </View>
            <Text className="text-white text-lg font-bold leading-snug mb-6">
              Neural scout crafted this response based on your profile match for the {application.jobTitle} role.
            </Text>

            <View className="bg-white/10 p-6 rounded-2xl border border-white/10">
              <Text className="text-blue-50 text-base leading-relaxed">
                {application.aiCoverLetter || "Strategic analysis complete. No custom cover letter was required for this submission."}
              </Text>
            </View>
          </View>

          {/* Job Details Reference */}
          <View className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
            <Text className="text-lg font-bold text-gray-900 mb-4">Role Context</Text>
            <Text className="text-gray-600 leading-relaxed text-sm">
              {application.jobDescription}
            </Text>

            <TouchableOpacity
              onPress={() => router.push(`/job/${application.jobId}`)}
              className="mt-6 py-4 bg-gray-50 rounded-2xl items-center border border-gray-100"
            >
              <Text className="text-gray-900 font-bold text-sm">View Original Listing</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
