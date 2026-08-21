import React, { useState, useRef } from 'react';
import {
  StyleSheet,
  View,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Text,
  SafeAreaView,
} from 'react-native';
import { SymbolView } from 'expo-symbols';
import { JobCard } from '@/components/job-card';
import { Job, OrchestratorResponse } from '@applyai/shared-types';

interface Message {
  id: string;
  type: 'user' | 'bot';
  text: string;
  jobs?: Job[];
}

export default function AssistantScreen() {
  const [query, setQuery] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      type: 'bot',
      text: 'Hi! I am your AI Job Assistant. Tell me what kind of role you are looking for, and I will search the web for you.',
    },
  ]);
  const [loading, setLoading] = useState(false);
  const [selectedJobIds, setSelectedJobIds] = useState<Set<string>>(new Set());
  const [applying, setApplying] = useState(false);

  const scrollViewRef = useRef<ScrollView>(null);

  const handleToggleJob = (id: string) => {
    setSelectedJobIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleBulkApply = async () => {
    if (selectedJobIds.size === 0 || applying) return;

    setApplying(true);
    try {
      const ids = Array.from(selectedJobIds);
      // For now, loop through and apply (or use a bulk endpoint if available)
      for (const jobId of ids) {
        await fetch('http://localhost:4000/api/applications/apply', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ jobId }),
        });
      }

      alert(`Successfully applied to ${selectedJobIds.size} jobs!`);
      setSelectedJobIds(new Set());
    } catch (error) {
      alert('Failed to apply to some jobs. Please try again.');
    } finally {
      setApplying(false);
    }
  };

  const handleSend = async () => {
    if (!query.trim() || loading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      text: query,
    };

    setMessages((prev) => [...prev, userMessage]);
    setQuery('');
    setLoading(true);

    try {
      const response = await fetch('http://localhost:4000/api/orchestrator/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: userMessage.text }),
      });

      const data: OrchestratorResponse = await response.json();

      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'bot',
        text: data.message,
        jobs: data.jobs,
      };

      setMessages((prev) => [...prev, botMessage]);
    } catch (error) {
      console.error('Search error:', error);
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          type: 'bot',
          text: 'Sorry, I encountered an error while searching. Please check your backend connection.',
        },
      ]);
    } finally {
      setLoading(false);
      setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 100);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <View style={styles.header}>
          <Text style={styles.headerTitle}>ApplyAI Assistant</Text>
        </View>

        <ScrollView
          ref={scrollViewRef}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {messages.map((msg) => (
            <View
              key={msg.id}
              style={[
                styles.messageWrapper,
                msg.type === 'user' ? styles.userWrapper : styles.botWrapper,
              ]}
            >
              <View
                style={[
                  styles.messageBubble,
                  msg.type === 'user' ? styles.userBubble : styles.botBubble,
                ]}
              >
                <Text style={[styles.messageText, msg.type === 'user' && { color: 'white' }]}>
                  {msg.text}
                </Text>
              </View>

              {msg.jobs && msg.jobs.length > 0 && (
                <View style={styles.jobsList}>
                  {msg.jobs.map((job) => (
                    <JobCard
                      key={job.id}
                      job={job}
                      selected={selectedJobIds.has(job.id)}
                      onToggle={handleToggleJob}
                    />
                  ))}
                </View>
              )}
            </View>
          ))}
          {loading && (
            <View style={styles.loadingWrapper}>
              <ActivityIndicator color="#2563eb" />
              <Text style={styles.loadingText}>AI is searching the web...</Text>
            </View>
          )}
        </ScrollView>

        <View style={styles.inputArea}>
          {selectedJobIds.size > 0 && (
            <TouchableOpacity
              style={styles.bulkApplyButton}
              onPress={handleBulkApply}
              disabled={applying}
            >
              {applying ? (
                <ActivityIndicator color="white" size="small" />
              ) : (
                <>
                  <SymbolView name="paperplane.fill" size={16} tintColor="white" />
                  <Text style={styles.bulkApplyText}>Apply to {selectedJobIds.size} Jobs</Text>
                </>
              )}
            </TouchableOpacity>
          )}

          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="Ask anything (e.g. 'Find React roles in Bangalore')"
              placeholderTextColor="#9ca3af"
              value={query}
              onChangeText={setQuery}
              multiline
            />
            <TouchableOpacity
              onPress={handleSend}
              disabled={loading}
              style={[styles.sendButton, !query.trim() && { opacity: 0.5 }]}
            >
              <SymbolView name="arrow.up.circle.fill" size={32} tintColor="#2563eb" />
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    padding: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  messageWrapper: {
    maxWidth: '90%',
    marginBottom: 20,
  },
  userWrapper: {
    alignSelf: 'flex-end',
  },
  botWrapper: {
    alignSelf: 'flex-start',
  },
  messageBubble: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
  },
  userBubble: {
    backgroundColor: '#2563eb',
    borderBottomRightRadius: 4,
  },
  botBubble: {
    backgroundColor: 'white',
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  messageText: {
    fontSize: 16,
    lineHeight: 24,
    color: '#374151',
  },
  jobsList: {
    marginTop: 16,
    width: Platform.OS === 'web' ? 500 : 320,
  },
  loadingWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
  },
  loadingText: {
    marginLeft: 10,
    color: '#6b7280',
    fontSize: 14,
  },
  inputArea: {
    padding: 16,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  bulkApplyButton: {
    backgroundColor: '#059669',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 12,
    marginBottom: 12,
    gap: 8,
  },
  bulkApplyText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 15,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  input: {
    flex: 1,
    maxHeight: 100,
    fontSize: 16,
    color: '#111827',
    paddingTop: 8,
    paddingBottom: 8,
  },
  sendButton: {
    marginLeft: 8,
  },
});
