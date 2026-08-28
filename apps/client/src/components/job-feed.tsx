import React from 'react';
import { View, Text, ScrollView, ActivityIndicator, TouchableOpacity, Platform } from 'react-native';
import { Job } from '@applyai/shared-types';
import { JobCard } from './job-card';
import { Icon } from '@/components/ui/Icon';

interface JobFeedProps {
  jobs: Job[];
  loading: boolean;
  selectedJobIds: Set<string>;
  onToggleJob: (id: string) => void;
  appliedJobIds?: Set<string>;
}

export const JobFeed: React.FC<JobFeedProps> = ({ jobs, loading, selectedJobIds, onToggleJob, appliedJobIds = new Set() }) => {
  return (

    <View
      className="flex-1 bg-slate-50/20 mesh-gradient h-full overflow-hidden"
      style={Platform.OS === 'web' ? { height: '100%' } : { flex: 1 }}
    >
      <View className="px-6 py-5 border-b border-slate-200/40 glass z-10 flex-row items-center justify-between">
        <View>
          <Text className="text-xl font-bold text-slate-900 tracking-tighter" style={{ fontFamily: 'Outfit' }}>Discovery Feed</Text>
          <Text className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
            {jobs.length} Priority Nodes Found
          </Text>
        </View>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 24, paddingBottom: 150 }}
        showsVerticalScrollIndicator={true}
      >
        {loading && jobs.length === 0 ? (
          <View className="flex-1 justify-center items-center py-32">
            <ActivityIndicator color="#0f172a" size="large" />
            <Text className="text-slate-400 mt-6 font-bold uppercase tracking-[0.2em] text-[12px]">Agent Scouting Neural Mesh...</Text>
          </View>
        ) : jobs.length > 0 ? (
          <View className="flex-row flex-wrap -mx-3">
            {jobs.map((job) => (
              <View key={job.id} className="w-full lg:w-1/2 p-3">
                <JobCard
                  job={job}
                  selected={selectedJobIds.has(job.id)}
                  onToggle={onToggleJob}
                  applied={appliedJobIds.has(job.id)}
                />
              </View>
            ))}
          </View>
        ) : (
          <View className="flex-1 justify-center items-center py-32 bg-white/40 rounded-[48px] border border-dashed border-slate-200">
            <View className="bg-slate-100 p-8 rounded-full mb-8 shadow-inner">
              <Icon name="sparkles" size={56} color="#cbd5e1" />
            </View>
            <Text className="text-slate-900 font-bold text-xl tracking-tighter">Hub Initialized</Text>
            <Text className="text-slate-500 mt-3 text-center max-w-[320px] font-medium text-lg leading-relaxed">
              Task your agent on the left to start populating your discovery stream.
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
};
