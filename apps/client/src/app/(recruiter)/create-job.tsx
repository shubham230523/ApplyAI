import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TextInput, TouchableOpacity, ActivityIndicator, KeyboardAvoidingView, Platform, useWindowDimensions, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Icon } from '@/components/ui/Icon';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/contexts/auth';

export default function CreateJobScreen() {
  const { session } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const { width } = useWindowDimensions();
  const isDesktop = width > 1024;

  const [form, setForm] = useState({
    title: '',
    companyName: '',
    location: '',
    description: '',
    workplaceType: 'REMOTE',
    employmentType: 'FULL_TIME',
    experienceLevel: 'MID_LEVEL',
    salaryMin: '',
    salaryMax: '',
    salaryCurrency: 'INR',
    salaryPeriod: 'YEARLY',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    const fetchRecruiterProfile = async () => {
      const apiUrl = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:4002';
      try {
        const response = await fetch(`${apiUrl}/api/profile/recruiter`, {
          headers: {
            'Authorization': `Bearer ${session?.access_token}`,
          },
        });
        if (response.ok) {
          const profile = await response.json();
          if (profile?.companyName) {
            setForm(f => ({ ...f, companyName: profile.companyName }));
          }
        }
      } catch (e) {
        console.error('Failed to fetch recruiter profile:', e);
      }
    };

    if (session) fetchRecruiterProfile();
  }, [session]);

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!form.title.trim()) newErrors.title = 'Job Title is required';
    if (!form.companyName.trim()) newErrors.companyName = 'Company Name is required';
    if (!form.description.trim()) newErrors.description = 'Job Description is required';
    if (!form.location.trim()) newErrors.location = 'Location is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleCreate = async () => {
    if (!validate()) {
      Alert.alert('Validation Error', 'Please fill all required fields.');
      return;
    }

    setLoading(true);
    const apiUrl = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:4002';

    try {
      const response = await fetch(`${apiUrl}/api/jobs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({
          ...form,
          salaryMin: form.salaryMin ? parseInt(form.salaryMin) : undefined,
          salaryMax: form.salaryMax ? parseInt(form.salaryMax) : undefined,
        }),
      });

      if (response.ok) {
        Alert.alert('Success', 'Job posted successfully!');
        router.replace('/(recruiter)/workspace');
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error('Job creation failed:', response.status, errorData);
        throw new Error(errorData.error || errorData.message || `Server responded with ${response.status}`);
      }
    } catch (error: any) {
      console.error('Error creating job:', error);
      Alert.alert('Post Failed', error.message || 'Failed to save job. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const renderInput = (label: string, value: string, key: keyof typeof form, placeholder: string, keyboardType: any = 'default', required: boolean = false, multiline: boolean = false) => (
    <View className={`mb-8 ${isDesktop && !multiline ? 'flex-1 mx-3' : ''}`}>
      <View className="flex-row items-center mb-3 ml-1">
        <Text className="text-slate-500 font-black text-[10px] uppercase tracking-[3px]">{label}</Text>
        {required && <Text className="text-red-500 text-[10px] ml-1">*</Text>}
      </View>
      <TextInput
        value={value}
        onChangeText={(text) => {
          setForm(f => ({ ...f, [key]: text }));
          if (errors[key]) setErrors(prev => ({ ...prev, [key]: '' }));
        }}
        placeholder={placeholder}
        placeholderTextColor="#cbd5e1"
        keyboardType={keyboardType}
        multiline={multiline}
        numberOfLines={multiline ? 8 : 1}
        className={`bg-slate-50/50 px-6 py-5 rounded-[24px] border-2 ${errors[key] ? 'border-red-400' : 'border-slate-100'} text-slate-900 font-bold shadow-sm focus:border-emerald-500 transition-all ${multiline ? 'min-h-[200px] pt-5' : ''}`}
        textAlignVertical={multiline ? 'top' : 'center'}
      />
      {errors[key] ? <Text className="text-red-500 text-[10px] mt-2 ml-1 font-black uppercase tracking-widest">{errors[key]}</Text> : null}
    </View>
  );

  const renderDropdown = (label: string, value: string, key: keyof typeof form, options: { label: string, value: string }[]) => (
    <View className={`mb-8 ${isDesktop ? 'flex-1 mx-3' : ''}`}>
      <Text className="text-slate-500 font-black text-[10px] uppercase tracking-[3px] mb-3 ml-1">{label}</Text>
      <View className="bg-slate-50/50 rounded-[24px] border-2 border-slate-100 shadow-sm overflow-hidden">
        {Platform.OS === 'web' ? (
          <select
            value={value}
            onChange={(e) => setForm(f => ({ ...f, [key]: e.target.value }))}
            style={{
              width: '100%',
              padding: '20px 24px',
              border: 'none',
              background: 'transparent',
              fontSize: '15px',
              fontWeight: '700',
              color: '#0f172a',
              outline: 'none',
              appearance: 'none'
            }}
          >
            {options.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
          </select>
        ) : (
          <View className="px-6 py-5 flex-row justify-between items-center">
            <Text className="text-slate-900 font-bold">{options.find(o => o.value === value)?.label}</Text>
            <Icon name="chevron.left" size={12} color="#94a3b8" style={{ transform: [{ rotate: '-90deg' }] }} />
          </View>
        )}
      </View>
    </View>
  );

  return (
    <SafeAreaView className="flex-1 bg-[#fafaf9]">
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1">
        <View className="bg-white border-b border-slate-100 items-center z-20 shadow-sm shadow-slate-200/30">
          <View style={{ maxWidth: 1000, width: '100%' }} className="px-6 py-5 flex-row items-center justify-between">
            <TouchableOpacity
              onPress={() => router.back()}
              className="w-12 h-12 items-center justify-center bg-slate-50 rounded-2xl border border-slate-100 shadow-sm active:scale-95"
            >
              <Icon name="xmark" size={20} color="#1e293b" />
            </TouchableOpacity>
            <Text className="text-xl font-black text-slate-900 tracking-tighter" style={{ fontFamily: 'Geist' }}>Post New Job</Text>
            <View className="w-12" />
          </View>
        </View>

        <ScrollView className="flex-1" contentContainerStyle={{ alignItems: 'center' }} showsVerticalScrollIndicator={false}>
          <View style={{ maxWidth: 950, width: '100%' }} className="px-6 pt-12 pb-40">
            {/* Header */}
            <View className="bg-slate-900 p-12 rounded-[48px] mb-12 shadow-2xl shadow-slate-300 overflow-hidden relative border-b-8 border-emerald-600">
              <View className="absolute -top-10 -right-10 w-48 h-48 bg-white/5 rounded-full" />
              <View className="relative z-10 flex-row items-center">
                <View className="w-24 h-24 rounded-[32px] bg-emerald-500 items-center justify-center shadow-2xl shadow-emerald-500/40 rotate-3">
                  <Icon name="doc.fill.badge.plus" size={40} color="white" />
                </View>
                <View className="ml-8 flex-1">
                  <Text className="text-white text-4xl font-black leading-tight tracking-tight">Create Listing</Text>
                  <Text className="text-slate-400 text-sm mt-1 font-bold tracking-widest uppercase">Intelligence Sourcing</Text>
                </View>
              </View>
            </View>

            {/* Basic Info */}
            <View className="bg-white p-10 rounded-[40px] border border-slate-100 shadow-xl shadow-slate-200/40 mb-10">
              <Text className="text-slate-900 text-2xl font-black mb-10 tracking-tight">Job Essentials</Text>
              {renderInput('Job Title', form.title, 'title', 'e.g. Senior Frontend Engineer', 'default', true)}
              <View className={isDesktop ? 'flex-row -mx-3' : ''}>
                {renderInput('Company Name', form.companyName, 'companyName', 'e.g. TechCorp', 'default', true)}
                {renderInput('Primary Location', form.location, 'location', 'e.g. Bangalore or Remote', 'default', true)}
              </View>
            </View>

            {/* Classification */}
            <View className="bg-white p-10 rounded-[40px] border border-slate-100 shadow-xl shadow-slate-200/40 mb-10">
              <Text className="text-slate-900 text-2xl font-black mb-10 tracking-tight">Work Environment</Text>
              <View className={isDesktop ? 'flex-row -mx-3' : ''}>
                {renderDropdown('Workplace Model', form.workplaceType, 'workplaceType', [
                  { label: 'Remote First', value: 'REMOTE' },
                  { label: 'Hybrid / Flexible', value: 'HYBRID' },
                  { label: 'On-site / Office', value: 'ON_SITE' }
                ])}
                {renderDropdown('Employment Type', form.employmentType, 'employmentType', [
                  { label: 'Full Time', value: 'FULL_TIME' },
                  { label: 'Part Time', value: 'PART_TIME' },
                  { label: 'Contract', value: 'CONTRACT' },
                  { label: 'Internship', value: 'INTERNSHIP' }
                ])}
              </View>
              <View className={isDesktop ? 'flex-row -mx-3' : ''}>
                {renderDropdown('Seniority Level', form.experienceLevel, 'experienceLevel', [
                  { label: 'Entry Level', value: 'ENTRY_LEVEL' },
                  { label: 'Mid-Senior Level', value: 'MID_LEVEL' },
                  { label: 'Senior / Specialist', value: 'SENIOR_LEVEL' },
                  { label: 'Director / Executive', value: 'EXECUTIVE' }
                ])}
                <View className="flex-1 mx-3" />
              </View>
            </View>

            {/* Compensation */}
            <View className="bg-white p-10 rounded-[40px] border border-slate-100 shadow-xl shadow-slate-200/40 mb-10">
              <Text className="text-slate-900 text-2xl font-black mb-10 tracking-tight">Compensation Package</Text>
              <View className={isDesktop ? 'flex-row -mx-3' : ''}>
                {renderInput('Min Salary (LPA)', form.salaryMin, 'salaryMin', 'e.g. 15', 'numeric')}
                {renderInput('Max Salary (LPA)', form.salaryMax, 'salaryMax', 'e.g. 30', 'numeric')}
              </View>
              <View className={isDesktop ? 'flex-row -mx-3' : ''}>
                {renderDropdown('Currency', form.salaryCurrency, 'salaryCurrency', [
                  { label: 'INR (₹)', value: 'INR' },
                  { label: 'USD ($)', value: 'USD' },
                  { label: 'EUR (€)', value: 'EUR' }
                ])}
                {renderDropdown('Payment Frequency', form.salaryPeriod, 'salaryPeriod', [
                  { label: 'Yearly', value: 'YEARLY' },
                  { label: 'Monthly', value: 'MONTHLY' },
                  { label: 'Hourly', value: 'HOURLY' }
                ])}
              </View>
            </View>

            {/* Description */}
            <View className="bg-white p-10 rounded-[40px] border border-slate-100 shadow-xl shadow-slate-200/40">
              <Text className="text-slate-900 text-2xl font-black mb-10 tracking-tight">Role Details</Text>
              {renderInput('Job Description', form.description, 'description', 'Define the mission, technical stack, and day-to-day impact...', 'default', true, true)}
            </View>
          </View>
        </ScrollView>

        {/* Action Bar */}
        <View className="absolute bottom-0 left-0 right-0 items-center bg-[#fafaf9]/90 backdrop-blur-3xl z-30">
          <View style={{ maxWidth: 950, width: '100%' }} className="p-10 border-t border-slate-100">
            <TouchableOpacity
              onPress={handleCreate}
              disabled={loading}
              className="bg-emerald-600 py-6 rounded-[32px] items-center justify-center shadow-2xl shadow-emerald-200 active:scale-[0.98] border-b-4 border-emerald-700"
            >
              {loading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text className="text-white font-black text-sm uppercase tracking-[3px]">Deploy Listing</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
