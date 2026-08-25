import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, SafeAreaView, Platform, Linking } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { Job } from '@applyai/shared-types';
import { Image } from 'expo-image';

export default function JobDetailsScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchJob = async () => {
      const apiUrl = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:4000';
      try {
        const response = await fetch(`${apiUrl}/api/jobs/${id}`);
        if (!response.ok) {
           throw new Error(`Server returned ${response.status}`);
        }
        const data = await response.json();
        setJob(data);
      } catch (error) {
        console.error('Fetch error in Job Details:', error);
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchJob();
  }, [id]);

  const handleApply = () => {
    if (job?.applicationUrl) {
      Linking.openURL(job.applicationUrl);
    }
  };

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-[#fafaf9]">
        <ActivityIndicator color="#6366f1" />
      </View>
    );
  }

  if (!job) {
    return (
      <View className="flex-1 justify-center items-center bg-[#fafaf9]">
        <Text className="text-slate-400 font-bold">Opportunity not found.</Text>
        <TouchableOpacity onPress={() => router.back()} className="mt-4">
          <Text className="text-indigo-600 font-bold font-[Inter]">Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-[#fafaf9] h-screen overflow-hidden" style={Platform.OS === 'web' ? { height: '100vh' } : { flex: 1 }}>
      {/* Sticky Header */}
      <View className="px-5 py-4 border-b border-slate-200/60 glass z-20 flex-row items-center justify-between bg-white/80">
        <TouchableOpacity
          onPress={() => router.back()}
          className="w-10 h-10 rounded-xl bg-slate-50 items-center justify-center border border-slate-200/60 active:bg-slate-100"
        >
          <SymbolView name="chevron.left" size={16} tintColor="#1e293b" />
        </TouchableOpacity>

        <View className="items-center flex-1 mx-4">
          <Text className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Role Analysis</Text>
          <Text className="text-base font-bold text-slate-900 tracking-tight" numberOfLines={1}>{job.company}</Text>
        </View>

        <TouchableOpacity className="w-10 h-10 rounded-xl bg-slate-50 items-center justify-center border border-slate-200/60">
          <SymbolView name="square.and.arrow.up" size={16} tintColor="#1e293b" />
        </TouchableOpacity>
      </View>

      <View className="flex-1">
        <ScrollView
          className="flex-1 h-full"
          contentContainerStyle={{ paddingBottom: 120 }}
          showsVerticalScrollIndicator={true}
        >
          {/* Focused Content Container */}
          <View className="w-full max-w-4xl mx-auto px-6 pt-10">
            <View className="bg-indigo-50 self-start px-3 py-1 rounded-lg border border-indigo-100 mb-6 shadow-sm shadow-indigo-100">
              <Text className="text-indigo-700 text-[9px] font-bold tracking-widest uppercase">Strategic Match</Text>
            </View>

            <Text className="text-2xl font-bold text-slate-900 leading-tight tracking-tight" style={{ fontFamily: 'Outfit' }}>
              {job.title}
            </Text>

            <View className="flex-row items-center mt-6">
              <View className="w-12 h-12 bg-white rounded-2xl items-center justify-center shadow-sm border border-slate-200/60 overflow-hidden">
                <Image
                  source={{ uri: job.companyLogo }}
                  style={{ width: '100%', height: '100%' }}
                  contentFit="contain"
                  placeholder={{ uri: `https://api.dicebear.com/7.x/initials/svg?seed=${job.company}` }}
                />
              </View>
              <View className="ml-4 flex-1">
                <View className="flex-row items-center justify-between">
                  <Text className="text-lg font-bold text-slate-900 tracking-tight">{job.company}</Text>
                  <View className="bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-100">
                    <Text className="text-emerald-700 text-[10px] font-black uppercase">via {job.source}</Text>
                  </View>
                </View>
                <View className="flex-row items-center mt-1">
                  <SymbolView name="mappin.and.ellipse" size={11} tintColor="#64748b" />
                  <Text className="text-slate-500 font-semibold text-[12px] ml-1.5">
                    {job.location} • {(job.workMode || 'remote').toUpperCase()}
                  </Text>
                </View>
              </View>
            </View>

            <View className="flex-row mt-8 gap-4">
               <View className="flex-1 bg-white p-6 rounded-2xl border border-slate-200/60 shadow-sm">
                  <Text className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Compensation</Text>
                  <Text className="text-xl font-bold text-slate-900" style={{ fontFamily: 'Outfit' }}>
                    {job.salaryMin && job.salaryMax ? `₹${job.salaryMin}-${job.salaryMax} LPA` : 'Not Disclosed'}
                  </Text>
               </View>
               <View className="flex-1 bg-white p-6 rounded-2xl border border-slate-200/60 shadow-sm">
                  <Text className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Target Experience</Text>
                  <Text className="text-xl font-bold text-slate-900" style={{ fontFamily: 'Outfit' }}>{job.experienceMin}+ Years</Text>
               </View>
            </View>

            <View className="mt-12 border-t border-slate-200/60 pt-10">
              <View className="flex-row items-center mb-6">
                 <View className="w-10 h-10 bg-indigo-50 rounded-xl items-center justify-center mr-3 border border-indigo-100/50">
                    <SymbolView name="briefcase.fill" size={16} tintColor="#6366f1" />
                 </View>
                 <Text className="text-lg font-bold text-slate-900 tracking-tight" style={{ fontFamily: 'Outfit' }}>The Opportunity</Text>
              </View>
              <Text className="text-base text-slate-600 leading-relaxed font-normal">
                {job.description}
              </Text>
            </View>

            <View className="mt-12">
              <View className="flex-row items-center mb-6">
                 <View className="w-10 h-10 bg-indigo-50 rounded-xl items-center justify-center mr-3 border border-indigo-100/50">
                    <SymbolView name="cpu.fill" size={16} tintColor="#6366f1" />
                 </View>
                 <Text className="text-lg font-bold text-slate-900 tracking-tight" style={{ fontFamily: 'Outfit' }}>Required Stack</Text>
              </View>
              <View className="flex-row flex-wrap gap-2.5">
                {job.skills?.map((skill, idx) => (
                  <View key={idx} className="bg-white px-5 py-2.5 rounded-xl border border-slate-200/60 shadow-sm">
                    <Text className="text-[13px] text-slate-800 font-bold">{skill}</Text>
                  </View>
                ))}
              </View>
            </View>

            {/* AI Insight Card - Softer Design */}
            <View className="mt-16 mb-12 bg-indigo-950 p-10 rounded-[32px] shadow-xl shadow-indigo-100">
               <View className="flex-row items-center mb-6">
                 <View className="bg-indigo-400 w-2.5 h-2.5 rounded-full mr-3 shadow-sm" />
                 <Text className="text-indigo-300 font-bold uppercase text-[10px] tracking-[0.2em]">Agent Strategic Analysis</Text>
               </View>
               <Text className="text-white text-xl font-bold leading-snug tracking-tight" style={{ fontFamily: 'Inter' }}>
                 This role at {job.company} represents a logical progression for your career trajectory.
                 The {job.title} position leverages your full technical arsenal with high efficiency.
               </Text>
            </View>
          </View>
        </ScrollView>
      </View>

      {/* Floating Apply Bar - Centered Content */}
      <View className="absolute bottom-0 left-0 right-0 p-5 bg-white/80 border-t border-slate-200/60 z-30" style={Platform.OS === 'web' ? { backdropFilter: 'blur(32px)' } as any : {}}>
         <View className="max-w-4xl mx-auto w-full items-center">
           <TouchableOpacity
             onPress={handleApply}
             className="bg-indigo-600 px-10 py-3.5 rounded-xl items-center shadow-xl shadow-indigo-200 active:scale-[0.98] transition-all"
           >
              <Text className="text-white font-bold text-base tracking-widest uppercase">Apply Now</Text>
           </TouchableOpacity>
         </View>
      </View>
    </View>
  );
}
