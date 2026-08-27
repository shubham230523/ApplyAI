import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, ActivityIndicator, RefreshControl, TouchableOpacity, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Icon } from '@/components/ui/icon';
import { Application } from '@applyai/shared-types';
import { useRouter } from 'expo-router';
import { Image } from 'expo-image';

export default function ApplicationsScreen() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isMobile = width < 768;

  const fetchApplications = async () => {
    const apiUrl = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:4000';
    try {
      const response = await fetch(`${apiUrl}/api/applications`);
      if (!response.ok) throw new Error('Failed to fetch');
      const data = await response.json();
      // Ensure we have an array
      setApplications(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Fetch applications error:', error);
      setApplications([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchApplications();
  };

  const renderItem = ({ item }: { item: Application }) => (
    <TouchableOpacity
      onPress={() => router.push(`/applications/${item.id}`)}
      className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm mb-4"
    >
      <View className="flex-row items-center mb-4">
        <View className="w-12 h-12 bg-gray-50 rounded-2xl items-center justify-center border border-gray-100 overflow-hidden">
          <Image
            source={{ uri: item.companyLogoUrl }}
            style={{ width: '100%', height: '100%' }}
            contentFit="contain"
            placeholder={{ uri: `https://api.dicebear.com/7.x/initials/svg?seed=${item.companyName}` }}
          />
        </View>
        <View className="flex-1 ml-4">
          <Text className={`${isMobile ? 'text-xl' : 'text-lg'} font-bold text-gray-900`} numberOfLines={1}>{item.jobTitle}</Text>
          <Text className={`${isMobile ? 'text-base' : 'text-sm'} font-medium text-gray-500 mt-0.5`}>{item.companyName}</Text>
        </View>
        <View className={`px-3 py-1 rounded-full ${item.status === 'applied' ? 'bg-blue-50' : 'bg-gray-50'}`}>
          <Text className={`${isMobile ? 'text-[11px]' : 'text-[10px]'} font-black uppercase tracking-widest ${item.status === 'applied' ? 'text-blue-600' : 'text-gray-500'}`}>
            {item.status}
          </Text>
        </View>
      </View>

      <View className="flex-row items-center pt-3 border-t border-gray-50">
        <Icon name="mappin.circle" size={isMobile ? 14 : 12} color="#9ca3af" />
        <Text className={`${isMobile ? 'text-sm' : 'text-xs'} text-gray-400 ml-1`}>{item.location || 'Remote'}</Text>
        <Text className="text-gray-300 mx-2">•</Text>
        <Icon name="calendar" size={isMobile ? 14 : 12} color="#9ca3af" />
        <Text className={`${isMobile ? 'text-sm' : 'text-xs'} text-gray-400 ml-1`}>
          {new Date(item.appliedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
        </Text>
        <View className="flex-1" />
        <Icon name="chevron.right" size={14} color="#d1d5db" />
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={['bottom', 'left', 'right']}>
      <View className="flex-1 w-full max-w-4xl mx-auto px-4 md:px-6">
        <View className="py-8">
          <Text className="text-3xl font-black text-gray-900 tracking-tight">Applications</Text>
          <Text className="text-gray-500 mt-1 font-medium">Tracking your path to your next role</Text>
        </View>

        {loading ? (
          <View className="flex-1 justify-center items-center">
            <ActivityIndicator color="#2563eb" />
          </View>
        ) : (
          <FlatList
            data={applications}
            renderItem={renderItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ paddingBottom: 40 }}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#2563eb" />
            }
            ListEmptyComponent={
              <View className="flex-1 justify-center items-center py-20 bg-white rounded-3xl border border-dashed border-gray-200">
                <Icon name="doc.text.magnifyingglass" size={48} color="#d1d5db" />
                <Text className="text-gray-400 mt-4 font-bold text-lg">No applications yet</Text>
                <Text className="text-gray-400 mt-1">Start chatting with the assistant to apply</Text>
              </View>
            }
          />
        )}
      </View>
    </SafeAreaView>
  );
}
