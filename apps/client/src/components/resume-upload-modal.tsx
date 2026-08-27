import React, { useState } from 'react';
import { View, Text, Modal, TouchableOpacity, ActivityIndicator, Platform, useWindowDimensions } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { useRouter } from 'expo-router';
import { Icon } from './ui/icon';
import { useAuth } from '@/contexts/auth';

interface ResumeUploadModalProps {
  visible: boolean;
  onClose: () => void;
  forceMode?: boolean;
}

export const ResumeUploadModal: React.FC<ResumeUploadModalProps> = ({ visible, onClose, forceMode = false }) => {
  const { session } = useAuth();
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isWeb = Platform.OS === 'web';
  const isLargeScreen = width > 768;

  const handlePickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/pdf',
        copyToCacheDirectory: true,
      });

      if (result.canceled) return;

      const file = result.assets[0];
      setUploading(true);
      setError(null);

      // Create FormData
      const formData = new FormData();

      // Web handle for file upload
      if (isWeb) {
        // file.file is often available on web from DocumentPicker
        const blob = await fetch(file.uri).then(r => r.blob());
        formData.append('file', blob, file.name);
      } else {
        formData.append('file', {
          uri: file.uri,
          name: file.name,
          type: file.mimeType || 'application/pdf',
        } as any);
      }

      const apiUrl = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:4000';
      const response = await fetch(`${apiUrl}/api/resume/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session?.access_token}`,
        },
        body: formData,
        // REMOVED Content-Type header to allow fetch to set boundary automatically
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Upload failed');
      }

      const { extractedData } = await response.json();

      onClose();
      // Navigate to Job Form with extracted data
      router.push({
        pathname: '/job-form',
        params: { data: JSON.stringify(extractedData) }
      });

    } catch (err: any) {
      console.error('Upload error:', err);
      setError(err.message || 'Something went wrong during upload.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={true}>
      <View className={`flex-1 ${isLargeScreen ? 'justify-center items-center' : 'justify-end'} bg-black/50`}>
        <View
          style={{ width: isLargeScreen ? 600 : '100%' }}
          className={`bg-white ${isLargeScreen ? 'rounded-[32px]' : 'rounded-t-[40px]'} p-8 pb-12 shadow-2xl relative`}
        >
          <View className="items-center mb-6">
            <View className="w-16 h-16 bg-indigo-50 rounded-full items-center justify-center mb-4">
              <Icon name="doc.badge.plus" size={32} color="#6366f1" />
            </View>
            <Text className="text-2xl font-bold text-slate-900 text-center">Complete Your Profile</Text>
            <Text className="text-slate-500 text-center mt-2 px-4">
              {forceMode
                ? "Profile completion is required to apply for jobs. Please upload your resume to continue."
                : "Upload your resume to automatically extract key details and start applying instantly."}
            </Text>
          </View>

          {error && (
            <View className="bg-red-50 p-4 rounded-2xl mb-6 border border-red-100 flex-row items-center">
              <Icon name="exclamationmark.circle.fill" size={16} color="#ef4444" />
              <Text className="text-red-600 text-[13px] ml-2 font-semibold flex-1">{error}</Text>
            </View>
          )}

          <TouchableOpacity
            onPress={handlePickDocument}
            disabled={uploading}
            className="bg-indigo-600 py-5 rounded-[20px] flex-row items-center justify-center shadow-lg shadow-indigo-200"
          >
            {uploading ? (
              <ActivityIndicator color="white" />
            ) : (
              <>
                <Icon name="arrow.up.doc.fill" size={18} color="white" />
                <Text className="text-white font-bold text-base ml-3 uppercase tracking-widest">Select PDF Resume</Text>
              </>
            )}
          </TouchableOpacity>

          {!forceMode && (
            <TouchableOpacity
              onPress={onClose}
              className="mt-4 py-4 items-center"
            >
              <Text className="text-slate-400 font-bold text-xs uppercase tracking-widest underline">Skip for now</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            onPress={() => {
              onClose();
              router.push('/job-form');
            }}
            className="mt-2 py-4 items-center"
          >
            <Text className="text-slate-400 font-bold text-xs uppercase tracking-widest">Or fill details manually</Text>
          </TouchableOpacity>

          {!forceMode && (
            <TouchableOpacity
              onPress={onClose}
              className="absolute top-6 right-6 w-10 h-10 bg-slate-50 rounded-full items-center justify-center"
            >
               <Icon name="xmark" size={14} color="#94a3b8" />
            </TouchableOpacity>
          )}
        </View>
      </View>
    </Modal>
  );
};
