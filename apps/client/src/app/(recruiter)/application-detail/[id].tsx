import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, ScrollView, RefreshControl, Platform, useWindowDimensions, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAuth } from '@/contexts/auth';
import { Icon } from '@/components/ui/Icon';

export default function ApplicationDetailScreen() {
  const { id } = useLocalSearchParams();
  const { session } = useAuth();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isDesktop = width > 1024;

  const [application, setApplication] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchDetail = useCallback(async () => {
    const apiUrl = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:4002';
    try {
      const response = await fetch(`${apiUrl}/api/applications/recruiter-detail/${id}`, {
        headers: { 'Authorization': `Bearer ${session?.access_token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setApplication(data);
      }
    } catch (e) {
      console.error('Fetch application detail error:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [id, session]);

  useEffect(() => {
    if (session && id) fetchDetail();
  }, [session, id, fetchDetail]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchDetail();
  }, [fetchDetail]);

  if (loading && !refreshing) {
    return (
      <View className="flex-1 justify-center items-center bg-[#fafaf9]">
        <ActivityIndicator color="#059669" />
      </View>
    );
  }

  if (!application) return null;

  return (
    <View style={{ flex: 1, backgroundColor: '#fafaf9' }}>
      <SafeAreaView style={{ flex: 1 }} edges={['top', 'left', 'right']}>
        {/* Header */}
        <View className="px-6 py-5 bg-white border-b border-slate-100 flex-row items-center z-10 shadow-sm">
          <TouchableOpacity
            onPress={() => router.back()}
            className="w-10 h-10 bg-slate-50 rounded-xl items-center justify-center mr-4"
          >
            <Icon name="chevron.left" size={20} color="#1e293b" />
          </TouchableOpacity>
          <View>
            <Text className="text-xl font-black text-slate-900 tracking-tight">Candidate Profile</Text>
            <Text className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{application.jobTitle}</Text>
          </View>
        </View>

        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{
            padding: 24,
            paddingBottom: 120, // More bottom padding
          }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#059669" />}
          showsVerticalScrollIndicator={true}
        >
          <View style={{ width: '100%', maxWidth: 1000, alignSelf: 'center' }}>
            {/* Candidate Card */}
            <View className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-xl shadow-slate-200/40 mb-8">
              <View className="flex-row items-center mb-8">
                <View className="w-20 h-20 bg-emerald-50 rounded-[28px] items-center justify-center mr-6 border border-emerald-100">
                  <Icon name="person.fill" size={40} color="#059669" />
                </View>
                <View className="flex-1">
                  <Text className="text-3xl font-black text-slate-900 tracking-tight">{application.candidateName || 'Candidate'}</Text>
                  <Text className="text-slate-500 font-bold">{application.candidateHeadline || 'Experienced Professional'}</Text>
                  <View className="flex-row items-center mt-3">
                     <View className="bg-emerald-600 px-3 py-1 rounded-full mr-3">
                        <Text className="text-white text-[9px] font-black uppercase tracking-widest">{application.status}</Text>
                     </View>
                     <Text className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">Applied {new Date(application.appliedAt).toLocaleDateString()}</Text>
                  </View>
                </View>
              </View>

              <View className="h-[1px] bg-slate-50 mb-8" />

              <View className="flex-row flex-wrap gap-6">
                <View className="flex-1 min-w-[200px]">
                  <Text className="text-[10px] font-black text-slate-400 uppercase tracking-[2px] mb-2">Email</Text>
                  <Text className="text-slate-900 font-bold">{application.candidateEmail}</Text>
                </View>
                <View className="flex-1 min-w-[200px]">
                  <Text className="text-[10px] font-black text-slate-400 uppercase tracking-[2px] mb-2">Phone</Text>
                  <Text className="text-slate-900 font-bold">{application.candidatePhone || 'Not provided'}</Text>
                </View>
              </View>

              {application.resumeUrl && (
                <TouchableOpacity
                  onPress={() => Linking.openURL(application.resumeUrl)}
                  className="mt-8 bg-slate-50 p-5 rounded-2xl border border-slate-100 flex-row items-center justify-between active:bg-slate-100"
                >
                  <View className="flex-row items-center">
                    <Icon name="doc.badge.plus" size={20} color="#059669" />
                    <Text className="ml-3 text-slate-900 font-bold">View Full Resume (PDF)</Text>
                  </View>
                  <Icon name="link" size={16} color="#94a3b8" />
                </TouchableOpacity>
              )}
            </View>

            {/* AI Cover Letter */}
            <View className="bg-slate-900 p-10 rounded-[40px] shadow-2xl shadow-slate-300 mb-8 border-b-8 border-emerald-600">
              <View className="flex-row items-center mb-6">
                <View className="w-10 h-10 bg-emerald-500 rounded-2xl items-center justify-center mr-4">
                   <Icon name="sparkles.fill" size={20} color="white" />
                </View>
                <Text className="text-white text-xl font-black tracking-tight">Neural Application Summary</Text>
              </View>
              <Text className="text-slate-300 leading-relaxed font-medium italic">
                "{application.aiCoverLetter}"
              </Text>
            </View>

            {/* Resume Skills */}
            {application.candidateSkills && application.candidateSkills.length > 0 && (
              <View className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-xl shadow-slate-200/40 mb-8">
                <Text className={`${isDesktop ? 'text-[11px]' : 'text-[10px]'} font-black text-slate-400 uppercase tracking-widest mb-6`}>Candidate Skills</Text>
                <View className="flex-row flex-wrap gap-3">
                  {application.candidateSkills.map((skill: string, index: number) => (
                    <View key={index} className="bg-slate-50 px-5 py-2.5 rounded-2xl border border-slate-100">
                      <Text className="text-slate-700 font-bold text-xs">{skill}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* Action Footer */}
            <View className="flex-row gap-4 mt-4">
              <TouchableOpacity className="flex-1 bg-emerald-600 py-6 rounded-[32px] items-center justify-center shadow-xl shadow-emerald-200 active:scale-95">
                <Text className="text-white font-black uppercase tracking-[2px] text-xs">Interview Candidate</Text>
              </TouchableOpacity>
              <TouchableOpacity className="flex-1 bg-white py-6 rounded-[32px] items-center justify-center border border-slate-200 active:scale-95">
                <Text className="text-slate-600 font-black uppercase tracking-[2px] text-xs">Reject</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
