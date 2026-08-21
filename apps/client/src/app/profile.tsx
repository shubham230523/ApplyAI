import React, { useEffect } from 'react';
import { View, Text, TextInput, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../contexts/auth';
import { supabase } from '../lib/supabase';

const profileSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  phone: z.string().optional().nullable(),
  headline: z.string().optional().nullable(),
  yearsExperience: z.number().int().min(0).nullable().default(0),
  skills: z.string().optional().nullable(), // We'll parse comma-separated skills
});

type ProfileForm = z.infer<typeof profileSchema>;

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:4000';

export default function ProfileScreen() {
  const { session } = useAuth();
  const queryClient = useQueryClient();

  const { data: profile, isLoading } = useQuery({
    queryKey: ['profile'],
    queryFn: async () => {
      const response = await fetch(`${API_URL}/api/profile`, {
        headers: {
          Authorization: `Bearer ${session?.access_token}`,
        },
      });
      if (!response.ok) throw new Error('Failed to fetch profile');
      return response.json();
    },
    enabled: !!session,
  });

  const { control, handleSubmit, reset, formState: { errors } } = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: '',
      phone: '',
      headline: '',
      yearsExperience: 0,
      skills: '',
    },
  });

  useEffect(() => {
    if (profile) {
      reset({
        name: profile.name || '',
        phone: profile.phone || '',
        headline: profile.headline || '',
        yearsExperience: profile.yearsExperience || 0,
        skills: profile.skills?.join(', ') || '',
      });
    }
  }, [profile, reset]);

  const mutation = useMutation({
    mutationFn: async (data: ProfileForm) => {
      const formattedData = {
        ...data,
        skills: data.skills?.split(',').map(s => s.trim()).filter(Boolean) || [],
      };

      const response = await fetch(`${API_URL}/api/profile`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify(formattedData),
      });

      if (!response.ok) throw new Error('Failed to update profile');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      Alert.alert('Success', 'Profile updated successfully');
    },
    onError: (error) => {
      Alert.alert('Error', error.message);
    },
  });

  if (isLoading) {
    return (
      <View className="flex-1 justify-center items-center">
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 bg-white p-6">
      <Text className="text-2xl font-bold mb-6">Your Profile</Text>

      <View className="space-y-4">
        <View>
          <Text className="text-sm font-medium text-gray-700 mb-1">Full Name</Text>
          <Controller
            control={control}
            name="name"
            render={({ field: { onChange, value } }) => (
              <TextInput
                className="p-4 bg-gray-50 border border-gray-200 rounded-xl"
                value={value}
                onChangeText={onChange}
                placeholder="John Doe"
              />
            )}
          />
          {errors.name && <Text className="text-red-500 text-xs mt-1">{errors.name.message}</Text>}
        </View>

        <View className="mt-4">
          <Text className="text-sm font-medium text-gray-700 mb-1">Headline</Text>
          <Controller
            control={control}
            name="headline"
            render={({ field: { onChange, value } }) => (
              <TextInput
                className="p-4 bg-gray-50 border border-gray-200 rounded-xl"
                value={value || ''}
                onChangeText={onChange}
                placeholder="Senior Android Developer"
              />
            )}
          />
        </View>

        <View className="mt-4">
          <Text className="text-sm font-medium text-gray-700 mb-1">Phone</Text>
          <Controller
            control={control}
            name="phone"
            render={({ field: { onChange, value } }) => (
              <TextInput
                className="p-4 bg-gray-50 border border-gray-200 rounded-xl"
                value={value || ''}
                onChangeText={onChange}
                placeholder="+91 9876543210"
                keyboardType="phone-pad"
              />
            )}
          />
        </View>

        <View className="mt-4">
          <Text className="text-sm font-medium text-gray-700 mb-1">Years of Experience</Text>
          <Controller
            control={control}
            name="yearsExperience"
            render={({ field: { onChange, value } }) => (
              <TextInput
                className="p-4 bg-gray-50 border border-gray-200 rounded-xl"
                value={value?.toString() || '0'}
                onChangeText={(text) => onChange(parseInt(text) || 0)}
                placeholder="3"
                keyboardType="numeric"
              />
            )}
          />
        </View>

        <View className="mt-4">
          <Text className="text-sm font-medium text-gray-700 mb-1">Skills (comma separated)</Text>
          <Controller
            control={control}
            name="skills"
            render={({ field: { onChange, value } }) => (
              <TextInput
                className="p-4 bg-gray-50 border border-gray-200 rounded-xl"
                value={value || ''}
                onChangeText={onChange}
                placeholder="Kotlin, React Native, Java"
              />
            )}
          />
        </View>

        <TouchableOpacity
          onPress={handleSubmit((data) => mutation.mutate(data))}
          className="bg-blue-600 p-4 rounded-xl mt-8 mb-12"
          disabled={mutation.isPending}
        >
          {mutation.isPending ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text className="text-white text-center font-bold text-lg">Save Profile</Text>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}
