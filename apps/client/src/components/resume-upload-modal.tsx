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
  const isDesktop = width > 1024;

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

      const formData = new FormData();
      // Use fetch to get blob for compatibility with Expo's new fetch implementation
      const blobResponse = await fetch(file.uri);
      const blob = await blobResponse.blob();

      // Ensure the blob is explicitly marked as a PDF
      const pdfBlob = new Blob([blob], { type: 'application/pdf' });
      formData.append('file', pdfBlob, file.name);

      const apiUrl = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:4000';
      const response = await fetch(`${apiUrl}/api/resume/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session?.access_token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        const fullError = errorData.message ? `${errorData.error}: ${errorData.message}` : (errorData.error || 'Upload failed');
        throw new Error(fullError);
      }

      const { extractedData } = await response.json();

      // Navigate first, then close to ensure the modal state doesn't interfere
      router.push({
        pathname: '/job-form',
        params: { data: JSON.stringify(extractedData) }
      });

      setTimeout(() => {
        onClose();
      }, 100);
    } catch (err: any) {
      console.error('Upload error:', err);
      setError(err.message || 'Something went wrong during upload.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <Modal visible={visible} animationType="fade" transparent={true}>
      <View className={`flex-1 ${isDesktop ? 'justify-center items-center' : 'justify-end'} bg-slate-900/60`}>
        <View
          style={{ width: isDesktop ? 500 : '100%' }}
          className={`bg-white ${isDesktop ? 'rounded-[32px]' : 'rounded-t-[40px]'} p-8 shadow-2xl relative`}
        >
          <View className="items-center mb-6 pt-4">
            <View className="w-16 h-16 bg-indigo-50 rounded-2xl items-center justify-center mb-6">
              <Icon name="doc.badge.plus" size={32} color="#6366f1" />
            </View>
            <Text className="text-2xl font-black text-slate-900 text-center tracking-tight">Complete AI Profile</Text>
            <Text className="text-slate-500 text-center mt-2 px-4 font-medium">
              {forceMode
                ? "Profile completion is required. Upload your resume to unlock agent applications."
                : "Upload your resume to automatically extract key details and target roles instantly."}
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
            className="bg-indigo-600 py-5 rounded-2xl flex-row items-center justify-center shadow-lg shadow-indigo-100"
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

          <View className="mt-6 gap-2">
            {!forceMode && (
              <TouchableOpacity onPress={onClose} className="py-3 items-center">
                <Text className="text-slate-400 font-bold text-[10px] uppercase tracking-widest">Skip for now</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              onPress={() => {
                onClose();
                router.push('/job-form');
              }}
              className="py-3 items-center bg-slate-50 rounded-xl"
            >
              <Text className="text-slate-500 font-bold text-[10px] uppercase tracking-widest">Or fill details manually</Text>
            </TouchableOpacity>
          </View>

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
