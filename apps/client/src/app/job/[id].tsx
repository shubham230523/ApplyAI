import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Platform, Linking, Alert, useWindowDimensions, TextInput } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Icon } from '@/components/ui/Icon';
import { Job } from '@applyai/shared-types';
import { Image } from 'expo-image';
import { ResumeUploadModal } from '@/components/resume-upload-modal';
import { useAuth } from '@/contexts/auth';

export default function JobDetailsScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const isMobile = width < 768;
  const { session } = useAuth();

  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [showForceUpload, setShowForceUpload] = useState(false);
  const [isApplied, setIsApplied] = useState(false);
  const [applying, setApplying] = useState(false);

  // AI Features State
  const [summary, setSummary] = useState<string | null>(null);
  const [loadingSummary, setLoadingSummary] = useState(true);
  const [matchResult, setMatchResult] = useState<{ score: number; feedback: string } | null>(null);
  const [loadingMatch, setLoadingMatch] = useState(true);

  // Cover Letter State
  const [coverLetter, setCoverLetter] = useState('');
  const [generatingCoverLetter, setGeneratingCoverLetter] = useState(false);

  useEffect(() => {
    const fetchJobAndStatus = async () => {
      const apiUrl = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:4000';
      try {
        const [jobRes, appsRes, summaryRes, matchRes] = await Promise.all([
          fetch(`${apiUrl}/api/jobs/${id}`),
          fetch(`${apiUrl}/api/applications/ids`, {
            headers: { 'Authorization': `Bearer ${session?.access_token}` }
          }),
          fetch(`${apiUrl}/api/jobs/${id}/summary`),
          fetch(`${apiUrl}/api/jobs/${id}/match`, {
            headers: { 'Authorization': `Bearer ${session?.access_token}` }
          })
        ]);

        if (jobRes.ok) {
           const jobData = await jobRes.json();
           setJob(jobData);
        }

        if (appsRes.ok) {
           const appliedIds = await appsRes.json();
           if (Array.isArray(appliedIds) && appliedIds.includes(id)) {
              setIsApplied(true);
           }
        }

        if (summaryRes.ok) {
           const { summary } = await summaryRes.json();
           setSummary(summary);
        }
        setLoadingSummary(false);

        if (matchRes.ok) {
           const matchData = await matchRes.json();
           setMatchResult(matchData);
        }
        setLoadingMatch(false);
      } catch (error) {
        console.error('Fetch error in Job Details:', error);
        setLoadingSummary(false);
        setLoadingMatch(false);
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchJobAndStatus();
  }, [id, session]);

  const handleGenerateCoverLetter = async () => {
    if (generatingCoverLetter) return;
    setGeneratingCoverLetter(true);
    const apiUrl = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:4000';
    try {
      const response = await fetch(`${apiUrl}/api/jobs/${id}/cover-letter`, {
        headers: { 'Authorization': `Bearer ${session?.access_token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setCoverLetter(data.coverLetter);
      } else {
        const errorData = await response.json();
        Alert.alert('AI Error', errorData.error || 'Failed to generate cover letter.');
      }
    } catch (e) {
      console.error('Generate cover letter error:', e);
      Alert.alert('Connection Error', 'Could not reach AI service.');
    } finally {
      setGeneratingCoverLetter(false);
    }
  };

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
    if (isApplied || applying) return;

    const apiUrl = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:4000';
    setApplying(true);

    try {
      const response = await fetch(`${apiUrl}/api/profile`, {
        headers: { 'Authorization': `Bearer ${session?.access_token}` }
      });
      if (!response.ok) {
        setShowForceUpload(true);
        setApplying(false);
        return;
      }
      const profile = await response.json();
      if (!profile || !profile.name || !profile.email || !profile.hasResume) {
        setShowForceUpload(true);
        setApplying(false);
        return;
      }
      const applyResponse = await fetch(`${apiUrl}/api/applications/apply`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`
        },
        body: JSON.stringify({ jobId: job?.id, coverLetter })
      });
      if (applyResponse.ok) {
        setIsApplied(true);
        Alert.alert('Success', 'Application submitted successfully to ' + job?.companyName);
      } else {
        const errData = await applyResponse.json();
        Alert.alert('Tracking Error', errData.error || 'Failed to register your application.');
      }
    } catch (e) {
      console.error('Apply error:', e);
      Alert.alert('Connection Error', 'Could not sync with local database.');
    } finally {
      setApplying(false);
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
    day: 'numeric', month: 'short', year: 'numeric'
  }) : 'Recently';

  return (
    <View className="flex-1 bg-[#fafaf9]" style={Platform.OS === 'web' ? { height: '100vh' } : {}}>
      {/* Sticky Header */}
      <View
        className="px-5 py-4 border-b border-slate-200/60 flex-row items-center justify-between bg-white/80 z-20"
        style={{ paddingTop: insets.top, height: 64 + insets.top }}
      >
        <TouchableOpacity
          onPress={() => router.back()}
          className="w-10 h-10 rounded-xl bg-slate-50 items-center justify-center border border-slate-200/60"
        >
          <Icon name="chevron.left" size={16} color="#1e293b" />
        </TouchableOpacity>

        <View className="items-center flex-1 mx-4">
          <Text className={`${isMobile ? 'text-[11px]' : 'text-[10px]'} font-bold text-slate-400 uppercase tracking-widest mb-0.5`}>Role Analysis</Text>
          <Text className={`${isMobile ? 'text-lg' : 'text-base'} font-bold text-slate-900`} numberOfLines={1}>{job.companyName}</Text>
        </View>

        <TouchableOpacity className="w-10 h-10 rounded-xl bg-slate-50 items-center justify-center border border-slate-200/60">
          <Icon name="square.and.arrow.up" size={16} color="#1e293b" />
        </TouchableOpacity>
      </View>

      <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 120 }}>
        <View className="w-full max-w-3xl mx-auto px-6 pt-10">
          <View className="flex-row items-center mb-6">
            <View className={`${loadingMatch ? 'bg-slate-100' : (matchResult?.score || 0) >= 80 ? 'bg-emerald-50' : 'bg-indigo-50'} px-3 py-1 rounded-lg border ${loadingMatch ? 'border-slate-200' : (matchResult?.score || 0) >= 80 ? 'border-emerald-100' : 'border-indigo-100'} flex-row items-center`}>
              {loadingMatch ? (
                <ActivityIndicator size="small" color="#94a3b8" />
              ) : (
                <>
                  <Icon name="sparkles.fill" size={10} color={(matchResult?.score || 0) >= 80 ? '#059669' : '#6366f1'} />
                  <Text className={`${isMobile ? 'text-[10px]' : 'text-[9px]'} ${(matchResult?.score || 0) >= 80 ? 'text-emerald-700' : 'text-indigo-700'} font-black tracking-widest uppercase ml-1.5`}>
                    {matchResult?.score || 0}% Strategic Match
                  </Text>
                </>
              )}
            </View>
          </View>

          <Text className={`${isMobile ? 'text-3xl' : 'text-2xl'} font-bold text-slate-900 leading-tight mb-6`}>
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
                <Text className={`${isMobile ? 'text-xl' : 'text-lg'} font-bold text-slate-900`}>{job.companyName}</Text>
                <View className="bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-100">
                  <Text className={`${isMobile ? 'text-[11px]' : 'text-[10px]'} font-black uppercase`}>via {job.source}</Text>
                </View>
              </View>
              <View className="flex-row items-center mt-1">
                <Icon name="mappin.and.ellipse" size={11} color="#64748b" />
                <Text className={`text-slate-500 font-semibold ${isMobile ? 'text-[14px]' : 'text-[12px]'} ml-1.5`}>
                  {job.location} • {(job.workplaceType || 'REMOTE').toUpperCase()}
                </Text>
              </View>
            </View>
          </View>

          {/* Key Metrics */}
          <View className={`${isMobile ? 'flex-col' : 'flex-row'} gap-4 mb-4`}>
            <View className="flex-1 bg-white p-6 rounded-2xl border border-slate-200/60 shadow-sm">
              <Text className={`${isMobile ? 'text-[11px]' : 'text-[10px]'} font-bold text-slate-400 uppercase tracking-widest mb-2`}>Compensation</Text>
              <Text className={`${isMobile ? 'text-2xl' : 'text-xl'} font-bold text-slate-900`}>{formatSalary(job.salaryMin, job.salaryMax)}</Text>
            </View>
            <View className="flex-1 bg-white p-6 rounded-2xl border border-slate-200/60 shadow-sm">
              <Text className={`${isMobile ? 'text-[11px]' : 'text-[10px]'} font-bold text-slate-400 uppercase tracking-widest mb-2`}>Target Experience</Text>
              <Text className={`${isMobile ? 'text-2xl' : 'text-xl'} font-bold text-slate-900`}>{formatExperience(job.experienceLevel)}</Text>
            </View>
          </View>

          <View className={`${isMobile ? 'flex-col' : 'flex-row'} gap-4 mb-10`}>
            <View className="flex-1 bg-white p-6 rounded-2xl border border-slate-200/60 shadow-sm">
              <Text className={`${isMobile ? 'text-[11px]' : 'text-[10px]'} font-bold text-slate-400 uppercase tracking-widest mb-2`}>Employment</Text>
              <Text className={`${isMobile ? 'text-lg' : 'text-base'} font-bold text-slate-900`}>{job.employmentType?.replace('_', ' ') || 'FULL TIME'}</Text>
            </View>
            <View className="flex-1 bg-white p-6 rounded-2xl border border-slate-200/60 shadow-sm">
              <Text className={`${isMobile ? 'text-[11px]' : 'text-[10px]'} font-bold text-slate-400 uppercase tracking-widest mb-2`}>Posted At</Text>
              <Text className={`${isMobile ? 'text-lg' : 'text-base'} font-bold text-slate-900`}>{postedDate}</Text>
            </View>
          </View>

          {/* AI Summary Section */}
          <View className="mb-10 bg-white p-8 rounded-[32px] border border-indigo-100 shadow-sm shadow-indigo-50/50">
            <View className="flex-row items-center mb-6">
              <Icon name="sparkles" size={18} color="#6366f1" />
              <Text className={`${isMobile ? 'text-xl' : 'text-lg'} font-bold text-slate-900 ml-3`}>AI Key Insights</Text>
            </View>
            {loadingSummary ? (
              <View className="py-4 items-center">
                <ActivityIndicator color="#6366f1" />
                <Text className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-4">Generating Summary...</Text>
              </View>
            ) : (
              <Text className={`${isMobile ? 'text-lg' : 'text-base'} text-slate-600 leading-relaxed italic`}>
                {summary || "No summary available for this role."}
              </Text>
            )}
          </View>

          {/* AI Match Result */}
          <View className="bg-indigo-950 p-8 md:p-10 rounded-[32px] shadow-xl mb-12">
            <View className="flex-row items-center mb-6">
              <View className="bg-indigo-400 w-2.5 h-2.5 rounded-full mr-3" />
              <Text className="text-indigo-300 font-bold uppercase text-[10px] tracking-widest">Agent Strategic Analysis</Text>
            </View>
            {loadingMatch ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text className="text-white text-lg md:text-xl font-bold leading-snug">
                {matchResult?.feedback || `This role at ${job.companyName} represents a logical progression for your career trajectory.`}
              </Text>
            )}
          </View>

          {/* Cover Letter Section */}
          <View className="mb-12 bg-white p-8 rounded-[32px] border border-slate-200/60 shadow-sm">
            <View className="flex-row items-center justify-between mb-6">
              <View className="flex-row items-center">
                <View className="w-10 h-10 bg-slate-50 rounded-xl items-center justify-center mr-3 border border-slate-100">
                  <Icon name="doc.text.magnifyingglass" size={16} color="#475569" />
                </View>
                <Text className={`${isMobile ? 'text-xl' : 'text-lg'} font-bold text-slate-900`}>Cover Letter</Text>
              </View>

              <TouchableOpacity
                onPress={handleGenerateCoverLetter}
                disabled={generatingCoverLetter || isApplied}
                className="flex-row items-center bg-indigo-50 px-4 py-2 rounded-xl border border-indigo-100"
              >
                {generatingCoverLetter ? (
                  <ActivityIndicator size="small" color="#6366f1" />
                ) : (
                  <>
                    <Icon name="sparkles.fill" size={12} color="#6366f1" />
                    <Text className="text-indigo-600 font-bold text-[11px] uppercase tracking-wider ml-2">Use AI</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>

            <TextInput
              multiline
              numberOfLines={6}
              value={coverLetter}
              onChangeText={setCoverLetter}
              placeholder="Write a brief cover letter or use AI to generate one..."
              placeholderTextColor="#94a3b8"
              className={`bg-slate-50 p-6 rounded-2xl border border-slate-100 text-slate-700 ${isMobile ? 'text-base' : 'text-sm'} leading-relaxed min-h-[200px]`}
              textAlignVertical="top"
              editable={!isApplied && !applying}
            />
            <Text className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-4 text-center">
              Personalize your pitch for a higher success rate
            </Text>
          </View>

          {/* Original Description */}
          <View className="mt-4 border-t border-slate-200/60 pt-10 mb-10">
            <View className="flex-row items-center mb-6">
              <View className="w-10 h-10 bg-indigo-50 rounded-xl items-center justify-center mr-3 border border-indigo-100/50">
                <Icon name="briefcase.fill" size={16} color="#6366f1" />
              </View>
              <Text className={`${isMobile ? 'text-xl' : 'text-lg'} font-bold text-slate-900`}>Full Opportunity Details</Text>
            </View>
            <Text className={`${isMobile ? 'text-lg' : 'text-base'} text-slate-600 leading-relaxed`}>{job.description}</Text>
          </View>
        </View>
      </ScrollView>

      {/* Floating Apply Bar */}
      <View
        className="absolute bottom-0 left-0 right-0 p-5 bg-white/90 border-t border-slate-200/60 shadow-lg"
        style={{ paddingBottom: Math.max(20, insets.bottom + 8) }}
      >
        <View className="max-w-3xl mx-auto w-full">
          <TouchableOpacity
            onPress={handleApply}
            disabled={isApplied || applying}
            className={`${isApplied ? 'bg-slate-400' : 'bg-indigo-600'} py-4 rounded-2xl items-center shadow-xl active:scale-[0.98] w-full`}
          >
            {applying ? (
               <ActivityIndicator color="white" />
            ) : (
               <Text className={`text-white font-bold ${isMobile ? 'text-lg' : 'text-base'} uppercase tracking-widest`}>
                 {isApplied ? 'Applied' : 'Apply Now'}
               </Text>
            )}
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
