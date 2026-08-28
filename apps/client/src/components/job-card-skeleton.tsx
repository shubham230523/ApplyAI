import React, { useEffect, useRef } from 'react';
import { View, Animated, Platform } from 'react-native';

export const JobCardSkeleton = () => {
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0.7,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.3,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  return (
    <Animated.View
      style={{ opacity }}
      className="bg-white rounded-[20px] p-4 border border-slate-200/60 shadow-sm h-[220px] flex-col justify-between"
    >
      <View>
        <View className="flex-row">
          <View className="mr-3 mt-1 items-center">
            {/* Checkbox Placeholder */}
            <View className="w-[22px] h-[22px] rounded-full bg-slate-100 mb-3" />
            {/* Logo Placeholder */}
            <View className="w-8 h-8 rounded-lg bg-slate-100" />
          </View>

          <View className="flex-1">
            {/* Title Placeholder */}
            <View className="h-4 bg-slate-200 rounded-md w-3/4 mb-2" />
            <View className="h-4 bg-slate-200 rounded-md w-1/2 mb-3" />

            {/* Company Placeholder */}
            <View className="h-3 bg-slate-100 rounded-md w-1/3 mb-4" />

            {/* Tags Placeholder */}
            <View className="flex-row gap-1.5 mb-3">
              <View className="h-4 w-16 bg-slate-100 rounded-md" />
              <View className="h-4 w-16 bg-slate-100 rounded-md" />
            </View>

            {/* Location/Salary Placeholder */}
            <View className="flex-row gap-1.5">
              <View className="h-4 w-20 bg-slate-50 rounded-md" />
              <View className="h-4 w-24 bg-slate-50 rounded-md" />
            </View>
          </View>
        </View>
      </View>

      {/* Button Placeholder */}
      <View className="mt-4 border-t border-slate-50 pt-3">
        <View className="bg-slate-100 w-full h-9 rounded-xl" />
      </View>
    </Animated.View>
  );
};
