import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Platform, Linking } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Icon } from '@/components/ui/icon';
import { Job } from '@applyai/shared-types';
import { Image } from 'expo-image';
import { ResumeUploadModal } from '@/components/resume-upload-modal';

export default function JobDetailsScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [showForceUpload, setShowForceUpload] = useState(false);

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

  const formatSalary = (min: number | string | undefined, max: number | string | undefined) => {
    if (!min && !max) return 'Not Disclosed';
    const convert = (val: number | string) => {
      const numericVal = typeof val === 'string' ? parseFloat(val) : val;
      if (numericVal > 100000) return (numericVal / 100000).toFixed(1);
      if (numericVal > 1000) return (numericVal / 1000).toFixed(1);
      return numericVal;
    };
    const minLPA = min ? convert(min) : '';
    const maxLPA = max ? convert(max) : '';
    if (min && max) return `₹${minLPA}-${maxLPA} LPA`;
    return min ? `₹${minLPA} LPA+` : `Up to ₹${maxLPA} LPA`;
  };

  const formatExperience = (level: string | undefined) => {
    const l = level?.toUpperCase();
    if (l === 'ENTRY_LEVEL' || l === 'INTERNSHIP') return '1-2 Years';
    if (l === 'MID_LEVEL') return '3-6 Years';
    if (l === 'SENIOR_LEVEL') return '6+ Years';
    if (l === 'DIRECTOR' || l === 'EXECUTIVE') return '10+ Years';
    return 'Not Specified';
  };

  const handleApply = async () => {
    const apiUrl = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:4000';

    try {
      // 1. Check if profile exists and is complete before applying
      const response = await fetch(`${apiUrl}/api/profile`);
      if (!response.ok) {
        setShowForceUpload(true);
        return;
      }

      const profile = await response.json();

      // Check if profile is substantially complete
      if (!profile || !profile.name || !profile.email) {
        setShowForceUpload(true);
        return;
      }

      // 2. If profile exists and is complete, proceed to application URL
      if (job?.applyUrl) {
        console.log('Direct apply to:', job.applyUrl);
        Linking.openURL(job.applyUrl);
      } else {
        alert('Application URL not found for this job.');
      }
    } catch (e) {
      console.error('Apply error:', e);
      // If profile check fails, better safe than sorry: show upload
      setShowForceUpload(true);
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
          <Text className="text-indigo-600 font-bold">Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const postedDate = job.postedAt ? new Date(job.postedAt).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  }) : 'Recently';

  return (
    <View className="flex-1 bg-[#fafaf9]" style={Platform.OS === 'web' ? { height: '100vh' } : {}}>
      {/* Sticky Header */}
      <View className="px-5 py-4 border-b border-slate-200/60 flex-row items-center justify-between bg-white/80">
        <TouchableOpacity
          onPress={() => router.back()}
          className="w-10 h-10 rounded-xl bg-slate-50 items-center justify-center border border-slate-200/60"
        >
          <Icon name="chevron.left" size={16} color="#1e293b" />
        </TouchableOpacity>

        <View className="items-center flex-1 mx-4">
          <Text className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Role Analysis</Text>
          <Text className="text-base font-bold text-slate-900" numberOfLines={1}>{job.companyName}</Text>
        </View>

        <TouchableOpacity className="w-10 h-10 rounded-xl bg-slate-50 items-center justify-center border border-slate-200/60">
          <Icon name="square.and.arrow.up" size={16} color="#1e293b" />
        </TouchableOpacity>
      </View>

      <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 120 }}>
        <View className="w-full max-w-4xl mx-auto px-6 pt-10">
          <View className="bg-indigo-50 self-start px-3 py-1 rounded-lg border border-indigo-100 mb-6">
            <Text className="text-indigo-700 text-[9px] font-bold tracking-widest uppercase">Strategic Match</Text>
          </View>

          <Text className="text-2xl font-bold text-slate-900 leading-tight mb-6">
            {job.title}
          </Text>

          <View className="flex-row items-center mb-8">
            <View className="w-12 h-12 bg-white rounded-2xl items-center justify-center shadow-sm border border-slate-200/60 overflow-hidden">
              <Image
                source={{ uri: job.companyLogoUrl }}
                style={{ width: '100%', height: '100%' }}
                contentFit="contain"
                placeholder={{ uri: `https://api.dicebear.com/7.x/initials/svg?seed=${job.companyName}` }}
              />
            </View>
            <View className="ml-4 flex-1">
              <View className="flex-row items-center justify-between">
                <Text className="text-lg font-bold text-slate-900">{job.companyName}</Text>
                <View className="bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-100">
                  <Text className="text-emerald-700 text-[10px] font-black uppercase">via {job.source}</Text>
                </View>
              </View>
              <View className="flex-row items-center mt-1">
                <Icon name="mappin.and.ellipse" size={11} color="#64748b" />
                <Text className="text-slate-500 font-semibold text-[12px] ml-1.5">
                  {job.location} • {(job.workplaceType || 'REMOTE').toUpperCase()}
                </Text>
              </View>
            </View>
          </View>

          {/* Key Metrics */}
          <View className="flex-row gap-4 mb-4">
            <View className="flex-1 bg-white p-6 rounded-2xl border border-slate-200/60 shadow-sm">
              <Text className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Compensation</Text>
              <Text className="text-xl font-bold text-slate-900">{formatSalary(job.salaryMin, job.salaryMax)}</Text>
            </View>
            <View className="flex-1 bg-white p-6 rounded-2xl border border-slate-200/60 shadow-sm">
              <Text className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Target Experience</Text>
              <Text className="text-xl font-bold text-slate-900">{formatExperience(job.experienceLevel)}</Text>
            </View>
          </View>

          <View className="flex-row gap-4 mb-10">
            <View className="flex-1 bg-white p-6 rounded-2xl border border-slate-200/60 shadow-sm">
              <Text className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Employment</Text>
              <Text className="text-base font-bold text-slate-900">{job.employmentType?.replace('_', ' ') || 'FULL TIME'}</Text>
            </View>
            <View className="flex-1 bg-white p-6 rounded-2xl border border-slate-200/60 shadow-sm">
              <Text className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Posted At</Text>
              <Text className="text-base font-bold text-slate-900">{postedDate}</Text>
            </View>
          </View>

          {/* Description */}
          <View className="mt-4 border-t border-slate-200/60 pt-10 mb-10">
            <View className="flex-row items-center mb-6">
              <View className="w-10 h-10 bg-indigo-50 rounded-xl items-center justify-center mr-3 border border-indigo-100/50">
                <Icon name="briefcase.fill" size={16} color="#6366f1" />
              </View>
              <Text className="text-lg font-bold text-slate-900">The Opportunity</Text>
            </View>
            <Text className="text-base text-slate-600 leading-relaxed">{job.description}</Text>
          </View>

          {/* Technical Details */}
          <View className="mb-10">
            <View className="flex-row items-center mb-6">
              <View className="w-10 h-10 bg-indigo-50 rounded-xl items-center justify-center mr-3 border border-indigo-100/50">
                <Icon name="cpu.fill" size={16} color="#6366f1" />
              </View>
              <Text className="text-lg font-bold text-slate-900">Technical Details</Text>
            </View>
            <View className="bg-white p-6 rounded-2xl border border-slate-200/60 shadow-sm">
              {[
                { label: 'Workplace', value: job.workplaceType || 'REMOTE' },
                { label: 'Salary Period', value: job.salaryPeriod || 'YEARLY' },
                { label: 'Currency', value: job.salaryCurrency || 'INR' },
                { label: 'Location', value: job.location },
              ].map((item, index) => (
                <View key={index} className={`flex-row justify-between py-4 ${index !== 3 ? 'border-b border-slate-50' : ''}`}>
                  <Text className="text-slate-400 font-bold text-[11px] uppercase tracking-wider">{item.label}</Text>
                  <Text className="text-slate-900 font-bold text-[13px]">{item.value}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* External Resources */}
          <View className="mb-12">
            <View className="flex-row items-center mb-6">
              <View className="w-10 h-10 bg-indigo-50 rounded-xl items-center justify-center mr-3 border border-indigo-100/50">
                <Icon name="link" size={16} color="#6366f1" />
              </View>
              <Text className="text-lg font-bold text-slate-900">External Resources</Text>
            </View>
            <View className="flex-row gap-4">
              <TouchableOpacity
                onPress={() => job.companyWebsite && Linking.openURL(job.companyWebsite)}
                className="flex-1 bg-white p-5 rounded-2xl border border-slate-200/60 items-center shadow-sm"
              >
                <Text className="text-indigo-600 font-bold text-[12px] uppercase">Company Website</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => job.applyUrl && Linking.openURL(job.applyUrl)}
                className="flex-1 bg-white p-5 rounded-2xl border border-slate-200/60 items-center shadow-sm"
              >
                <Text className="text-indigo-600 font-bold text-[12px] uppercase">Apply Link</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* AI Insight */}
          <View className="bg-indigo-950 p-10 rounded-[32px] shadow-xl">
            <View className="flex-row items-center mb-6">
              <View className="bg-indigo-400 w-2.5 h-2.5 rounded-full mr-3" />
              <Text className="text-indigo-300 font-bold uppercase text-[10px] tracking-widest">Agent Strategic Analysis</Text>
            </View>
            <Text className="text-white text-xl font-bold leading-snug">
              This role at {job.companyName} represents a logical progression for your career trajectory.
              The {job.title} position leverages your full technical arsenal with high efficiency.
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Floating Apply Bar */}
      <View className="absolute bottom-0 left-0 right-0 p-5 bg-white/80 border-t border-slate-200/60">
        <View className="max-w-4xl mx-auto w-full items-center">
          <TouchableOpacity
            onPress={handleApply}
            className="bg-indigo-600 px-10 py-3.5 rounded-xl items-center shadow-xl active:scale-[0.98]"
          >
            <Text className="text-white font-bold text-base uppercase tracking-widest">Apply Now</Text>
          </TouchableOpacity>
        </View>
      </View>
      <ResumeUploadModal
        visible={showForceUpload}
        onClose={() => setShowForceUpload(false)}
        forceMode={true}
      />
    </View>
  );
}
