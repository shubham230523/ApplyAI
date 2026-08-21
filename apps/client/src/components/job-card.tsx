import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, LayoutAnimation, Platform, UIManager } from 'react-native';
import { Image } from 'expo-image';
import { Job } from '@applyai/shared-types';
import { SymbolView } from 'expo-symbols';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface JobCardProps {
  job: Job;
  selected?: boolean;
  onToggle?: (id: string) => void;
  matchScore?: number;
}

export const JobCard: React.FC<JobCardProps> = ({ job, selected, onToggle, matchScore = 85 }) => {
  const [expanded, setExpanded] = useState(false);

  const toggleExpand = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpanded(!expanded);
  };

  return (
    <View style={[styles.card, selected && styles.selectedCard]}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => onToggle?.(job.id)}
          style={[styles.toggle, selected && styles.toggleActive]}
        >
          {selected && <SymbolView name="checkmark" size={14} tintColor="white" />}
        </TouchableOpacity>

        <View style={styles.content}>
          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <Text style={styles.title}>{job.title}</Text>
              <Text style={styles.company}>{job.company}</Text>
            </View>
            <View style={styles.scoreBadge}>
              <Text style={styles.scoreText}>{matchScore}% Match</Text>
            </View>
          </View>

          <View style={styles.detailsRow}>
            <Text style={styles.detailItem}>{job.location}</Text>
            <Text style={styles.detailItem}>•</Text>
            <Text style={styles.detailItem}>₹{job.salaryMin}-{job.salaryMax} LPA</Text>
          </View>

          <TouchableOpacity onPress={toggleExpand} style={styles.expandButton}>
            <Text style={styles.expandButtonText}>
              {expanded ? 'Show Less' : 'View Details'}
            </Text>
            <SymbolView
              name={expanded ? 'chevron.up' : 'chevron.down'}
              size={14}
              tintColor="#2563eb"
            />
          </TouchableOpacity>

          {expanded && (
            <View style={styles.expandedContent}>
              <Text style={styles.description}>{job.description}</Text>
              <View style={styles.skillsRow}>
                {job.skills?.map((skill, idx) => (
                  <View key={idx} style={styles.skillTag}>
                    <Text style={styles.skillText}>{skill}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  selectedCard: {
    borderColor: '#2563eb',
    backgroundColor: '#eff6ff',
  },
  header: {
    flexDirection: 'row',
  },
  toggle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#d1d5db',
    marginRight: 12,
    marginTop: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toggleActive: {
    backgroundColor: '#2563eb',
    borderColor: '#2563eb',
  },
  content: {
    flex: 1,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
  },
  company: {
    fontSize: 14,
    color: '#4b5563',
    marginTop: 2,
  },
  scoreBadge: {
    backgroundColor: '#dcfce7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  scoreText: {
    color: '#166534',
    fontSize: 12,
    fontWeight: '600',
  },
  detailsRow: {
    flexDirection: 'row',
    marginTop: 8,
    gap: 8,
  },
  detailItem: {
    fontSize: 13,
    color: '#6b7280',
  },
  expandButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    gap: 4,
  },
  expandButtonText: {
    color: '#2563eb',
    fontSize: 13,
    fontWeight: '600',
  },
  expandedContent: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  description: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
  },
  skillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
  },
  skillTag: {
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  skillText: {
    fontSize: 12,
    color: '#4b5563',
  },
});
