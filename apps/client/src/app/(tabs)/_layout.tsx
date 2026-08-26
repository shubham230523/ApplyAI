import React from 'react';
import { Tabs, Slot, Link, usePathname } from 'expo-router';
import { View, Text, TouchableOpacity, useWindowDimensions, Platform } from 'react-native';
import { Icon } from '@/components/ui/icon';

function SidebarItem({ name, icon, label, active }: { name: string, icon: any, label: string, active: boolean }) {
  return (
    <Link href={name === 'index' ? '/' : `/${name}`} asChild>
      <TouchableOpacity
        className={`flex-row items-center px-3 py-2 rounded-xl mb-1.5 ${active ? 'bg-slate-900 shadow-lg shadow-slate-200' : 'hover:bg-slate-50'}`}
      >
        <Icon
          name={icon}
          size={16}
          color={active ? '#ffffff' : '#64748b'}
        />
        <Text
          className={`ml-2.5 text-sm font-bold tracking-tight ${active ? 'text-white' : 'text-slate-600'}`}
          style={{ fontFamily: 'Geist' }}
        >
          {label}
        </Text>
      </TouchableOpacity>
    </Link>
  );
}

export default function TabsLayout() {
  const { width } = useWindowDimensions();
  const pathname = usePathname();
  const isLargeScreen = width > 768;

  if (isLargeScreen) {
    return (
      <View
        className="flex-1 flex-row bg-white overflow-hidden"
        style={Platform.OS === 'web' ? { height: '100vh' } : { flex: 1 }}
      >
        {/* Sidebar */}
        <View className="w-48 border-r border-slate-100 p-3 bg-white h-full">
          <View className="mb-6 ml-2">
            <Text className="text-base font-black text-slate-900 tracking-tighter" style={{ fontFamily: 'Geist' }}>ApplyAI</Text>
            <Text className="text-[8px] font-black text-slate-400 uppercase tracking-widest mt-0.5">Recruitment Hub</Text>
          </View>

          <View className="flex-1">
            <SidebarItem
              name="index"
              icon="sparkles.fill"
              label="Assistant"
              active={pathname === '/' || pathname === '/index'}
            />
            <SidebarItem
              name="applications"
              icon="briefcase.fill"
              label="Applications"
              active={pathname.includes('/applications')}
            />
            <SidebarItem
              name="profile"
              icon="person.fill"
              label="My Profile"
              active={pathname.includes('/profile')}
            />
          </View>

          <View className="pt-6 border-t border-slate-50">
            <TouchableOpacity className="flex-row items-center px-3 py-2 rounded-lg bg-slate-900 shadow-lg active:scale-95 transition-all">
              <Icon name="plus.circle.fill" size={13} color="white" />
              <Text className="ml-2 text-white font-bold text-[9px] uppercase tracking-widest">Update AI CV</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Content */}
        <View className="flex-1 bg-slate-50/30 h-full overflow-hidden">
          <Slot />
        </View>
      </View>
    );
  }

  return (
    <Tabs screenOptions={{
      tabBarActiveTintColor: '#2563eb',
      tabBarStyle: {
        borderTopWidth: 1,
        borderTopColor: '#f3f4f6',
        height: Platform.OS === 'ios' ? 88 : 64,
        paddingBottom: Platform.OS === 'ios' ? 28 : 12,
        paddingTop: 12,
      },
      tabBarLabelStyle: {
        fontSize: 11,
        fontWeight: 'bold',
      },
      headerShown: false,
    }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Assistant',
          tabBarIcon: ({ color }) => <Icon name="sparkles" size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="applications"
        options={{
          title: 'Applications',
          tabBarIcon: ({ color }) => <Icon name="briefcase.fill" size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color }) => <Icon name="person.fill" size={24} color={color} />,
        }}
      />
    </Tabs>
  );
}
