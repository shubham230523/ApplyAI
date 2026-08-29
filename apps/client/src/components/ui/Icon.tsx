import React from 'react';
import { Platform } from 'react-native';
import { SymbolView, SymbolViewProps } from 'expo-symbols';
import { Ionicons } from '@expo/vector-icons';

export type IconName = SymbolViewProps['name'];

interface IconProps {
  name: IconName;
  size?: number;
  color?: string;
  className?: string;
}

// Map SF Symbols to Ionicons for Web/Android
const iconMap: Record<string, any> = {
  'doc.badge.plus': 'document-attach',
  'doc.fill.badge.plus': 'document-attach',
  'exclamationmark.circle.fill': 'alert-circle',
  'arrow.up.doc.fill': 'cloud-upload',
  'xmark': 'close',
  'checkmark.circle.fill': 'checkmark-circle',
  'circle': 'ellipse-outline',
  'mappin.and.ellipse': 'location',
  'mappin.circle': 'location',
  'calendar': 'calendar',
  'doc.text.magnifyingglass': 'search',
  'indianrupeesign.circle.fill': 'cash',
  'sparkles': 'sparkles',
  'sparkles.fill': 'sparkles',
  'briefcase.fill': 'briefcase',
  'person.fill': 'person',
  'plus.circle.fill': 'add-circle',
  'rectangle.portrait.and.arrow.right': 'log-out',
  'chevron.left': 'chevron-back',
  'square.and.arrow.up': 'share-outline',
  'cpu.fill': 'hardware-chip',
  'link': 'link',
  'line.3.horizontal': 'menu',
  'person.circle': 'person-circle',
};

export const Icon: React.FC<IconProps> = ({ name, size = 24, color = '#000', className }) => {
  if (Platform.OS === 'ios') {
    return <SymbolView name={name} size={size} tintColor={color} className={className} />;
  }

  const ioniconName = iconMap[name] || 'help-circle';
  return <Ionicons name={ioniconName} size={size} color={color} className={className} />;
};
