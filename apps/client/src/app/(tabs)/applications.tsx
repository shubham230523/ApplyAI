import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, ActivityIndicator, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Icon } from '@/components/ui/icon';

interface Application {
  id: string;
  jobTitle: string;
  company: string;
  location: string;
  status: string;
  appliedAt: string;
}

export default function ApplicationsScreen() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchApplications = async () => {
    try {
      const response = await fetch('http://localhost:4000/api/applications');
      const data = await response.json();
      setApplications(data);
    } catch (error) {
      console.error('Fetch error:', error);
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
    <View className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm mb-4">
      <View className="flex-row justify-between items-start mb-2">
        <View className="flex-1 pr-4">
          <Text className="text-lg font-bold text-gray-900">{item.jobTitle}</Text>
          <Text className="text-sm font-medium text-gray-500 mt-1">{item.company}</Text>
        </View>
        <View className={`px-3 py-1 rounded-full ${item.status === 'applied' ? 'bg-blue-50' : 'bg-gray-50'}`}>
          <Text className={`text-[10px] font-black uppercase tracking-widest ${item.status === 'applied' ? 'text-blue-600' : 'text-gray-500'}`}>
            {item.status}
          </Text>
        </View>
      </View>

      <View className="flex-row items-center mt-2">
        <Icon name="mappin.circle" size={12} color="#9ca3af" />
        <Text className="text-xs text-gray-400 ml-1">{item.location}</Text>
        <Text className="text-gray-300 mx-2">•</Text>
        <Icon name="calendar" size={12} color="#9ca3af" />
        <Text className="text-xs text-gray-400 ml-1">
          {new Date(item.appliedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
        </Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <View className="flex-1 w-full max-w-4xl mx-auto px-6">
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
