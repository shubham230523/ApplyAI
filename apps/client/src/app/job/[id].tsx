import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, SafeAreaView, Platform, Linking } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { Job } from '@applyai/shared-types';

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
      <View className="px-8 py-6 border-b border-slate-200/60 glass z-20 flex-row items-center justify-between bg-white/80">
        <TouchableOpacity
          onPress={() => router.back()}
          className="w-11 h-11 rounded-2xl bg-slate-50 items-center justify-center border border-slate-200/60 active:bg-slate-100"
        >
          <SymbolView name="chevron.left" size={18} tintColor="#1e293b" />
        </TouchableOpacity>

        <View className="items-center flex-1 mx-4">
          <Text className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-0.5">Role Analysis</Text>
          <Text className="text-xl font-bold text-slate-900 tracking-tight" numberOfLines={1}>{job.company}</Text>
        </View>

        <TouchableOpacity className="w-11 h-11 rounded-2xl bg-slate-50 items-center justify-center border border-slate-200/60">
          <SymbolView name="square.and.arrow.up" size={18} tintColor="#1e293b" />
        </TouchableOpacity>
      </View>

      <View className="flex-1">
        <ScrollView
          className="flex-1 h-full"
          contentContainerStyle={{ paddingBottom: 160 }}
          showsVerticalScrollIndicator={true}
        >
          {/* Focused Content Container */}
          <View className="w-full max-w-5xl mx-auto px-10 pt-16">
            <View className="bg-indigo-50 self-start px-4 py-2 rounded-xl border border-indigo-100 mb-10 shadow-sm shadow-indigo-100">
              <Text className="text-indigo-700 text-[11px] font-bold tracking-widest uppercase">98% Strategic Match</Text>
            </View>

            <Text className="text-4xl font-bold text-slate-900 leading-tight tracking-tighter" style={{ fontFamily: 'Outfit' }}>
              {job.title}
            </Text>

            <View className="flex-row items-center mt-10">
              <View className="w-16 h-16 bg-white rounded-3xl items-center justify-center shadow-sm border border-slate-200/60">
                 <SymbolView name="building.2.fill" size={32} tintColor="#1e293b" />
              </View>
              <View className="ml-6">
                <Text className="text-2xl font-bold text-slate-900 tracking-tight">{job.company}</Text>
                <View className="flex-row items-center mt-1.5">
                  <SymbolView name="mappin.and.ellipse" size={13} tintColor="#64748b" />
                  <Text className="text-slate-500 font-semibold text-[14px] ml-2">
                    {job.location} • {(job.workMode || 'remote').toUpperCase()}
                  </Text>
                </View>
              </View>
            </View>

            <View className="flex-row mt-12 gap-6">
               <View className="flex-1 bg-white p-8 rounded-[32px] border border-slate-200/60 shadow-sm">
                  <Text className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-3">Compensation</Text>
                  <Text className="text-3xl font-bold text-slate-900" style={{ fontFamily: 'Outfit' }}>₹{job.salaryMin}-{job.salaryMax} LPA</Text>
               </View>
               <View className="flex-1 bg-white p-8 rounded-[32px] border border-slate-200/60 shadow-sm">
                  <Text className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-3">Target Experience</Text>
                  <Text className="text-3xl font-bold text-slate-900" style={{ fontFamily: 'Outfit' }}>{job.experienceMin}+ Product Years</Text>
               </View>
            </View>

            <View className="mt-20 border-t border-slate-200/60 pt-20">
              <View className="flex-row items-center mb-10">
                 <View className="w-11 h-11 bg-indigo-600 rounded-2xl items-center justify-center mr-5 shadow-lg shadow-indigo-200">
                    <SymbolView name="doc.text.fill" size={18} tintColor="white" />
                 </View>
                 <Text className="text-2xl font-bold text-slate-900 tracking-tight" style={{ fontFamily: 'Outfit' }}>The Opportunity</Text>
              </View>
              <Text className="text-xl text-slate-600 leading-relaxed font-normal">
                {job.description}
              </Text>
            </View>

            <View className="mt-20">
              <View className="flex-row items-center mb-10">
                 <View className="w-11 h-11 bg-indigo-600 rounded-2xl items-center justify-center mr-5 shadow-lg shadow-indigo-200">
                    <SymbolView name="star.fill" size={18} tintColor="white" />
                 </View>
                 <Text className="text-2xl font-bold text-slate-900 tracking-tight" style={{ fontFamily: 'Outfit' }}>Required Stack</Text>
              </View>
              <View className="flex-row flex-wrap gap-4">
                {job.skills?.map((skill, idx) => (
                  <View key={idx} className="bg-white px-8 py-4 rounded-2xl border border-slate-200/60 shadow-sm">
                    <Text className="text-[15px] text-slate-800 font-bold">{skill}</Text>
                  </View>
                ))}
              </View>
            </View>

            {/* AI Insight Card - Softer Design */}
            <View className="mt-24 mb-20 bg-indigo-950 p-12 rounded-[48px] shadow-2xl shadow-indigo-200">
               <View className="flex-row items-center mb-8">
                 <View className="bg-indigo-400 w-3 h-3 rounded-full mr-4 shadow-sm" />
                 <Text className="text-indigo-300 font-bold uppercase text-[12px] tracking-[0.2em]">Agent Strategic Analysis</Text>
               </View>
               <Text className="text-white text-3xl font-bold leading-snug tracking-tight" style={{ fontFamily: 'Inter' }}>
                 This role at {job.company} represents a logical progression for your career trajectory.
                 The {job.title} position leverages your full technical arsenal with high efficiency.
               </Text>
            </View>
          </View>
        </ScrollView>
      </View>

      {/* Floating Apply Bar - Centered Content */}
      <View className="absolute bottom-0 left-0 right-0 p-10 bg-white/80 border-t border-slate-200/60 z-30" style={Platform.OS === 'web' ? { backdropFilter: 'blur(32px)' } as any : {}}>
         <View className="max-w-5xl mx-auto w-full">
           <TouchableOpacity
             onPress={handleApply}
             className="bg-indigo-600 py-8 rounded-[32px] items-center shadow-2xl shadow-indigo-300 active:scale-[0.98] transition-all"
           >
              <Text className="text-white font-black text-2xl tracking-[0.1em] uppercase">Proceed to Application</Text>
           </TouchableOpacity>
         </View>
      </View>
    </View>
  );
}
