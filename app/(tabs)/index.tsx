import { ScrollView, StyleSheet } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';

export default function HomeScreen() {
  return (
    <ScrollView contentContainerStyle={styles.scrollContainer}>
      <ThemedView style={[styles.section, { backgroundColor: '#f5f5f5'}]}>
        <ThemedText type="title">Welcome to CoCa</ThemedText>
      </ThemedView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContainer: {
    paddingVertical: 24,
    paddingHorizontal: 16,
  },
  container: {
    backgroundColor: '#000',
    gap: 8,
    marginBottom: 20,

  },
  section: {
    gap: 6,
    backgroundColor: '#000',
  },
});
