import React, { useState } from 'react';
import { View, Text, TouchableOpacity, LayoutAnimation, Platform, UIManager } from 'react-native';
import { Job } from '@applyai/shared-types';
import { SymbolView } from 'expo-symbols';
import { useRouter } from 'expo-router';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface JobCardProps {
  job: Job;
  selected?: boolean;
  onToggle?: (id: string) => void;
  matchScore?: number;
}

export const JobCard: React.FC<JobCardProps> = ({ job, selected, onToggle, matchScore = 85 }) => {
  const router = useRouter();
  const [expanded, setExpanded] = useState(false);

  const toggleExpand = (e: any) => {
    e.stopPropagation();
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpanded(!expanded);
  };

  const handleNavigate = () => {
    router.push(`/job/${job.id}`);
  };

  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={handleNavigate}
      className={`bg-white rounded-[28px] p-6 mb-4 border ${selected ? 'border-slate-900 ring-2 ring-slate-100' : 'border-slate-100'} shadow-sm shadow-slate-200/50`}
    >
      <View className="flex-row">
        <TouchableOpacity
          onPress={(e) => {
            e.stopPropagation();
            onToggle?.(job.id);
          }}
          className={`w-6 h-6 rounded-lg border-2 mr-4 mt-1 items-center justify-center ${selected ? 'bg-slate-900 border-slate-900' : 'border-slate-200'}`}
        >
          {selected && <SymbolView name="checkmark" size={12} tintColor="white" />}
        </TouchableOpacity>

        <View className="flex-1">
          <View className="flex-row justify-between items-start">
            <View className="flex-1 pr-3">
              <Text className="text-2xl font-black text-slate-900 tracking-tight leading-tight">{job.title}</Text>
              <View className="flex-row items-center mt-2">
                <Text className="text-[16px] font-bold text-slate-500">{job.company}</Text>
                <View className="mx-2 w-1.5 h-1.5 rounded-full bg-slate-300" />
                <Text className="text-[12px] font-black text-slate-400 uppercase tracking-widest">{job.workMode}</Text>
              </View>
            </View>
            <View className="bg-emerald-50 px-2.5 py-1.5 rounded-lg border border-emerald-100">
              <Text className="text-emerald-700 text-[10px] font-black tracking-tighter">{matchScore}% MATCH</Text>
            </View>
          </View>

          <View className="flex-row flex-wrap items-center mt-5 gap-2">
            <View className="flex-row items-center bg-slate-50 px-3 py-2 rounded-xl">
              <SymbolView name="mappin.and.ellipse" size={10} tintColor="#64748b" />
              <Text className="text-[11px] font-bold text-slate-600 ml-2">{job.location}</Text>
            </View>
            <View className="flex-row items-center bg-slate-50 px-3 py-2 rounded-xl">
              <SymbolView name="indianrupeesign.circle.fill" size={10} tintColor="#64748b" />
              <Text className="text-[11px] font-bold text-slate-600 ml-2">₹{job.salaryMin}-{job.salaryMax} LPA</Text>
            </View>
          </View>

          <View className="mt-5 border-t border-slate-50 pt-5 flex-row items-center justify-between">
            <TouchableOpacity onPress={toggleExpand} className="flex-row items-center">
              <Text className="text-slate-900 text-[11px] font-black uppercase tracking-widest mr-2">
                {expanded ? 'Hide Meta' : 'Quick View'}
              </Text>
              <SymbolView
                name={expanded ? 'chevron.up' : 'chevron.down'}
                size={12}
                tintColor="#0f172a"
              />
            </TouchableOpacity>

            <View className="bg-slate-900 px-4 py-2 rounded-full">
              <Text className="text-white text-[10px] font-black uppercase tracking-widest">View Detail</Text>
            </View>
          </View>

          {expanded && (
            <View className="mt-4 animate-in fade-in slide-in-from-top-2">
              <Text className="text-[13px] text-slate-500 leading-relaxed font-medium mb-5" numberOfLines={3}>{job.description}</Text>
              <View className="flex-row flex-wrap gap-2">
                {job.skills?.slice(0, 4).map((skill, idx) => (
                  <View key={idx} className="bg-slate-100 px-2.5 py-1 rounded-md">
                    <Text className="text-[9px] text-slate-500 font-bold uppercase">{skill}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};
