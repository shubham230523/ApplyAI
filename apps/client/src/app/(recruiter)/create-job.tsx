import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TextInput, TouchableOpacity, ActivityIndicator, KeyboardAvoidingView, Platform, useWindowDimensions, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Icon } from '@/components/ui/icon';
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
      const apiUrl = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:4000';
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
    const apiUrl = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:4000';

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
        const error = await response.json();
        throw new Error(error.message || 'Failed to post job');
      }
    } catch (error: any) {
      console.error('Error creating job:', error);
      Alert.alert('Error', error.message || 'Failed to save job. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const renderInput = (label: string, value: string, key: keyof typeof form, placeholder: string, keyboardType: any = 'default', required: boolean = false, multiline: boolean = false) => (
    <View className={`mb-6 ${isDesktop && !multiline ? 'flex-1 mx-2' : ''}`}>
      <View className="flex-row items-center mb-2 ml-1">
        <Text className="text-slate-400 font-bold text-[10px] uppercase tracking-widest">{label}</Text>
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
        numberOfLines={multiline ? 6 : 1}
        className={`bg-white px-5 py-4 rounded-2xl border ${errors[key] ? 'border-red-500' : 'border-slate-200/60'} text-slate-900 font-semibold shadow-sm focus:border-emerald-500 ${multiline ? 'min-h-[150px] pt-4' : ''}`}
        textAlignVertical={multiline ? 'top' : 'center'}
      />
      {errors[key] ? <Text className="text-red-500 text-[10px] mt-1 ml-1 font-bold">{errors[key]}</Text> : null}
    </View>
  );

  const renderDropdown = (label: string, value: string, key: keyof typeof form, options: { label: string, value: string }[]) => (
    <View className={`mb-6 ${isDesktop ? 'flex-1 mx-2' : ''}`}>
      <Text className="text-slate-400 font-bold text-[10px] uppercase tracking-widest mb-2 ml-1">{label}</Text>
      <View className="bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden">
        {Platform.OS === 'web' ? (
          <select
            value={value}
            onChange={(e) => setForm(f => ({ ...f, [key]: e.target.value }))}
            style={{
              width: '100%',
              padding: '16px 20px',
              border: 'none',
              background: 'transparent',
              fontSize: '15px',
              fontWeight: '600',
              color: '#0f172a',
              outline: 'none',
              appearance: 'none'
            }}
          >
            {options.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
          </select>
        ) : (
          <View className="px-5 py-4 flex-row justify-between items-center">
            <Text className="text-slate-900 font-semibold">{options.find(o => o.value === value)?.label}</Text>
            <Icon name="chevron.left" size={12} color="#94a3b8" style={{ transform: [{ rotate: '-90deg' }] }} />
          </View>
        )}
      </View>
    </View>
  );

  return (
    <SafeAreaView className="flex-1 bg-[#fafaf9]">
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1">
        <View className="bg-white border-b border-slate-100 items-center z-10">
          <View style={{ maxWidth: 1000, width: '100%' }} className="px-6 py-4 flex-row items-center justify-between">
            <TouchableOpacity onPress={() => router.back()} className="w-10 h-10 items-center justify-center bg-white rounded-xl border border-slate-200/60 shadow-sm">
              <Icon name="chevron.left" size={16} color="#1e293b" />
            </TouchableOpacity>
            <Text className="text-lg font-bold text-slate-900 tracking-tight">Post New Job</Text>
            <View className="w-10" />
          </View>
        </View>

        <ScrollView className="flex-1" contentContainerStyle={{ alignItems: 'center' }}>
          <View style={{ maxWidth: 900, width: '100%' }} className="px-6 pt-10 pb-40">
            {/* Header */}
            <View className="bg-emerald-900 p-10 rounded-[40px] mb-12 shadow-2xl shadow-emerald-200/50 overflow-hidden relative">
              <View className="absolute -top-10 -right-10 w-40 h-40 bg-emerald-800/30 rounded-full" />
              <View className="relative z-10 flex-row items-center">
                <View className="w-20 h-20 rounded-3xl bg-white/10 items-center justify-center border border-white/20">
                  <Icon name="doc.fill.badge.plus" size={32} color="white" />
                </View>
                <View className="ml-6 flex-1">
                  <Text className="text-white text-3xl font-bold leading-tight">Create Listing</Text>
                  <Text className="text-emerald-200 text-sm mt-1 font-medium opacity-90">Find the perfect candidate for your team.</Text>
                </View>
              </View>
            </View>

            {/* Basic Info */}
            <View className="bg-white p-8 rounded-[32px] border border-slate-200/60 shadow-sm">
              <Text className="text-slate-900 text-lg font-bold mb-8">Basic Information</Text>
              {renderInput('Job Title', form.title, 'title', 'e.g. Senior Frontend Engineer', 'default', true)}
              <View className={isDesktop ? 'flex-row -mx-2' : ''}>
                {renderInput('Company Name', form.companyName, 'companyName', 'e.g. TechCorp', 'default', true)}
                {renderInput('Location', form.location, 'location', 'e.g. Bangalore or Remote', 'default', true)}
              </View>
            </View>

            {/* Classification */}
            <View className="mt-8 bg-white p-8 rounded-[32px] border border-slate-200/60 shadow-sm">
              <Text className="text-slate-900 text-lg font-bold mb-8">Classification</Text>
              <View className={isDesktop ? 'flex-row -mx-2' : ''}>
                {renderDropdown('Workplace', form.workplaceType, 'workplaceType', [
                  { label: 'Remote', value: 'REMOTE' },
                  { label: 'Hybrid', value: 'HYBRID' },
                  { label: 'On-site', value: 'ON_SITE' }
                ])}
                {renderDropdown('Employment', form.employmentType, 'employmentType', [
                  { label: 'Full Time', value: 'FULL_TIME' },
                  { label: 'Part Time', value: 'PART_TIME' },
                  { label: 'Contract', value: 'CONTRACT' },
                  { label: 'Internship', value: 'INTERNSHIP' }
                ])}
              </View>
              <View className={isDesktop ? 'flex-row -mx-2' : ''}>
                {renderDropdown('Experience', form.experienceLevel, 'experienceLevel', [
                  { label: 'Entry Level', value: 'ENTRY_LEVEL' },
                  { label: 'Mid Level', value: 'MID_LEVEL' },
                  { label: 'Senior Level', value: 'SENIOR_LEVEL' },
                  { label: 'Director / Exec', value: 'EXECUTIVE' }
                ])}
                <View className="flex-1" />
              </View>
            </View>

            {/* Compensation */}
            <View className="mt-8 bg-white p-8 rounded-[32px] border border-slate-200/60 shadow-sm">
              <Text className="text-slate-900 text-lg font-bold mb-8">Compensation (Optional)</Text>
              <View className={isDesktop ? 'flex-row -mx-2' : ''}>
                {renderInput('Min Salary', form.salaryMin, 'salaryMin', 'e.g. 10', 'numeric')}
                {renderInput('Max Salary', form.salaryMax, 'salaryMax', 'e.g. 20', 'numeric')}
              </View>
              <View className={isDesktop ? 'flex-row -mx-2' : ''}>
                {renderDropdown('Currency', form.salaryCurrency, 'salaryCurrency', [
                  { label: 'INR (₹)', value: 'INR' },
                  { label: 'USD ($)', value: 'USD' },
                  { label: 'EUR (€)', value: 'EUR' }
                ])}
                {renderDropdown('Period', form.salaryPeriod, 'salaryPeriod', [
                  { label: 'Yearly', value: 'YEARLY' },
                  { label: 'Monthly', value: 'MONTHLY' },
                  { label: 'Hourly', value: 'HOURLY' }
                ])}
              </View>
            </View>

            {/* Description */}
            <View className="mt-8 bg-white p-8 rounded-[32px] border border-slate-200/60 shadow-sm">
              <Text className="text-slate-900 text-lg font-bold mb-8">Job Description</Text>
              {renderInput('Description', form.description, 'description', 'Describe the role, responsibilities, and requirements...', 'default', true, true)}
            </View>
          </View>
        </ScrollView>

        {/* Action Bar */}
        <View className="absolute bottom-0 left-0 right-0 items-center bg-[#fafaf9]/80 backdrop-blur-md">
          <View style={{ maxWidth: 900, width: '100%' }} className="p-8 border-t border-slate-100">
            <TouchableOpacity
              onPress={handleCreate}
              disabled={loading}
              className="bg-emerald-600 py-5 rounded-[24px] items-center justify-center shadow-xl shadow-emerald-200 active:scale-[0.98]"
            >
              {loading ? <ActivityIndicator color="white" /> : <Text className="text-white font-extrabold text-base uppercase tracking-widest">Publish Job Posting</Text>}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
