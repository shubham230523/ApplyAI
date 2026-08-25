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
import { SymbolView } from 'expo-symbols';
import { JobCard } from '@/components/job-card';
import { JobFeed } from '@/components/job-feed';
import { Job, OrchestratorResponse } from '@applyai/shared-types';

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
  const { width } = useWindowDimensions();
  const isDesktop = width > 1024;

  const [query, setQuery] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      type: 'bot',
      text: "👋 Welcome to your ApplyAI workspace. I'm your recruitment agent. What roles should we target today?",
    },
  ]);
  const [loading, setLoading] = useState(false);
  const [allJobs, setAllJobs] = useState<Job[]>([]);
  const [selectedJobIds, setSelectedJobIds] = useState<Set<string>>(new Set());
  const [applying, setApplying] = useState(false);

  const scrollViewRef = useRef<ScrollView>(null);
  const typingOpac = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    if (loading) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(typingOpac, { toValue: 1, duration: 500, useNativeDriver: true }),
          Animated.timing(typingOpac, { toValue: 0.3, duration: 500, useNativeDriver: true }),
        ])
      ).start();
    } else {
      typingOpac.setValue(0.3);
    }
  }, [loading]);

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

    try {
      const response = await fetch('http://localhost:4000/api/orchestrator/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: textToSend,
          history: messages.slice(-6) // Pass last 3 rounds of conversation for context
        }),
      });

      const data: OrchestratorResponse = await response.json();

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
      setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 100);
    }
  };

  return (
    <View className="flex-1 bg-[#fafaf9] h-screen overflow-hidden mesh-gradient" style={Platform.OS === 'web' ? { height: '100vh' } : { flex: 1 }}>
      <View className="flex-1 flex-row overflow-hidden h-full">
        {/* CHAT PANE */}
        <View className={`${isDesktop ? 'w-[500px] border-r border-slate-200/60' : 'flex-1'} bg-white/40 h-full overflow-hidden`}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            className="flex-1 h-full"
            keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
          >
            {/* Chat Header - Soft Glass */}
            <View className="px-8 py-8 border-b border-slate-200/40 glass z-20 flex-row items-center justify-between">
              <View>
                <Text className="text-3xl font-bold text-slate-900 tracking-tighter" style={{ fontFamily: 'Outfit' }}>Agent Chat</Text>
                <View className="flex-row items-center mt-1.5">
                  <View className="w-2 h-2 rounded-full bg-indigo-500 mr-2.5" />
                  <Text className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.2em]">Context Aware</Text>
                </View>
              </View>
              <TouchableOpacity className="w-12 h-12 rounded-full bg-slate-50 items-center justify-center border border-slate-100 shadow-sm">
                <SymbolView name="brain.head.profile" size={20} tintColor="#6366f1" />
              </TouchableOpacity>
            </View>

            {/* Chat Messages */}
            <View className="flex-1 overflow-hidden">
              <ScrollView
                ref={scrollViewRef}
                contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 40, paddingBottom: 120 }}
                showsVerticalScrollIndicator={false}
                className="flex-1"
              >
                {messages.map((msg) => (
                  <View key={msg.id} className={`mb-14 ${msg.type === 'user' ? 'items-end' : 'items-start'}`}>
                    <View className={`px-8 py-6 rounded-[36px] max-w-[95%] shadow-sm ${
                      msg.type === 'user'
                        ? 'bg-slate-900 rounded-br-none'
                        : 'bg-white rounded-bl-none border border-slate-200/60'
                    }`}>
                      <Text className={`text-[20px] leading-relaxed ${msg.type === 'user' ? 'text-white font-medium' : 'text-slate-700'}`}>
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
                          />
                        ))}
                      </View>
                    )}
                  </View>
                ))}

                {loading && (
                  <View className="self-start bg-white border border-slate-200/60 px-10 py-6 rounded-[36px] rounded-bl-none flex-row items-center shadow-sm">
                    <Animated.View style={{ opacity: typingOpac }} className="flex-row gap-3">
                      <View className="w-2.5 h-2.5 bg-indigo-400 rounded-full" />
                      <View className="w-2.5 h-2.5 bg-indigo-500 rounded-full" />
                      <View className="w-2.5 h-2.5 bg-indigo-600 rounded-full" />
                    </Animated.View>
                    <Text className="ml-5 text-[14px] font-bold text-slate-400 uppercase tracking-widest">Thinking...</Text>
                  </View>
                )}

                {messages.length === 1 && !loading && (
                  <View className="mt-12 flex-row flex-wrap gap-4">
                    {SUGGESTIONS.map((s, i) => (
                      <TouchableOpacity
                        key={i}
                        onPress={() => handleSend(s)}
                        className="bg-white border border-slate-200/80 px-8 py-5 rounded-[24px] shadow-sm active:scale-95"
                      >
                        <Text className="text-slate-900 text-[13px] font-bold uppercase tracking-tight">{s}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </ScrollView>
            </View>

            {/* Input Bar */}
            <View className="px-8 py-10 bg-white/95 border-t border-slate-100 z-30">
              {selectedJobIds.size > 0 && (
                <TouchableOpacity
                  onPress={handleBulkApply}
                  disabled={applying}
                  className="bg-indigo-600 py-7 rounded-[32px] mb-8 items-center shadow-xl shadow-indigo-100 active:scale-[0.99]"
                >
                   <Text className="text-white font-black uppercase tracking-[0.2em] text-sm">Apply to {selectedJobIds.size} Roles</Text>
                </TouchableOpacity>
              )}

              <View className="flex-row items-center bg-slate-50 border border-slate-200 rounded-[40px] px-8 py-2 shadow-inner">
                <TextInput
                  className="flex-1 min-h-[72px] text-slate-900 text-[20px] py-5"
                  placeholder="Task your agent..."
                  placeholderTextColor="#94a3b8"
                  value={query}
                  onChangeText={setQuery}
                  multiline
                  style={{ fontFamily: 'Inter' }}
                  autoFocus={true}
                />
                <TouchableOpacity
                  onPress={() => handleSend()}
                  disabled={loading || !query.trim()}
                  className={`ml-5 w-16 h-16 rounded-full items-center justify-center ${
                    query.trim() ? 'bg-indigo-600 shadow-xl shadow-indigo-200' : 'bg-slate-200'
                  }`}
                >
                  <SymbolView name="arrow.up" size={26} tintColor="white" />
                </TouchableOpacity>
              </View>
            </View>
          </KeyboardAvoidingView>
        </View>

        {/* FEED PANE (Desktop Only) */}
        {isDesktop && (
          <View className="flex-1 h-full overflow-hidden bg-[#fafaf9]">
            <JobFeed
              jobs={allJobs}
              loading={loading}
              selectedJobIds={selectedJobIds}
              onToggleJob={handleToggleJob}
            />
          </View>
        )}
      </View>
    </View>
  );
}
