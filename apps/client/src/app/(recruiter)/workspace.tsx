import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, SafeAreaView, Alert, ScrollView, RefreshControl, Platform } from 'react-native';
import { useAuth } from '@/contexts/auth';
import { Icon } from '@/components/ui/Icon';
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
    const apiUrl = process.env.EXPO_PUBLIC_API_URL || 'https://applyai-rtuv.onrender.com';
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
  const companyName = profile?.companyName || 'Your Company';
  const totalApplicants = jobs.reduce((sum, job) => sum + ((job as any).applicantCount || 0), 0);

  if (loading && !refreshing) {
    return (
      <View className="flex-1 justify-center items-center bg-[#fafaf9]">
        <ActivityIndicator color="#059669" />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#fafaf9' }}>
      <SafeAreaView style={{ flex: 1 }} edges={['top', 'left', 'right']}>
        {/* Header */}
        <View className="px-6 py-4 bg-white border-b border-slate-100 flex-row justify-between items-center z-10 shadow-sm shadow-slate-200/50">
          <View className="flex-row items-center">
            <View className="w-9 h-9 bg-emerald-600 rounded-xl items-center justify-center mr-3 shadow-lg shadow-emerald-200/50">
              <Icon name="briefcase.fill" size={18} color="white" />
            </View>
            <View>
              <Text className="text-xl font-black text-slate-900 tracking-tighter" style={{ fontFamily: 'Geist' }}>ApplyAI</Text>
              <Text className="text-[9px] font-black text-emerald-600 uppercase tracking-[2px] -mt-1">Workspace</Text>
            </View>
          </View>

          <TouchableOpacity onPress={handleSignOut} className="flex-row items-center px-4 py-2.5 rounded-2xl bg-slate-50 border border-slate-100 active:scale-95 transition-all">
            <Icon name="rectangle.portrait.and.arrow.right" size={16} color="#ef4444" />
            <Text className="ml-2.5 text-xs font-bold text-red-500 uppercase tracking-widest">Exit</Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{
            paddingHorizontal: 24,
            paddingTop: 40,
            paddingBottom: 120, // Increased padding to prevent cropping
          }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#059669" />}
          showsVerticalScrollIndicator={true}
        >
          <View className="w-full max-w-5xl mx-auto">
            {/* Welcome Section */}
            <View className="flex-row justify-between items-center mb-12">
              <View>
                <View className="flex-row items-center mb-2">
                  <View className="w-2 h-2 rounded-full bg-emerald-500 mr-2" />
                  <Text className="text-gray-400 text-[10px] font-black uppercase tracking-[3px]">{companyName}</Text>
                </View>
                <Text className="text-5xl font-black text-slate-900 tracking-tight" style={{ fontFamily: 'Geist' }}>Hi {displayName}</Text>
                <Text className="text-slate-400 text-sm font-medium mt-1">Manage your hiring pipeline and job listings.</Text>
              </View>

              <TouchableOpacity
                onPress={() => router.push('/(recruiter)/create-job')}
                className="bg-emerald-600 px-8 py-5 rounded-[24px] shadow-2xl shadow-emerald-200 flex-row items-center active:scale-[0.98] border-b-4 border-emerald-700"
              >
                <Icon name="plus.circle.fill" size={20} color="white" />
                <Text className="text-white font-black uppercase text-sm tracking-[2px] ml-3">New Job</Text>
              </TouchableOpacity>
            </View>

            <View className="flex-row flex-wrap -mx-3">
              {/* Stats Column */}
              <View className="w-full lg:w-1/3 px-3 mb-8">
                <View className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-xl shadow-slate-200/40">
                    <Text className="text-slate-400 font-black text-[10px] uppercase tracking-widest mb-6">Pipeline Overview</Text>

                    <View className="gap-6">
                      <View className="flex-row items-center justify-between">
                        <View className="flex-row items-center">
                          <View className="w-10 h-10 bg-blue-50 rounded-2xl items-center justify-center mr-4">
                            <Icon name="doc.fill.badge.plus" size={18} color="#2563eb" />
                          </View>
                          <Text className="text-slate-600 font-bold">Active Jobs</Text>
                        </View>
                        <Text className="text-2xl font-black text-slate-900">{jobs.length}</Text>
                      </View>

                      <View className="flex-row items-center justify-between opacity-50">
                        <View className="flex-row items-center">
                          <View className="w-10 h-10 bg-indigo-50 rounded-2xl items-center justify-center mr-4">
                            <Icon name="person.fill" size={18} color="#4f46e5" />
                          </View>
                          <Text className="text-slate-600 font-bold">Total Applicants</Text>
                        </View>
                        <Text className="text-2xl font-black text-slate-900">{totalApplicants}</Text>
                      </View>

                      <View className="h-[1px] bg-slate-50 my-2" />

                      <View className="bg-slate-50 p-4 rounded-3xl border border-slate-100">
                        <Text className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Pro Tip</Text>
                        <Text className="text-slate-600 text-xs font-medium leading-relaxed">
                          Detailed job descriptions help our AI find better matches for you.
                        </Text>
                      </View>
                    </View>
                </View>
              </View>

              {/* Jobs List Column */}
              <View className="w-full lg:w-2/3 px-3">
                {jobs.length === 0 ? (
                  <View className="bg-white p-16 rounded-[40px] border border-slate-100 shadow-xl shadow-slate-200/50 items-center">
                    <View className="w-24 h-24 bg-emerald-50 rounded-[40px] items-center justify-center mb-10 rotate-6 shadow-inner shadow-emerald-100">
                      <Icon name="sparkles.fill" size={48} color="#059669" />
                    </View>
                    <Text className="text-3xl font-black text-slate-900 mb-4 text-center tracking-tight">Ready to hire?</Text>
                    <Text className="text-slate-500 text-center text-lg max-w-sm mb-12 leading-relaxed font-medium">
                      Create your first job posting and let ApplyAI find the best talent for your team.
                    </Text>

                    <TouchableOpacity
                      onPress={() => router.push('/(recruiter)/create-job')}
                      className="bg-slate-900 px-12 py-6 rounded-[28px] shadow-2xl shadow-slate-300 active:scale-95"
                    >
                      <Text className="text-white font-black uppercase tracking-[3px] text-xs">Start Posting</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <View>
                    <View className="flex-row items-center justify-between mb-6 px-2">
                      <Text className="text-slate-400 font-black text-[10px] uppercase tracking-[4px]">Live Postings</Text>
                      <TouchableOpacity className="flex-row items-center">
                        <Text className="text-emerald-600 font-bold text-xs mr-1">View All</Text>
                        <Icon name="chevron.left" size={12} color="#059669" style={{ transform: [{ rotate: '180deg' }] }} />
                      </TouchableOpacity>
                    </View>

                    <View className="gap-5">
                      {jobs.map((job) => (
                        <TouchableOpacity
                          key={job.id}
                          className="bg-white p-7 rounded-[32px] border border-slate-100 shadow-xl shadow-slate-200/30 flex-row items-center active:scale-[0.99] active:bg-slate-50 transition-all"
                          onPress={() => {
                            router.push(`/(recruiter)/job-applications/${job.id}`);
                          }}
                        >
                          <View className="w-16 h-16 bg-slate-50 rounded-3xl items-center justify-center mr-6 border border-slate-100/50 shadow-inner">
                            <Icon name="briefcase.fill" size={28} color="#64748b" />
                          </View>
                          <View className="flex-1">
                            <View className="flex-row items-center mb-1.5">
                              <Text className="text-xl font-black text-slate-900 tracking-tight mr-3">{job.title}</Text>
                              <View className="bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100">
                                <Text className="text-emerald-700 text-[9px] font-black uppercase tracking-wider">Active</Text>
                              </View>
                            </View>
                            <View className="flex-row items-center">
                              <Icon name="mappin.circle" size={14} color="#94a3b8" />
                              <Text className="text-slate-400 text-sm ml-1.5 font-bold tracking-tight">{job.location || 'Remote'}</Text>
                              <View className="w-1 h-1 rounded-full bg-slate-200 mx-4" />
                              <Text className="text-slate-400 text-sm font-bold tracking-tight">{(job as any).applicantCount || 0} Applicants</Text>
                            </View>
                          </View>

                          <View className="w-12 h-12 rounded-full bg-slate-50 items-center justify-center border border-slate-100">
                            <Icon name="chevron.left" size={16} color="#cbd5e1" style={{ transform: [{ rotate: '180deg' }] }} />
                          </View>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                )}
              </View>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
