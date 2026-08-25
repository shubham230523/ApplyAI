import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, SafeAreaView, Platform } from 'react-native';
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
      try {
        const response = await fetch(`http://localhost:4000/api/jobs/${id}`);
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

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-white">
        <ActivityIndicator color="#0f172a" />
      </View>
    );
  }

  if (!job) {
    return (
      <View className="flex-1 justify-center items-center bg-white">
        <Text className="text-slate-400 font-bold">Opportunity not found.</Text>
        <TouchableOpacity onPress={() => router.back()} className="mt-4">
          <Text className="text-blue-600 font-bold font-[Geist]">Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-white h-screen overflow-hidden" style={Platform.OS === 'web' ? { height: '100vh' } : { flex: 1 }}>
      {/* Sticky Header */}
      <View className="px-8 py-8 border-b border-slate-100/50 glass z-20 flex-row items-center justify-between bg-white/95">
        <TouchableOpacity
          onPress={() => router.back()}
          className="w-12 h-12 rounded-full bg-slate-50 items-center justify-center border border-slate-100 shadow-sm active:bg-slate-100"
        >
          <SymbolView name="chevron.left" size={18} tintColor="#0f172a" />
        </TouchableOpacity>
        <View className="items-center flex-1 mx-4">
          <Text className="text-[12px] font-black text-slate-400 uppercase tracking-[0.2em]">Opportunity Node</Text>
          <Text className="text-2xl font-black text-slate-900 tracking-tight font-[Geist]" numberOfLines={1}>{job.company}</Text>
        </View>
        <TouchableOpacity className="w-12 h-12 rounded-full bg-slate-50 items-center justify-center border border-slate-100 shadow-sm">
          <SymbolView name="square.and.arrow.up" size={18} tintColor="#0f172a" />
        </TouchableOpacity>
      </View>

      <View className="flex-1">
        <ScrollView
          className="flex-1 h-full"
          contentContainerStyle={{ paddingBottom: 200 }}
          showsVerticalScrollIndicator={true}
        >
          {/* Hero Section */}
          <View className="px-10 pt-16 pb-20 bg-slate-50/50 mesh-gradient">
            <View className="bg-emerald-100/50 self-start px-4 py-2 rounded-xl border border-emerald-200 mb-10 shadow-sm shadow-emerald-100">
              <Text className="text-emerald-800 text-[11px] font-black tracking-widest uppercase">98% High Match</Text>
            </View>

            <Text className="text-6xl font-black text-slate-900 leading-[1.05] tracking-tighter max-w-4xl font-[Geist]">
              {job.title}
            </Text>

            <View className="flex-row items-center mt-12">
              <View className="w-20 h-20 bg-white rounded-[32px] items-center justify-center shadow-2xl shadow-slate-300 border border-white">
                 <SymbolView name="building.2.fill" size={36} tintColor="#0f172a" />
              </View>
              <View className="ml-8">
                <Text className="text-3xl font-black text-slate-900 tracking-tighter font-[Geist]">{job.company}</Text>
                <View className="flex-row items-center mt-2">
                  <SymbolView name="mappin.and.ellipse" size={12} tintColor="#64748b" />
                  <Text className="text-slate-500 font-bold uppercase text-[12px] tracking-widest ml-2">
                    {job.location} • {(job.workMode || 'remote').toUpperCase()}
                  </Text>
                </View>
              </View>
            </View>

            <View className="flex-row mt-16 gap-6">
               <View className="flex-1 bg-white p-8 rounded-[40px] border border-white shadow-xl shadow-slate-200/50">
                  <Text className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-3">Annual Compensation</Text>
                  <Text className="text-3xl font-black text-slate-900 font-[Geist]">₹{job.salaryMin}-{job.salaryMax} LPA</Text>
               </View>
               <View className="flex-1 bg-white p-8 rounded-[40px] border border-white shadow-xl shadow-slate-200/50">
                  <Text className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-3">Target Experience</Text>
                  <Text className="text-3xl font-black text-slate-900 font-[Geist]">{job.experienceMin}+ Product Years</Text>
               </View>
            </View>
          </View>

          {/* Content Section */}
          <View className="px-10 pt-20">
            <View className="mb-16">
              <View className="flex-row items-center mb-8">
                 <View className="w-10 h-10 bg-slate-900 rounded-2xl items-center justify-center mr-4">
                    <SymbolView name="doc.text.fill" size={16} tintColor="white" />
                 </View>
                 <Text className="text-xl font-black text-slate-900 tracking-tight font-[Geist]">Role Analysis</Text>
              </View>
              <Text className="text-2xl text-slate-600 leading-[1.6] font-medium tracking-tight">
                {job.description}
              </Text>
            </View>

            <View className="mb-16">
              <View className="flex-row items-center mb-8">
                 <View className="w-10 h-10 bg-slate-900 rounded-2xl items-center justify-center mr-4">
                    <SymbolView name="star.fill" size={16} tintColor="white" />
                 </View>
                 <Text className="text-xl font-black text-slate-900 tracking-tight font-[Geist]">Technical Stack</Text>
              </View>
              <View className="flex-row flex-wrap gap-4">
                {job.skills?.map((skill, idx) => (
                  <View key={idx} className="bg-slate-50 px-8 py-5 rounded-[24px] border border-slate-100">
                    <Text className="text-lg text-slate-900 font-black tracking-tight">{skill}</Text>
                  </View>
                ))}
              </View>
            </View>

            {/* AI Insight Card */}
            <View className="bg-slate-900 p-12 rounded-[56px] shadow-2xl shadow-slate-400">
               <View className="flex-row items-center mb-8">
                 <View className="bg-emerald-500 w-3 h-3 rounded-full mr-4 shadow-sm shadow-emerald-500" />
                 <Text className="text-emerald-400 font-black uppercase text-sm tracking-[0.2em]">Agent Strategic Brief</Text>
               </View>
               <Text className="text-white text-3xl font-black leading-snug tracking-tighter font-[Geist]">
                 This opportunity at {job.company} represents a logical progression for your career trajectory.
                 The {job.title} role leverages your full technical arsenal.
               </Text>
            </View>
          </View>
        </ScrollView>
      </View>

      {/* Floating Apply Bar */}
      <View className="absolute bottom-0 left-0 right-0 p-10 bg-white/80 border-t border-slate-100 z-30 shadow-2xl" style={Platform.OS === 'web' ? { backdropFilter: 'blur(32px)' } as any : {}}>
         <TouchableOpacity
           className="bg-slate-900 py-8 rounded-[36px] items-center shadow-2xl shadow-slate-900 active:scale-[0.98]"
         >
            <Text className="text-white font-black text-2xl tracking-[0.1em] uppercase">Apply to {job.company}</Text>
         </TouchableOpacity>
      </View>
    </View>
  );
}
