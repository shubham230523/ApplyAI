import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, ScrollView, RefreshControl, Platform, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAuth } from '@/contexts/auth';
import { Icon } from '@/components/ui/Icon';

export default function JobApplicantsScreen() {
  const { id } = useLocalSearchParams();
  const { session } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const isDesktop = width > 1024;
  const isMobile = width < 768;

  const [applicants, setApplicants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchApplicants = useCallback(async () => {
    const apiUrl = process.env.EXPO_PUBLIC_API_URL || 'https://applyai-rtuv.onrender.com';
    try {
      const response = await fetch(`${apiUrl}/api/applications/job/${id}`, {
        headers: { 'Authorization': `Bearer ${session?.access_token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setApplicants(data);
      }
    } catch (e) {
      console.error('Fetch applicants error:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [id, session]);

  useEffect(() => {
    if (session && id) fetchApplicants();
  }, [session, id, fetchApplicants]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchApplicants();
  }, [fetchApplicants]);

  if (loading && !refreshing) {
    return (
      <View className="flex-1 justify-center items-center bg-[#fafaf9]">
        <ActivityIndicator color="#059669" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-[#fafaf9]" style={{ paddingTop: insets.top }}>
      {/* Header */}
      <View className="px-6 py-5 bg-white border-b border-slate-100 flex-row items-center z-10 shadow-sm">
        <TouchableOpacity
          onPress={() => router.back()}
          className="w-10 h-10 bg-slate-50 rounded-xl items-center justify-center mr-4"
        >
          <Icon name="chevron.left" size={20} color="#1e293b" />
        </TouchableOpacity>
        <View>
          <Text className="text-xl font-black text-slate-900 tracking-tight">Applicants</Text>
          <Text className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Review candidates for this role</Text>
        </View>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 24, paddingBottom: 100 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#059669" />}
      >
        <View className="w-full max-w-5xl mx-auto">
          <View className="flex-row justify-between items-center mb-6 px-2">
            <View>
              <Text className="text-slate-400 font-black text-[10px] uppercase tracking-[4px]">Neural Ranking Active</Text>
            </View>
            <View className="bg-emerald-50 px-3 py-1.5 rounded-2xl border border-emerald-100 flex-row items-center">
              <Icon name="sparkles.fill" size={12} color="#059669" />
              <Text className="ml-2 text-emerald-700 text-[10px] font-black uppercase tracking-widest">AI Sorted</Text>
            </View>
          </View>

          {applicants.length === 0 ? (
            <View className="items-center py-20 bg-white rounded-[40px] border border-slate-100 shadow-xl shadow-slate-200/40">
              <View className="w-20 h-20 bg-slate-50 rounded-3xl items-center justify-center mb-6">
                <Icon name="person.circle" size={40} color="#94a3b8" />
              </View>
              <Text className="text-2xl font-black text-slate-900 mb-2">No applicants yet</Text>
              <Text className="text-slate-500 font-medium">Be patient! Our AI is matching candidates.</Text>
            </View>
          ) : (
            <View className="gap-4">
              {applicants.map((app, index) => (
                <TouchableOpacity
                  key={app.id}
                  onPress={() => router.push(`/(recruiter)/application-detail/${app.id}`)}
                  className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-xl shadow-slate-200/30 flex-row items-center active:scale-[0.99] active:bg-slate-50 transition-all"
                >
                  <View className="relative">
                    <View className="w-16 h-16 bg-slate-100 rounded-2xl items-center justify-center mr-5">
                      <Icon name="person.fill" size={32} color="#64748b" />
                    </View>
                    <View className="absolute -top-2 -left-2 bg-slate-900 w-8 h-8 rounded-full items-center justify-center border-2 border-white shadow-sm">
                      <Text className="text-white text-[10px] font-black">#{index + 1}</Text>
                    </View>
                  </View>

                  <View className="flex-1 min-w-0">
                    <View className="flex-row items-center justify-between mb-1">
                      <Text className="text-lg font-black text-slate-900 tracking-tight flex-1" numberOfLines={1}>{app.candidateName || app.candidateEmail.split('@')[0]}</Text>
                      <View className="bg-emerald-50 px-2 py-1 rounded-lg border border-emerald-100 ml-2">
                        <Text className="text-emerald-700 text-[9px] font-black">{app.matchScore || 0}% Match</Text>
                      </View>
                    </View>

                    <View className="flex-row items-center mt-1 flex-wrap">
                      <Text className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">Applied {new Date(app.appliedAt).toLocaleDateString()}</Text>
                      {!isMobile && <View className="w-1 h-1 rounded-full bg-slate-200 mx-3" />}
                      <View className={`bg-blue-50 px-2 py-0.5 rounded-full ${isMobile ? 'mt-1' : 'ml-3'}`}>
                         <Text className="text-blue-600 text-[8px] font-black uppercase tracking-widest">{app.status}</Text>
                      </View>
                    </View>
                  </View>
                  <View className="w-10 h-10 rounded-full bg-slate-50 items-center justify-center border border-slate-100 ml-3">
                     <Icon name="chevron.left" size={14} color="#cbd5e1" style={{ transform: [{ rotate: '180deg' }] }} />
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}
