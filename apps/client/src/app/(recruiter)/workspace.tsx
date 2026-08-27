import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, SafeAreaView, Alert, ScrollView, RefreshControl } from 'react-native';
import { useAuth } from '@/contexts/auth';
import { Icon } from '@/components/ui/icon';
import { useRouter } from 'expo-router';
import { Job } from '@applyai/shared-types';

export default function RecruiterDashboard() {
  const { session, user, signOut } = useAuth();
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(async () => {
    const apiUrl = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:4000';
    try {
      const [profileRes, jobsRes] = await Promise.all([
        fetch(`${apiUrl}/api/profile/recruiter`, {
          headers: { 'Authorization': `Bearer ${session?.access_token}` },
        }),
        fetch(`${apiUrl}/api/jobs/recruiter`, {
          headers: { 'Authorization': `Bearer ${session?.access_token}` },
        })
      ]);

      if (profileRes.ok) {
        const profileData = await profileRes.json();
        setProfile(profileData);
      }

      if (jobsRes.ok) {
        const jobsData = await jobsRes.json();
        setJobs(jobsData);
      }
    } catch (e) {
      console.error('Fetch error:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [session]);

  useEffect(() => {
    if (session) fetchData();
  }, [session, fetchData]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchData();
  }, [fetchData]);

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (e) {
      console.error('Sign out error:', e);
      Alert.alert('Error', 'Failed to sign out. Please try again.');
    }
  };

  const displayName = profile?.name || user?.email?.split('@')[0] || 'Recruiter';

  if (loading && !refreshing) {
    return (
      <View className="flex-1 justify-center items-center bg-[#fafaf9]">
        <ActivityIndicator color="#059669" />
      </View>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-[#fafaf9]">
      {/* Header */}
      <View className="px-6 py-4 bg-white border-b border-slate-100 flex-row justify-between items-center z-10">
        <View className="flex-row items-center">
          <View className="w-8 h-8 bg-emerald-600 rounded-lg items-center justify-center mr-3 shadow-sm">
            <Icon name="briefcase.fill" size={16} color="white" />
          </View>
          <Text className="text-xl font-black text-slate-900 tracking-tighter">ApplyAI</Text>
          <View className="ml-2 px-2 py-0.5 bg-emerald-50 rounded-md border border-emerald-100">
            <Text className="text-[10px] font-black text-emerald-700 uppercase">Recruiter</Text>
          </View>
        </View>

        <TouchableOpacity onPress={handleSignOut} className="flex-row items-center px-3 py-2 rounded-xl active:bg-red-50">
          <Icon name="rectangle.portrait.and.arrow.right" size={16} color="#ef4444" />
          <Text className="ml-2 text-xs font-bold text-red-500">Sign Out</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 40, pb: 100 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#059669" />}
      >
        <View className="w-full max-w-4xl mx-auto">
          <View className="flex-row justify-between items-end mb-10">
            <View>
              <Text className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-2">Workspace</Text>
              <Text className="text-4xl font-black text-slate-900 tracking-tight">Hi {displayName}</Text>
            </View>
            <TouchableOpacity
              onPress={() => router.push('/(recruiter)/create-job')}
              className="bg-emerald-600 px-6 py-4 rounded-2xl shadow-lg shadow-emerald-200 flex-row items-center active:scale-95"
            >
              <Icon name="plus.circle.fill" size={18} color="white" />
              <Text className="text-white font-black uppercase text-xs tracking-widest ml-2">Post Job</Text>
            </TouchableOpacity>
          </View>

          {jobs.length === 0 ? (
            <View className="bg-white p-16 rounded-[40px] border border-slate-100 shadow-xl shadow-slate-200/50 items-center">
              <View className="w-20 h-20 bg-emerald-50 rounded-3xl items-center justify-center mb-8">
                <Icon name="sparkles.fill" size={40} color="#059669" />
              </View>
              <Text className="text-2xl font-bold text-slate-900 mb-3 text-center">No jobs posted yet</Text>
              <Text className="text-slate-500 text-center text-lg max-w-md mb-10 leading-relaxed">
                Start building your talent pipeline by posting your first job requirement.
              </Text>

              <TouchableOpacity
                onPress={() => router.push('/(recruiter)/create-job')}
                className="bg-slate-900 px-10 py-5 rounded-2xl shadow-lg active:scale-95"
              >
                <Text className="text-white font-black uppercase tracking-widest text-sm">Create First Job</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View className="space-y-4">
              <Text className="text-slate-400 font-bold text-[10px] uppercase tracking-widest mb-4 ml-1">Active Job Postings ({jobs.length})</Text>
              {jobs.map((job) => (
                <TouchableOpacity
                  key={job.id}
                  className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex-row items-center mb-4 active:bg-slate-50"
                  onPress={() => {
                    // Navigate to job details or applications
                    // router.push(`/(recruiter)/job/${job.id}`);
                  }}
                >
                  <View className="w-14 h-14 bg-slate-50 rounded-2xl items-center justify-center mr-5 border border-slate-100">
                    <Icon name="briefcase.fill" size={24} color="#64748b" />
                  </View>
                  <View className="flex-1">
                    <Text className="text-lg font-bold text-slate-900 mb-1">{job.title}</Text>
                    <View className="flex-row items-center">
                      <Icon name="mappin.circle" size={12} color="#94a3b8" />
                      <Text className="text-slate-400 text-sm ml-1 font-medium">{job.location || 'Remote'}</Text>
                      <View className="w-1 h-1 rounded-full bg-slate-300 mx-3" />
                      <Text className="text-emerald-600 text-xs font-bold uppercase tracking-wider">{job.employmentType?.replace('_', ' ') || 'FULL TIME'}</Text>
                    </View>
                  </View>
                  <View className="items-end">
                    <View className="bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-100">
                       <Text className="text-emerald-700 text-[10px] font-black uppercase">Active</Text>
                    </View>
                    <Text className="text-slate-300 text-[10px] mt-2 font-bold uppercase">Posted {new Date(job.postedAt).toLocaleDateString()}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
        <View className="h-20" />
      </ScrollView>
    </SafeAreaView>
  );
}
