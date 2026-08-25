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
      className={`bg-white rounded-[24px] p-4 border ${selected ? 'border-indigo-500 ring-4 ring-indigo-50' : 'border-slate-200/60'} shadow-sm h-[260px] flex-col justify-between`}
    >
      <View>
        <View className="flex-row">
          <TouchableOpacity
            onPress={(e) => {
              e.stopPropagation();
              onToggle?.(job.id);
            }}
            className={`w-6 h-6 rounded-lg border-2 mr-3 mt-1 items-center justify-center ${selected ? 'bg-indigo-600 border-indigo-600' : 'border-slate-200'}`}
          >
            {selected && <SymbolView name="checkmark" size={12} tintColor="white" />}
          </TouchableOpacity>

          <View className="flex-1">
            <Text className="text-lg font-bold text-slate-900 tracking-tight leading-snug" style={{ fontFamily: 'Outfit' }} numberOfLines={1}>{job.title}</Text>
            <Text className="text-[13px] font-semibold text-slate-400 mt-0.5" numberOfLines={1}>{job.company}</Text>

            <View className="flex-row items-center mt-2.5 gap-2">
              <View className="bg-indigo-50 px-2 py-0.5 rounded-lg border border-indigo-100">
                <Text className="text-indigo-600 text-[10px] font-bold tracking-tight">{matchScore}% MATCH</Text>
              </View>
              <View className="bg-slate-100 px-2 py-0.5 rounded-lg border border-slate-200">
                <Text className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">{job.workMode}</Text>
              </View>
            </View>

            <View className="flex-row flex-wrap items-center mt-3 gap-2">
              <View className="flex-row items-center bg-slate-50 px-2 py-1 rounded-xl">
                <SymbolView name="mappin.and.ellipse" size={10} tintColor="#64748b" />
                <Text className="text-[11px] font-semibold text-slate-600 ml-1.5">{job.location}</Text>
              </View>
              <View className="flex-row items-center bg-slate-50 px-2 py-1 rounded-xl">
                <SymbolView name="indianrupeesign.circle.fill" size={10} tintColor="#64748b" />
                <Text className="text-[11px] font-semibold text-slate-600 ml-1.5">₹{job.salaryMin}-{job.salaryMax} LPA</Text>
              </View>
            </View>
          </View>
        </View>
      </View>

      <View className="mt-3 border-t border-slate-50 pt-3 flex-row items-center justify-between">
        <TouchableOpacity onPress={toggleExpand} className="flex-row items-center">
          <Text className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mr-1.5">
            {expanded ? 'Hide Analysis' : 'Quick Preview'}
          </Text>
          <SymbolView
            name={expanded ? 'chevron.up' : 'chevron.down'}
            size={10}
            tintColor="#64748b"
          />
        </TouchableOpacity>

        <View className="bg-slate-900 px-3 py-1.5 rounded-lg">
          <Text className="text-white text-[10px] font-bold uppercase tracking-widest">Details</Text>
        </View>
      </View>

      {expanded && (
        <View className="mt-6 animate-in fade-in slide-in-from-top-2">
          <Text className="text-[15px] text-slate-500 leading-relaxed font-medium mb-6" numberOfLines={3}>{job.description}</Text>
          <View className="flex-row flex-wrap gap-2.5">
            {job.skills?.slice(0, 4).map((skill, idx) => (
              <View key={idx} className="bg-slate-100 px-3 py-1.5 rounded-lg">
                <Text className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">{skill}</Text>
              </View>
            ))}
          </View>
        </View>
      )}
    </TouchableOpacity>
  );
};
