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
      className={`bg-white rounded-[32px] p-8 border ${selected ? 'border-indigo-500 ring-4 ring-indigo-50' : 'border-slate-200/60'} shadow-sm h-[400px] flex-col justify-between`}
    >
      <View>
        <View className="flex-row">
          <TouchableOpacity
            onPress={(e) => {
              e.stopPropagation();
              onToggle?.(job.id);
            }}
            className={`w-7 h-7 rounded-xl border-2 mr-4 mt-1 items-center justify-center ${selected ? 'bg-indigo-600 border-indigo-600' : 'border-slate-200'}`}
          >
            {selected && <SymbolView name="checkmark" size={14} tintColor="white" />}
          </TouchableOpacity>

          <View className="flex-1">
            <View className="flex-row justify-between items-start">
              <View className="flex-1 pr-3">
                <Text className="text-2xl font-bold text-slate-900 tracking-tight leading-tight" style={{ fontFamily: 'Outfit' }}>{job.title}</Text>
                <View className="flex-row items-center mt-2.5">
                  <Text className="text-[15px] font-semibold text-slate-500">{job.company}</Text>
                  <View className="mx-2.5 w-1 h-1 rounded-full bg-slate-300" />
                  <Text className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">{job.workMode}</Text>
                </View>
              </View>
              <View className="bg-indigo-50 px-3 py-1.5 rounded-xl border border-indigo-100">
                <Text className="text-indigo-600 text-[11px] font-bold tracking-tight">{matchScore}% MATCH</Text>
              </View>
            </View>

            <View className="flex-row flex-wrap items-center mt-6 gap-3">
              <View className="flex-row items-center bg-slate-50 px-3.5 py-2 rounded-xl">
                <SymbolView name="mappin.and.ellipse" size={12} tintColor="#64748b" />
                <Text className="text-[13px] font-semibold text-slate-600 ml-2">{job.location}</Text>
              </View>
              <View className="flex-row items-center bg-slate-50 px-3.5 py-2 rounded-xl">
                <SymbolView name="indianrupeesign.circle.fill" size={12} tintColor="#64748b" />
                <Text className="text-[13px] font-semibold text-slate-600 ml-2">₹{job.salaryMin}-{job.salaryMax} LPA</Text>
              </View>
            </View>
          </View>
        </View>
      </View>

      <View className="mt-8 border-t border-slate-50 pt-6 flex-row items-center justify-between">
        <TouchableOpacity onPress={toggleExpand} className="flex-row items-center">
          <Text className="text-slate-500 text-[12px] font-bold uppercase tracking-widest mr-2">
            {expanded ? 'Hide Analysis' : 'Quick Preview'}
          </Text>
          <SymbolView
            name={expanded ? 'chevron.up' : 'chevron.down'}
            size={14}
            tintColor="#64748b"
          />
        </TouchableOpacity>

        <View className="bg-slate-900 px-6 py-2.5 rounded-2xl">
          <Text className="text-white text-[12px] font-bold uppercase tracking-widest">Details</Text>
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
