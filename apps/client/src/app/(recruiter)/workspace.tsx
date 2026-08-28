import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, SafeAreaView, Alert } from 'react-native';
import { useAuth } from '@/contexts/auth';
import { Icon } from '@/components/ui/Icon';
import { useRouter } from 'expo-router';

export default function RecruiterDashboard() {
  const { session, user, signOut } = useAuth();
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRecruiterProfile = async () => {
      const apiUrl = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:4001';
      try {
        const response = await fetch(`${apiUrl}/api/profile/recruiter`, {
          headers: {
            'Authorization': `Bearer ${session?.access_token}`,
          },
        });
        if (response.ok) {
          const data = await response.json();
          setProfile(data);
        }
      } catch (e) {
        console.error('Fetch recruiter profile error:', e);
      } finally {
        setLoading(false);
      }
    };

    if (session) fetchRecruiterProfile();
  }, [session]);

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (e) {
      console.error('Sign out error:', e);
      Alert.alert('Error', 'Failed to sign out. Please try again.');
    }
  };

  const displayName = profile?.name || user?.email?.split('@')[0] || 'Recruiter';

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-[#fafaf9]">
        <ActivityIndicator color="#059669" />
      </View>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-[#fafaf9]">
      {/* Header */}
      <View className="px-6 py-4 bg-white border-b border-slate-100 flex-row justify-between items-center">
        <View className="flex-row items-center">
          <View className="w-8 h-8 bg-emerald-600 rounded-lg items-center justify-center mr-3">
            <Icon name="briefcase.fill" size={16} color="white" />
          </View>
          <Text className="text-xl font-black text-slate-900 tracking-tighter" style={{ fontFamily: 'Geist' }}>ApplyAI</Text>
          <View className="ml-2 px-2 py-0.5 bg-emerald-50 rounded-md border border-emerald-100">
            <Text className="text-[10px] font-black text-emerald-700 uppercase">Recruiter</Text>
          </View>
        </View>

        <TouchableOpacity onPress={handleSignOut} className="flex-row items-center px-4 py-2 rounded-xl hover:bg-red-50">
          <Icon name="rectangle.portrait.and.arrow.right" size={16} color="#ef4444" />
          <Text className="ml-2 text-sm font-bold text-red-500">Sign Out</Text>
        </TouchableOpacity>
      </View>

      {/* Main Content */}
      <View className="flex-1 px-8 pt-12 items-center">
        <View className="w-full max-w-4xl">
          <View className="mb-12">
            <Text className="text-gray-400 text-sm font-bold uppercase tracking-widest mb-2">Welcome Back</Text>
            <Text className="text-5xl font-black text-slate-900 tracking-tight">Hi {displayName}</Text>
          </View>

          <View className="bg-white p-12 rounded-[40px] border border-slate-100 shadow-xl shadow-slate-200/50 items-center">
            <View className="w-20 h-20 bg-emerald-50 rounded-3xl items-center justify-center mb-8">
              <Icon name="sparkles.fill" size={40} color="#059669" />
            </View>
            <Text className="text-2xl font-bold text-slate-900 mb-3">Recruiter Workspace</Text>
            <Text className="text-slate-500 text-center text-lg max-w-md">
              We are setting up your talent pipeline. Soon you'll be able to post jobs and find the best matches automatically.
            </Text>

            <TouchableOpacity className="mt-10 bg-slate-900 px-10 py-5 rounded-2xl shadow-lg active:scale-95">
              <Text className="text-white font-black uppercase tracking-widest">Get Started</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}
