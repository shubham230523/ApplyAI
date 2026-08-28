import React from 'react';
import { View, Text, TouchableOpacity, useWindowDimensions, ScrollView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { Icon } from '@/components/ui/Icon';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function RoleSelectionScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isDesktop = width > 1024;

  const handleSelectRole = (role: 'candidate' | 'recruiter') => {
    router.push({
      pathname: '/(auth)/login',
      params: { role }
    });
  };

  return (
    <SafeAreaView className="flex-1 bg-[#fafaf9]">
      <ScrollView
        contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', paddingVertical: 20 }}
        showsVerticalScrollIndicator={false}
      >
        <View className="items-center px-6">
          <View className="items-center mb-8">
            <View className="w-16 h-20 bg-indigo-600 rounded-[28px] items-center justify-center shadow-2xl shadow-indigo-200 mb-6 rotate-6">
              <Icon name="sparkles.fill" size={40} color="white" />
            </View>
            <Text className="text-3xl md:text-5xl font-black text-slate-900 tracking-tighter text-center">ApplyAI</Text>
            <Text className="text-slate-400 font-bold text-[9px] uppercase tracking-[4px] mt-2">Intelligence Recruitment</Text>
          </View>

          <Text className="text-lg md:text-2xl font-bold text-slate-800 mb-8 text-center">How would you like to continue?</Text>

          <View className={`${isDesktop ? 'flex-row' : 'flex-col'} gap-5 w-full max-w-4xl`}>
            {/* Candidate Option */}
            <TouchableOpacity
              onPress={() => handleSelectRole('candidate')}
              className="bg-white p-6 md:p-10 rounded-[32px] border border-slate-100 shadow-xl shadow-slate-200/50 active:scale-[0.98] flex-row md:flex-col items-center md:items-start"
              style={isDesktop ? { flex: 1 } : { width: '100%' }}
            >
              <View className="w-14 h-14 bg-blue-50 rounded-2xl items-center justify-center mb-0 md:mb-6 mr-5 md:mr-0">
                <Icon name="person.fill" size={28} color="#2563eb" />
              </View>
              <View className="flex-1">
                <Text className="text-lg md:text-2xl font-black text-slate-900 mb-1">I'm a Candidate</Text>
                <Text className="text-slate-500 font-medium leading-tight text-xs md:text-base">Find your dream job with AI-powered matching and auto-applications.</Text>

                <View className="flex-row items-center mt-3 md:mt-6">
                   <Text className="text-blue-600 font-black text-[9px] uppercase tracking-widest">Get Started</Text>
                   <View className="ml-2 bg-blue-600 rounded-full p-1">
                      <Icon name="chevron.left" size={8} color="white" style={{ transform: [{ rotate: '180deg' }] }} />
                   </View>
                </View>
              </View>
            </TouchableOpacity>

            {/* Recruiter Option */}
            <TouchableOpacity
              onPress={() => handleSelectRole('recruiter')}
              className="bg-white p-6 md:p-10 rounded-[32px] border border-slate-100 shadow-xl shadow-slate-200/50 active:scale-[0.98] flex-row md:flex-col items-center md:items-start"
              style={isDesktop ? { flex: 1 } : { width: '100%' }}
            >
              <View className="w-14 h-14 bg-emerald-50 rounded-2xl items-center justify-center mb-0 md:mb-6 mr-5 md:mr-0">
                <Icon name="briefcase.fill" size={28} color="#059669" />
              </View>
              <View className="flex-1">
                <Text className="text-lg md:text-2xl font-black text-slate-900 mb-1">I'm a Recruiter</Text>
                <Text className="text-slate-500 font-medium leading-tight text-xs md:text-base">Source top talent and manage your recruitment pipeline with ease.</Text>

                <View className="flex-row items-center mt-3 md:mt-6">
                   <Text className="text-emerald-600 font-black text-[9px] uppercase tracking-widest">Post a Job</Text>
                   <View className="ml-2 bg-emerald-600 rounded-full p-1">
                      <Icon name="chevron.left" size={8} color="white" style={{ transform: [{ rotate: '180deg' }] }} />
                   </View>
                </View>
              </View>
            </TouchableOpacity>
          </View>

          <Text className="mt-12 text-slate-400 font-bold text-[9px] uppercase tracking-widest">Premium Recruitment Experience</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
