import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  ActivityIndicator,
  Text,
  SafeAreaView,
  Animated,
  useWindowDimensions,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon } from '@/components/ui/Icon';
import { JobCard } from '@/components/job-card';
import { JobFeed } from '@/components/job-feed';
import { ResumeUploadModal } from '@/components/resume-upload-modal';
import { Job, OrchestratorResponse } from '@applyai/shared-types';
import { Image } from 'expo-image';
import { useAuth } from '@/contexts/auth';

interface Message {
  id: string;
  type: 'user' | 'bot';
  text: string;
  jobs?: Job[];
}

const SUGGESTIONS = [
  "Find Android roles in Bangalore",
  "Remote React Native jobs",
  "Backend Engineer in Mumbai",
  "Jobs with 15+ LPA salary"
];

export default function AssistantScreen() {
  const { session } = useAuth();
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const isDesktop = width > 1024;
  const isMobile = width < 768;

  const [query, setQuery] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      type: 'bot',
      text: "👋 Welcome to your ApplyAI workspace. I'm your recruitment agent. What roles should we target today?",
    },
  ]);
  const [loading, setLoading] = useState(false);
  const [recommendationsLoading, setRecommendationsLoading] = useState(true);
  const [allJobs, setAllJobs] = useState<Job[]>([]);
  const [selectedJobIds, setSelectedJobIds] = useState<Set<string>>(new Set());
  const [applying, setApplying] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const [isProfileMissing, setIsProfileMissing] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const [appliedJobIds, setAppliedJobIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    // Check if profile exists and get applied jobs
    const init = async () => {
      if (!session) return;
      setRecommendationsLoading(true);

      const apiUrl = process.env.EXPO_PUBLIC_API_URL || 'https://applyai-rtuv.onrender.com';
      try {
        const [profileRes, appliedRes, recommendRes] = await Promise.all([
          fetch(`${apiUrl}/api/profile`, {
            headers: { 'Authorization': `Bearer ${session?.access_token}` }
          }),
          fetch(`${apiUrl}/api/applications/ids`, {
            headers: { 'Authorization': `Bearer ${session?.access_token}` }
          }),
          fetch(`${apiUrl}/api/orchestrator/recommendations`, {
            headers: { 'Authorization': `Bearer ${session?.access_token}` }
          })
        ]);

        if (profileRes.status === 404) {
           setIsProfileMissing(true);
           setShowUpload(true);
        } else {
           const data = await profileRes.json();
           if (data === null) {
             setIsProfileMissing(true);
             setShowUpload(true);
           } else {
             setProfile(data);
             if (!data.hasResume) setShowUpload(true);
           }
        }

        if (appliedRes.ok) {
           const ids = await appliedRes.json();
           if (Array.isArray(ids)) {
             setAppliedJobIds(new Set(ids));
           }
        }

        if (recommendRes.ok) {
          const data = await recommendRes.json();
          if (data.jobs && data.jobs.length > 0) {
            setAllJobs(data.jobs);
            // Add a recommendation message if it's the first time
            setMessages(prev => [
              ...prev,
              {
                id: 'recommendations',
                type: 'bot',
                text: "Based on your profile, here are some top matches I found for you:",
                jobs: isDesktop ? undefined : data.jobs
              }
            ]);
          }
        }
      } catch (e) {
        console.error('Init error:', e);
      } finally {
        setRecommendationsLoading(false);
      }
    };
    init();
  }, []);

  const scrollViewRef = useRef<ScrollView>(null);
  const typingOpac = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    if (loading || recommendationsLoading) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(typingOpac, { toValue: 1, duration: 500, useNativeDriver: true }),
          Animated.timing(typingOpac, { toValue: 0.3, duration: 500, useNativeDriver: true }),
        ])
      ).start();
    } else {
      typingOpac.setValue(0.3);
    }
  }, [loading, recommendationsLoading]);

  const handleToggleJob = (id: string) => {
    setSelectedJobIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleBulkApply = async () => {
    if (selectedJobIds.size === 0 || applying) return;
    setApplying(true);
    try {
      await new Promise(r => setTimeout(r, 2000));
      alert(`Initiated ${selectedJobIds.size} applications.`);
      setSelectedJobIds(new Set());
    } finally {
      setApplying(false);
    }
  };

  const handleSend = async (customQuery?: string) => {
    const textToSend = customQuery || query;
    if (!textToSend.trim() || loading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      text: textToSend,
    };

    setMessages((prev) => [...prev, userMessage]);
    setQuery('');
    setLoading(true);

    const apiUrl = process.env.EXPO_PUBLIC_API_URL || 'https://applyai-rtuv.onrender.com';

    // Safety abort controller
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 45000); // 45s timeout

    try {
      console.log('Dispatching request to:', `${apiUrl}/api/orchestrator/query`);
      const response = await fetch(`${apiUrl}/api/orchestrator/query`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`
        },
        body: JSON.stringify({
          query: textToSend,
          history: messages.slice(-6)
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);
      console.log('Network response status:', response.status);

      if (!response.ok) {
        throw new Error(`Server returned ${response.status}`);
      }

      const data: OrchestratorResponse = await response.json();
      console.log('Payload decoded. Jobs found:', data.jobs?.length);

      if (data.jobs && data.jobs.length > 0) {
        setAllJobs(prev => [...data.jobs, ...prev]);
      }

      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'bot',
        text: data.message,
        jobs: isDesktop ? undefined : data.jobs, // Only show in chat on mobile
      };

      setMessages((prev) => [...prev, botMessage]);
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          type: 'bot',
          text: "System offline. Please check connection.",
        },
      ]);
    } finally {
      setLoading(false);
      // Removed aggressive scrollToEnd to prevent jumping past job results
    }
  };

  return (
    <View className="flex-1 bg-[#fafaf9] h-screen overflow-hidden mesh-gradient" style={Platform.OS === 'web' ? { height: '100vh' } : { flex: 1, paddingTop: insets.top }}>
      <View className="flex-1 flex-row overflow-hidden h-full">
        {/* CHAT PANE */}
        <View className={`${isDesktop ? 'w-[400px] border-r border-slate-200/60' : 'flex-1'} bg-white/40 h-full overflow-hidden`}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            className="flex-1 h-full"
            keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
          >
            {/* Chat Header - Soft Glass */}
            <View className="px-4 py-3 border-b border-slate-200/40 glass z-20 flex-row items-center justify-between">
              <View>
                <Text className={`${isMobile ? 'text-xl' : 'text-lg'} font-bold text-slate-900 tracking-tighter`} style={{ fontFamily: 'Outfit' }}>Agent Chat</Text>
                <View className="flex-row items-center mt-0.5">
                  <View className="w-1.5 h-1.5 rounded-full bg-indigo-500 mr-1.5" />
                  <Text className={`${isMobile ? 'text-[9px]' : 'text-[8px]'} font-bold text-slate-400 uppercase tracking-tight`}>Context Aware</Text>
                </View>
              </View>
              {isDesktop && (
                <TouchableOpacity className="w-8 h-8 rounded-full overflow-hidden border border-slate-100 shadow-sm bg-indigo-50 items-center justify-center">
                  {profile?.profileImageUrl ? (
                    <Image
                      source={{ uri: profile.profileImageUrl }}
                      style={{ width: '100%', height: '100%' }}
                      contentFit="cover"
                    />
                  ) : (
                    <Icon name="person.fill" size={14} color="#6366f1" />
                  )}
                </TouchableOpacity>
              )}
            </View>

            {/* Chat Messages */}
            <View className="flex-1 overflow-hidden">
              <ScrollView
                ref={scrollViewRef}
                contentContainerStyle={{
                  paddingHorizontal: 20,
                  paddingTop: 32,
                  paddingBottom: 100,
                  maxWidth: isDesktop ? undefined : 800,
                  width: '100%',
                  alignSelf: 'center'
                }}
                showsVerticalScrollIndicator={false}
                className="flex-1"
              >
                {messages.map((msg) => (
                  <View key={msg.id} className={`mb-10 ${msg.type === 'user' ? 'items-end' : 'items-start'}`}>
                    <View className={`px-4 py-3 rounded-[20px] max-w-[95%] shadow-sm ${
                      msg.type === 'user'
                        ? 'bg-slate-900 rounded-br-none'
                        : 'bg-white rounded-bl-none border border-slate-200/60'
                    }`}>
                      <Text className={`${isMobile ? 'text-[14.5px]' : 'text-[12.5px]'} leading-relaxed ${msg.type === 'user' ? 'text-white font-medium' : 'text-slate-700'}`}>
                        {msg.text}
                      </Text>
                    </View>

                    {!isDesktop && msg.jobs && msg.jobs.length > 0 && (
                      <View className="mt-10 w-full">
                        {msg.jobs.map((job) => (
                          <JobCard
                            key={job.id}
                            job={job}
                            selected={selectedJobIds.has(job.id)}
                            onToggle={handleToggleJob}
                            applied={appliedJobIds.has(job.id)}
                          />
                        ))}
                      </View>
                    )}
                  </View>
                ))}

                {(loading || recommendationsLoading) && (
                  <View className="self-start bg-white border border-slate-200/60 px-8 py-5 rounded-[28px] rounded-bl-none flex-row items-center shadow-sm">
                    <Animated.View style={{ opacity: typingOpac }} className="flex-row gap-2">
                      <View className="w-2 h-2 bg-indigo-400 rounded-full" />
                      <View className="w-2 h-2 bg-indigo-500 rounded-full" />
                      <View className="w-2 h-2 bg-indigo-600 rounded-full" />
                    </Animated.View>
                    <Text className="ml-4 text-[12px] font-bold text-slate-400 uppercase tracking-widest">
                      {recommendationsLoading ? "Discovering matches..." : "Thinking..."}
                    </Text>
                  </View>
                )}

                {messages.length === 1 && !loading && (
                  <View className="mt-8 flex-row flex-wrap gap-3">
                    {SUGGESTIONS.map((s, i) => (
                      <TouchableOpacity
                        key={i}
                        onPress={() => handleSend(s)}
                        className="bg-white border border-slate-200/80 px-6 py-4 rounded-[20px] shadow-sm active:scale-95"
                      >
                        <Text className={`text-slate-900 ${isMobile ? 'text-[12px]' : 'text-[11px]'} font-bold uppercase tracking-tight`}>{s}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </ScrollView>
            </View>

            {/* Input Bar */}
            <View
              className="px-5 py-4 bg-white/95 border-t border-slate-100 z-30"
              style={{ paddingBottom: Math.max(4, insets.bottom / 2) }}
            >
              {selectedJobIds.size > 0 && (
                <TouchableOpacity
                  onPress={handleBulkApply}
                  disabled={applying}
                  className="bg-indigo-600 py-4 rounded-2xl mb-4 items-center shadow-xl shadow-indigo-100 active:scale-[0.99]"
                >
                   <Text className={`text-white font-bold uppercase tracking-widest ${isMobile ? 'text-sm' : 'text-xs'}`}>Apply to {selectedJobIds.size} Roles</Text>
                </TouchableOpacity>
              )}

              <View className="flex-row items-center bg-slate-50 border border-slate-200 rounded-[28px] pl-5 pr-2 py-1 shadow-inner">
                <TextInput
                  className={`flex-1 min-h-[52px] text-slate-900 ${isMobile ? 'text-[16px]' : 'text-[15px]'} py-3`}
                  placeholder="Task your agent..."
                  placeholderTextColor="#94a3b8"
                  value={query}
                  onChangeText={setQuery}
                  multiline
                  style={{ fontFamily: 'Inter', outlineStyle: 'none' } as any}
                  autoFocus={true}
                />
                <View className="w-10 items-center justify-center">
                  {query.trim().length > 0 && (
                    <TouchableOpacity
                      onPress={() => handleSend()}
                      disabled={loading}
                      className="w-8 h-8 rounded-full bg-indigo-600 items-center justify-center active:scale-90"
                    >
                      <Text className="text-white text-[16px] font-bold" style={{ marginTop: -2 }}>↑</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            </View>
          </KeyboardAvoidingView>
        </View>

        {/* FEED PANE (Desktop Only) */}
        {isDesktop && (
          <View className="flex-1 h-full overflow-hidden bg-[#fafaf9]">
            <JobFeed
              jobs={allJobs}
              loading={loading || recommendationsLoading}
              selectedJobIds={selectedJobIds}
              onToggleJob={handleToggleJob}
              appliedJobIds={appliedJobIds}
            />
          </View>
        )}
      </View>
      <ResumeUploadModal visible={showUpload} onClose={() => setShowUpload(false)} />
    </View>
  );
}
