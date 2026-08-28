import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { supabase } from '../../lib/supabase';
import { useRouter, Link, useLocalSearchParams } from 'expo-router';
import { Icon } from '@/components/ui/icon';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function LoginScreen() {
  const { role } = useLocalSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function signInWithEmail() {
    if (!email || !password) return;
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      alert(error.message);
    } else {
      // replace ensures the login screen is popped from the backstack
      router.replace(role === 'recruiter' ? '/workspace' : '/assistant');
    }
    setLoading(false);
  }

  return (
    <SafeAreaView className="flex-1 bg-[#fafaf9]">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: 24 }}>
          <View className="w-full max-w-md mx-auto bg-white p-10 rounded-[40px] shadow-2xl shadow-slate-200 border border-slate-100">
            <View className="items-center mb-10">
              <View className="w-16 h-16 bg-indigo-600 rounded-2xl items-center justify-center shadow-lg shadow-indigo-200 mb-6 rotate-3">
                <Icon name="sparkles.fill" size={32} color="white" />
              </View>
              <Text className="text-3xl font-black text-slate-900 tracking-tighter">ApplyAI</Text>
              <Text className="text-slate-400 font-bold text-[10px] uppercase tracking-[3px] mt-2">Intelligence recruitment</Text>
            </View>

            <View className="space-y-5">
              <View>
                <Text className="text-slate-500 font-bold text-[10px] uppercase tracking-widest mb-2 ml-1">Email Address</Text>
                <TextInput
                  className="bg-slate-50 px-5 py-4 rounded-2xl border border-slate-100 text-slate-900 font-semibold"
                  placeholder="name@company.com"
                  placeholderTextColor="#cbd5e1"
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                  keyboardType="email-address"
                />
              </View>

              <View className="mt-4">
                <Text className="text-slate-500 font-bold text-[10px] uppercase tracking-widest mb-2 ml-1">Password</Text>
                <TextInput
                  className="bg-slate-50 px-5 py-4 rounded-2xl border border-slate-100 text-slate-900 font-semibold"
                  placeholder="••••••••"
                  placeholderTextColor="#cbd5e1"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                  autoCapitalize="none"
                />
              </View>

              <TouchableOpacity
                className="bg-slate-900 py-5 rounded-2xl items-center justify-center shadow-lg shadow-slate-200 mt-6 active:scale-[0.98]"
                disabled={loading}
                onPress={signInWithEmail}
              >
                {loading ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text className="text-white font-extrabold text-sm uppercase tracking-widest">Sign In</Text>
                )}
              </TouchableOpacity>
            </View>

            <View className="mt-10 items-center">
              <Link href={{ pathname: "/register", params: { role } }} asChild>
                <TouchableOpacity>
                  <Text className="text-slate-400 text-xs font-semibold">
                    Don't have an account? <Text className="text-indigo-600 font-bold">Create one</Text>
                  </Text>
                </TouchableOpacity>
              </Link>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
