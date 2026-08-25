import React from 'react';
import { Tabs, Slot, Link, usePathname } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { View, Text, TouchableOpacity, useWindowDimensions, Platform } from 'react-native';

function SidebarItem({ name, icon, label, active }: { name: string, icon: string, label: string, active: boolean }) {
  return (
    <Link href={name === 'index' ? '/' : `/${name}`} asChild>
      <TouchableOpacity
        className={`flex-row items-center px-4 py-3 rounded-2xl mb-2 ${active ? 'bg-slate-900 shadow-xl shadow-slate-200' : 'hover:bg-slate-50'}`}
      >
        <SymbolView
          name={icon}
          size={18}
          tintColor={active ? '#ffffff' : '#64748b'}
        />
        <Text
          className={`ml-3 text-base font-bold tracking-tight ${active ? 'text-white' : 'text-slate-600'}`}
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
        <View className="w-64 border-r border-slate-100 p-6 bg-white h-full">
          <View className="mb-8">
            <Text className="text-2xl font-black text-slate-900 tracking-tighter" style={{ fontFamily: 'Geist' }}>ApplyAI</Text>
            <Text className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mt-1">Recruitment Hub</Text>
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

          <View className="pt-8 border-t border-slate-50">
            <TouchableOpacity className="flex-row items-center px-6 py-5 rounded-[24px] bg-slate-900 shadow-2xl shadow-slate-400 active:scale-95 transition-all">
              <SymbolView name="plus.circle.fill" size={20} tintColor="white" />
              <Text className="ml-3 text-white font-black text-sm uppercase tracking-widest">Update AI CV</Text>
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
          tabBarIcon: ({ color }) => <SymbolView name="sparkles" size={24} tintColor={color} />,
        }}
      />
      <Tabs.Screen
        name="applications"
        options={{
          title: 'Applications',
          tabBarIcon: ({ color }) => <SymbolView name="briefcase.fill" size={24} tintColor={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color }) => <SymbolView name="person.fill" size={24} tintColor={color} />,
        }}
      />
    </Tabs>
  );
}
