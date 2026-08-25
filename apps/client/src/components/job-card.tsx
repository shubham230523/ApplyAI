import React, { useState } from 'react';
import { View, Text, TouchableOpacity, LayoutAnimation, Platform, UIManager } from 'react-native';
import { Job } from '@applyai/shared-types';
import { SymbolView } from 'expo-symbols';
import { useRouter } from 'expo-router';
import { Image } from 'expo-image';

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
      className={`bg-white rounded-[20px] p-4 border ${selected ? 'border-indigo-500 ring-2 ring-indigo-50' : 'border-slate-200/60'} shadow-sm h-[220px] flex-col justify-between`}
    >
      <View>
        <View className="flex-row">
          <View className="mr-3 mt-1 items-center">
            <TouchableOpacity
              onPress={(e) => {
                e.stopPropagation();
                onToggle?.(job.id);
              }}
              className={`w-6 h-6 rounded-lg border-2 mb-3 items-center justify-center ${selected ? 'bg-indigo-600 border-indigo-600' : 'border-slate-200'}`}
            >
              {selected && <SymbolView name="checkmark" size={12} tintColor="white" />}
            </TouchableOpacity>

            <Image
              source={{ uri: job.companyLogo }}
              style={{ width: 32, height: 32, borderRadius: 8 }}
              contentFit="contain"
              placeholder={{ uri: `https://api.dicebear.com/7.x/initials/svg?seed=${job.company}` }}
            />
          </View>

          <View className="flex-1">
            {/* Lines 1-2: Job Title */}
            <Text className="text-[14px] font-bold text-slate-900 tracking-tight leading-snug" style={{ fontFamily: 'Outfit' }} numberOfLines={2}>{job.title}</Text>

            {/* Line 3: Company Name */}
            <Text className="text-[12px] font-semibold text-slate-400 mt-1" numberOfLines={1}>{job.company}</Text>

            {/* Line 4: Match Score & Work Mode */}
            <View className="flex-row items-center mt-2 gap-1.5">
              <View className="bg-indigo-50 px-1.5 py-0.5 rounded-md border border-indigo-100">
                <Text className="text-indigo-600 text-[9px] font-bold tracking-tight">{matchScore}% MATCH</Text>
              </View>
              <View className="bg-slate-100 px-1.5 py-0.5 rounded-md border border-slate-200">
                <Text className="text-slate-500 text-[9px] font-bold uppercase tracking-widest">{job.workMode}</Text>
              </View>
            </View>

            {/* Line 5: Source */}
            <View className="flex-row items-center mt-1.5">
              <View className="bg-emerald-50 px-1.5 py-0.5 rounded-md border border-emerald-100">
                <Text className="text-emerald-700 text-[8px] font-black uppercase">via {job.source}</Text>
              </View>
            </View>

            {/* Line 6: Location & Salary */}
            <View className="flex-row flex-wrap items-center mt-2 gap-1.5">
              <View className="flex-row items-center bg-slate-50 px-2 py-0.5 rounded-lg">
                <SymbolView name="mappin.and.ellipse" size={9} tintColor="#64748b" />
                <Text className="text-[9px] font-semibold text-slate-600 ml-1" numberOfLines={1}>{job.location}</Text>
              </View>
              <View className="flex-row items-center bg-slate-50 px-2 py-0.5 rounded-lg">
                <SymbolView name="indianrupeesign.circle.fill" size={9} tintColor="#64748b" />
                <Text className="text-[9px] font-semibold text-slate-600 ml-1">
                  {job.salaryMin && job.salaryMax ? `₹${job.salaryMin}-${job.salaryMax} LPA` : 'Not Disclosed'}
                </Text>
              </View>
            </View>
          </View>
        </View>
      </View>

      <View className="mt-4 border-t border-slate-50 pt-3">
        <View className="bg-slate-900 w-full py-2.5 rounded-xl items-center shadow-sm">
          <Text className="text-white text-[10px] font-bold uppercase tracking-widest">View Details</Text>
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
