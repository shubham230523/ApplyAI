import React from 'react';
import { View, Text, ScrollView, ActivityIndicator, TouchableOpacity, Platform } from 'react-native';
import { Job } from '@applyai/shared-types';
import { JobCard } from './job-card';
import { SymbolView } from 'expo-symbols';

interface JobFeedProps {
  jobs: Job[];
  loading: boolean;
  selectedJobIds: Set<string>;
  onToggleJob: (id: string) => void;
}

export const JobFeed: React.FC<JobFeedProps> = ({ jobs, loading, selectedJobIds, onToggleJob }) => {
  return (
    <View
      className="flex-1 bg-slate-50/20 mesh-gradient h-full overflow-hidden"
      style={Platform.OS === 'web' ? { height: '100%' } : { flex: 1 }}
    >
      <View className="px-10 py-10 border-b border-slate-100/50 glass z-10 flex-row items-center justify-between">
        <View>
          <Text className="text-3xl font-black text-slate-900 tracking-tighter" style={{ fontFamily: 'Geist' }}>Discovery Feed</Text>
          <Text className="text-[13px] font-black text-slate-400 uppercase tracking-[0.2em] mt-2">
            {jobs.length} Priority Nodes Found
          </Text>
        </View>
        <View className="flex-row gap-4">
           <TouchableOpacity className="bg-slate-900 px-8 py-4 rounded-2xl shadow-2xl shadow-slate-300 active:scale-95 transition-all">
             <Text className="text-[12px] font-black text-white uppercase tracking-widest">Sort: Logic Match</Text>
           </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 48, paddingBottom: 200 }}
        showsVerticalScrollIndicator={true}
      >
        {loading && jobs.length === 0 ? (
          <View className="flex-1 justify-center items-center py-40">
            <ActivityIndicator color="#0f172a" size="large" />
            <Text className="text-slate-400 mt-8 font-black uppercase tracking-[0.3em] text-[14px]">Agent Scouting Neural Mesh...</Text>
          </View>
        ) : jobs.length > 0 ? (
          <View className="flex-row flex-wrap -mx-4">
            {jobs.map((job) => (
              <View key={job.id} className="w-full lg:w-1/2 p-4">
                <JobCard
                  job={job}
                  selected={selectedJobIds.has(job.id)}
                  onToggle={onToggleJob}
                />
              </View>
            ))}
          </View>
        ) : (
          <View className="flex-1 justify-center items-center py-48 bg-white/40 rounded-[64px] border border-dashed border-slate-200">
            <View className="bg-slate-100 p-12 rounded-full mb-10 shadow-inner">
              <SymbolView name="sparkles" size={80} tintColor="#cbd5e1" />
            </View>
            <Text className="text-slate-900 font-black text-2xl tracking-tighter">Hub Initialized</Text>
            <Text className="text-slate-500 mt-4 text-center max-w-[400px] font-medium text-lg leading-relaxed">
              Task your agent on the left to start populating your personalized discovery stream.
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
};
