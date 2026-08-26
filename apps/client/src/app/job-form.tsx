import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TextInput, TouchableOpacity, ActivityIndicator, KeyboardAvoidingView, Platform, useWindowDimensions, Pressable } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Icon } from '@/components/ui/icon';
import { SafeAreaView } from 'react-native-safe-area-context';
import DateTimePickerModal from "react-native-modal-datetime-picker";

interface WorkExperience {
  company: string;
  role: string;
  startDate: string;
  endDate?: string;
  isCurrent: boolean;
  location?: string;
  description: string;
}

export default function JobFormScreen() {
  const { data } = useLocalSearchParams();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const { width } = useWindowDimensions();
  const isDesktop = width > 768;

  // Form State
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    yearsExperience: '',
    skills: '',
    education: '',
    location: '',
    expectedSalary: '',
    workExperience: [] as WorkExperience[],
  });

  const [datePicker, setDatePicker] = useState<{
    visible: boolean;
    expIndex: number;
    field: 'startDate' | 'endDate';
  }>({ visible: false, expIndex: -1, field: 'startDate' });

  useEffect(() => {
    const fetchProfile = async () => {
      const apiUrl = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:4000';
      try {
        const response = await fetch(`${apiUrl}/api/profile`);
        if (response.ok) {
          const profile = await response.json();
          if (profile) {
            setForm({
              name: profile.name || '',
              email: profile.email || '',
              phone: profile.phone || '',
              yearsExperience: String(profile.yearsExperience || ''),
              skills: Array.isArray(profile.skills) ? profile.skills.join(', ') : '',
              education: Array.isArray(profile.education) ? profile.education.join(', ') : '',
              location: profile.location || '',
              expectedSalary: profile.expectedSalary || '',
              workExperience: Array.isArray(profile.workExperience) ? profile.workExperience : [],
            });
          }
        }
      } catch (e) {
        console.error('Failed to fetch profile:', e);
      }
    };

    if (data) {
      try {
        const parsed = JSON.parse(data as string);
        setForm({
          name: parsed.name || '',
          email: parsed.email || '',
          phone: parsed.phone || '',
          yearsExperience: String(parsed.yearsExperience || ''),
          skills: Array.isArray(parsed.skills) ? parsed.skills.join(', ') : '',
          education: Array.isArray(parsed.education) ? parsed.education.join(', ') : '',
          location: parsed.location || '',
          expectedSalary: '',
          workExperience: Array.isArray(parsed.workExperience) ? parsed.workExperience : [],
        });
      } catch (e) {
        console.error('Failed to parse extracted data');
      }
    } else {
      fetchProfile();
    }
  }, [data]);

  const handleSave = async () => {
    setLoading(true);
    const apiUrl = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:4000';

    try {
      const payload = {
        name: form.name,
        phone: form.phone,
        yearsExperience: parseInt(form.yearsExperience) || 0,
        skills: form.skills.split(',').map(s => s.trim()).filter(s => s !== ''),
        preferredLocations: form.location.split(',').map(s => s.trim()).filter(s => s !== ''),
        preferredSalary: parseInt(form.expectedSalary) || 0,
        workExperience: form.workExperience, // The schema doesn't explicitly list this, but it might be in the DB
      };

      const response = await fetch(`${apiUrl}/api/profile`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Profile save error:', errorText);
        throw new Error(`Server returned ${response.status}: ${errorText}`);
      }

      router.replace('/(tabs)');
    } catch (error) {
      console.error('Error saving profile:', error);
      alert('Failed to save profile. Please ensure the backend is running and supports PATCH requests.');
    } finally {
      setLoading(false);
    }
  };

  const handleDateConfirm = (date: Date) => {
    const formatted = date.toISOString().substring(0, 7); // YYYY-MM
    const newWorkExp = [...form.workExperience];
    if (datePicker.expIndex !== -1) {
      if (!newWorkExp[datePicker.expIndex]) {
         // Fallback for new empty entries
      } else {
        newWorkExp[datePicker.expIndex][datePicker.field] = formatted;
        setForm(f => ({ ...f, workExperience: newWorkExp }));
      }
    }
    setDatePicker({ ...datePicker, visible: false });
  };

  const updateExperience = (index: number, field: keyof WorkExperience, value: any) => {
    const newWorkExp = [...form.workExperience];
    newWorkExp[index] = { ...newWorkExp[index], [field]: value };
    setForm(f => ({ ...f, workExperience: newWorkExp }));
  };

  const renderDatePicker = (idx: number, field: 'startDate' | 'endDate', value: string, isCurrent?: boolean) => {
    if (Platform.OS === 'web') {
      return (
        <View className={`bg-slate-50 px-5 py-3.5 rounded-2xl border border-slate-100 flex-row justify-between items-center ${isCurrent ? 'opacity-50' : ''}`}>
          <input
            type="month"
            value={value || ''}
            disabled={isCurrent}
            onChange={(e) => updateExperience(idx, field, e.target.value)}
            style={{
              border: 'none',
              background: 'transparent',
              outline: 'none',
              width: '100%',
              height: '100%',
              fontSize: '15px',
              fontWeight: '600',
              color: isCurrent ? '#4f46e5' : '#0f172a',
              cursor: isCurrent ? 'default' : 'pointer'
            }}
          />
        </View>
      );
    }

    return (
      <Pressable
        onPress={() => !isCurrent && setDatePicker({ visible: true, expIndex: idx, field })}
        className={`bg-slate-50 px-5 py-4 rounded-2xl border border-slate-100 flex-row justify-between items-center ${isCurrent ? 'opacity-50' : ''}`}
      >
        <Text className={`font-semibold ${isCurrent ? 'text-indigo-600' : (value ? 'text-slate-900' : 'text-slate-400')}`}>
          {isCurrent ? 'Present' : (value || 'Select Date')}
        </Text>
        {!isCurrent && <Icon name="calendar" size={16} color="#6366f1" />}
      </Pressable>
    );
  };

  const addNewExperience = () => {
    setForm(f => ({
      ...f,
      workExperience: [
        { company: '', role: '', startDate: '', description: '', isCurrent: false },
        ...f.workExperience
      ]
    }));
  };

  const renderInput = (label: string, value: string, key: keyof typeof form, placeholder: string, keyboardType: any = 'default') => (
    <View className={`mb-6 ${isDesktop ? 'flex-1 mx-2' : ''}`}>
      <Text className="text-slate-400 font-bold text-[10px] uppercase tracking-widest mb-2 ml-1">{label}</Text>
      <TextInput
        value={value}
        onChangeText={(text) => setForm(f => ({ ...f, [key]: text }))}
        placeholder={placeholder}
        placeholderTextColor="#cbd5e1"
        keyboardType={keyboardType}
        className="bg-white px-5 py-4 rounded-2xl border border-slate-200/60 text-slate-900 font-semibold shadow-sm focus:border-indigo-500"
      />
    </View>
  );

  return (
    <SafeAreaView className="flex-1 bg-[#fafaf9]">
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1">
        <View className="bg-white border-b border-slate-100 items-center z-10">
          <View
            style={{ maxWidth: 1000, width: '100%' }}
            className="px-6 py-4 flex-row items-center justify-between"
          >
             <TouchableOpacity onPress={() => router.back()} className="w-10 h-10 items-center justify-center bg-white rounded-xl border border-slate-200/60 shadow-sm hover:bg-slate-50 transition-colors">
               <Icon name="chevron.left" size={16} color="#1e293b" />
             </TouchableOpacity>
             <Text className="text-lg font-bold text-slate-900 tracking-tight" style={{ fontFamily: 'Outfit' }}>Professional Profile</Text>
             <View className="w-10" />
          </View>
        </View>

        <ScrollView className="flex-1" contentContainerStyle={{ alignItems: 'center' }}>
          <View
            style={{ maxWidth: 900, width: '100%' }}
            className="px-6 pt-10 pb-40"
          >
            {/* Header Card */}
            <View className="bg-indigo-950 p-10 rounded-[40px] mb-12 shadow-2xl shadow-indigo-200/50 overflow-hidden relative">
               <View className="absolute -top-10 -right-10 w-40 h-40 bg-indigo-900/30 rounded-full" />
               <View className="relative z-10">
                 <View className="bg-indigo-500/20 self-start p-2 rounded-xl mb-4">
                   <Icon name="sparkles.fill" size={20} color="#818cf8" />
                 </View>
                 <Text className="text-white text-3xl font-bold leading-tight" style={{ fontFamily: 'Outfit' }}>Review & Verify</Text>
                 <Text className="text-indigo-200 text-base mt-3 font-medium opacity-90 max-w-xl">
                   Our AI has processed your resume. Please check if these details are correct before we start applying.
                 </Text>
               </View>
            </View>

            {/* Personal Info Card */}
            <View className="bg-white p-8 rounded-[32px] border border-slate-200/60 shadow-sm">
              <Text className="text-slate-900 text-lg font-bold mb-8">Personal Information</Text>
              <View className={isDesktop ? 'flex-row -mx-2' : ''}>
                {renderInput('Full Name', form.name, 'name', 'John Doe')}
                {renderInput('Email Address', form.email, 'email', 'john@example.com', 'email-address')}
              </View>
              <View className={isDesktop ? 'flex-row -mx-2' : ''}>
                {renderInput('Phone Number', form.phone, 'phone', '+91 9876543210', 'phone-pad')}
                {renderInput('Experience (Years)', form.yearsExperience, 'yearsExperience', '5', 'numeric')}
              </View>
            </View>

            {/* Work Experience Section */}
            <View className="mt-12">
              <View className="flex-row items-center justify-between mb-8 px-2">
                <Text className="text-slate-900 text-2xl font-bold" style={{ fontFamily: 'Outfit' }}>Work Experience</Text>
                <TouchableOpacity
                  onPress={addNewExperience}
                  className="flex-row items-center bg-indigo-50 px-5 py-2.5 rounded-2xl border border-indigo-100 shadow-sm"
                >
                  <Icon name="plus.circle.fill" size={16} color="#6366f1" />
                  <Text className="text-indigo-600 font-extrabold text-xs ml-2 tracking-widest">ADD NEW</Text>
                </TouchableOpacity>
              </View>

              {form.workExperience.length === 0 && (
                <View className="bg-white p-12 rounded-[32px] border border-dashed border-slate-200 items-center">
                  <Icon name="briefcase.fill" size={32} color="#cbd5e1" />
                  <Text className="text-slate-400 font-bold mt-4">No experience extracted yet.</Text>
                </View>
              )}

              {form.workExperience.map((exp, idx) => (
                <View key={idx} className="bg-white p-8 rounded-[32px] border border-slate-200/60 shadow-sm mb-8">
                  <View className="flex-row justify-between items-center mb-6 border-b border-slate-50 pb-4">
                     <Text className="text-indigo-600 font-black text-[10px] uppercase tracking-[3px]">Position #{form.workExperience.length - idx}</Text>
                     <TouchableOpacity onPress={() => {
                        const next = form.workExperience.filter((_, i) => i !== idx);
                        setForm(f => ({ ...f, workExperience: next }));
                     }}>
                        <Icon name="xmark" size={14} color="#f87171" />
                     </TouchableOpacity>
                  </View>

                  <View className={isDesktop ? 'flex-row -mx-2' : ''}>
                    <View className="flex-1 mx-2 mb-6">
                      <Text className="text-slate-400 font-bold text-[10px] uppercase tracking-widest mb-2 ml-1">Company</Text>
                      <TextInput
                        value={exp.company}
                        onChangeText={(t) => updateExperience(idx, 'company', t)}
                        placeholder="e.g. Google"
                        placeholderTextColor="#cbd5e1"
                        className="bg-slate-50 px-5 py-4 rounded-2xl border border-slate-100 text-slate-900 font-semibold"
                      />
                    </View>
                    <View className="flex-1 mx-2 mb-6">
                      <Text className="text-slate-400 font-bold text-[10px] uppercase tracking-widest mb-2 ml-1">Role</Text>
                      <TextInput
                        value={exp.role}
                        onChangeText={(t) => updateExperience(idx, 'role', t)}
                        placeholder="e.g. Senior Developer"
                        placeholderTextColor="#cbd5e1"
                        className="bg-slate-50 px-5 py-4 rounded-2xl border border-slate-100 text-slate-900 font-semibold"
                      />
                    </View>
                  </View>

                  <View className={isDesktop ? 'flex-row -mx-2' : ''}>
                    <View className="flex-1 mx-2 mb-6">
                      <Text className="text-slate-400 font-bold text-[10px] uppercase tracking-widest mb-2 ml-1">Start Date</Text>
                      {renderDatePicker(idx, 'startDate', exp.startDate)}
                    </View>
                    <View className="flex-1 mx-2 mb-6">
                      <Text className="text-slate-400 font-bold text-[10px] uppercase tracking-widest mb-2 ml-1">End Date</Text>
                      {renderDatePicker(idx, 'endDate', exp.endDate || '', exp.isCurrent)}
                    </View>
                  </View>

                  <View className="mb-6">
                    <Text className="text-slate-400 font-bold text-[10px] uppercase tracking-widest mb-2 ml-1">Work Description</Text>
                    <TextInput
                      value={exp.description}
                      onChangeText={(t) => updateExperience(idx, 'description', t)}
                      placeholder="Describe your impact and technologies used..."
                      placeholderTextColor="#cbd5e1"
                      multiline
                      numberOfLines={4}
                      className="bg-slate-50 px-5 py-4 rounded-2xl border border-slate-100 text-slate-900 font-medium min-h-[120px]"
                      textAlignVertical="top"
                    />
                  </View>

                  <TouchableOpacity
                    onPress={() => updateExperience(idx, 'isCurrent', !exp.isCurrent)}
                    className="flex-row items-center ml-1"
                  >
                    <View className={`w-5 h-5 rounded-md border items-center justify-center ${exp.isCurrent ? 'bg-indigo-600 border-indigo-600' : 'border-slate-300'}`}>
                      {exp.isCurrent && <Icon name="checkmark.circle.fill" size={12} color="white" />}
                    </View>
                    <Text className="ml-2 text-slate-600 font-semibold text-sm">I currently work here</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>

            {/* Career Details Card */}
            <View className="bg-white p-8 rounded-[32px] border border-slate-200/60 shadow-sm mt-8">
              <Text className="text-slate-900 text-lg font-bold mb-8">Career Details</Text>
              {renderInput('Key Skills', form.skills, 'skills', 'React, Kotlin, Swift...')}
              {renderInput('Education', form.education, 'education', 'B.Tech, Computer Science')}
              <View className={isDesktop ? 'flex-row -mx-2' : ''}>
                {renderInput('Preferred Location', form.location, 'location', 'Bangalore, Mumbai')}
                {renderInput('Expected Salary (LPA)', form.expectedSalary, 'expectedSalary', '20', 'numeric')}
              </View>
            </View>
          </View>
        </ScrollView>

        {/* Action Bar */}
        <View className="absolute bottom-0 left-0 right-0 items-center bg-[#fafaf9]/80 backdrop-blur-md">
          <View style={{ maxWidth: 900, width: '100%' }} className="p-8 border-t border-slate-100">
             <TouchableOpacity
               onPress={handleSave}
               disabled={loading}
               className="bg-indigo-600 py-5 rounded-[24px] items-center justify-center shadow-xl shadow-indigo-200 active:scale-[0.99] transition-transform"
             >
               {loading ? <ActivityIndicator color="white" /> : <Text className="text-white font-extrabold text-base uppercase tracking-widest">Finalize Profile</Text>}
             </TouchableOpacity>
          </View>
        </View>

        <DateTimePickerModal
          isVisible={datePicker.visible}
          mode="date"
          onConfirm={handleDateConfirm}
          onCancel={() => setDatePicker({ ...datePicker, visible: false })}
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
