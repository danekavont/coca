import { useEffect, useState } from "react";
import { ScrollView, StyleSheet, ActivityIndicator, View } from "react-native";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { auth } from "../lib/firebase";
import { onAuthStateChanged, User } from "firebase/auth";
import { collection, getDocs, query, where, orderBy, limit, Timestamp } from "firebase/firestore";
import { router } from "expo-router";

type Medication = {
  name: string;
  dosage: string;
  hour: number;
  minute: number;
  period: 'AM' | 'PM';
  days: boolean[];
};

type Appointment = {
  title: string;
  date: any; // Use Date or Timestamp as needed
  location?: string;
};

export default function HomeScreen() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Dummy data
  const [medications, setMedications] = useState<Medication[]>([
    {
      name: "Aspirin",
      dosage: "1 tablet",
      hour: 8,
      minute: 0,
      period: "AM",
      days: [true, true, true, true, true, false, false],
    },
    {
      name: "Vitamin D",
      dosage: "2 tablets",
      hour: 7,
      minute: 30,
      period: "AM",
      days: [true, false, true, false, true, false, true],
    },
  ]);
  const [appointments, setAppointments] = useState<Appointment[]>([
    {
      title: "Dentist Appointment",
      date: new Date(Date.now() + 86400000), // tomorrow
      location: "Smile Clinic",
    },
    {
      title: "General Checkup",
      date: new Date(Date.now() + 3 * 86400000), // in 3 days
      location: "Health Center",
    },
  ]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setLoading(false);
      // If you want to clear dummy data on logout, you can do so here
    });
    return unsubscribe;
  }, []);

  if (loading) {
    return (
      <ThemedView style={styles.section}>
        <ActivityIndicator size="large" />
      </ThemedView>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.scrollContainer}>
      <ThemedView style={[styles.section, { backgroundColor: '#f5f5f5'}]}>
        {/* Title removed */}

        {/* Incoming Medication Reminders */}
        <View style={styles.rectCard}>
          <ThemedText type="subtitle">Incoming Medication Reminders</ThemedText>
          {medications.length === 0 ? (
            <ThemedText>No medications scheduled for today.</ThemedText>
          ) : (
            medications.map((med, idx) => (
              <View key={idx} style={styles.itemRow}>
                <ThemedText style={styles.medName}>{med.name}</ThemedText>
                <ThemedText>
                  {`${med.hour.toString().padStart(2, "0")}:${med.minute.toString().padStart(2, "0")} ${med.period}`}
                  {"  "}({med.dosage})
                </ThemedText>
              </View>
            ))
          )}
        </View>

        {/* Upcoming Appointments */}
        <View style={styles.rectCard}>
          <ThemedText type="subtitle">Upcoming Appointments</ThemedText>
          {appointments.length === 0 ? (
            <ThemedText>No upcoming appointments.</ThemedText>
          ) : (
            appointments.map((appt, idx) => (
              <View key={idx} style={styles.itemRow}>
                <ThemedText style={styles.apptTitle}>{appt.title}</ThemedText>
                <ThemedText>
                  {appt.date instanceof Date
                    ? appt.date.toLocaleString()
                    : appt.date.toDate().toLocaleString()}
                  {appt.location ? ` @ ${appt.location}` : ""}
                </ThemedText>
              </View>
            ))
          )}
        </View>
      </ThemedView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContainer: {
    paddingVertical: 24,
    paddingHorizontal: 8,
  },
  container: {
    backgroundColor: '#000',
    gap: 4,
    marginBottom: 0,
  },
  section: {
    gap: 12,
    backgroundColor: '#000',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1a237e',
    textAlign: 'center',
    marginBottom: 16,
    marginTop: 16,
    letterSpacing: 0.5,
    textShadowColor: '#b3c6f7',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  rectCard: {
    backgroundColor: '#d0e4fa',
    borderRadius: 8,
    padding: 8,
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
    width: '100%',
    justifyContent: 'flex-start',
    marginVertical: 4,
    borderWidth: 1,
    borderColor: '#d0d8e0',
    minHeight: 120,
  },
  itemRow: {
    marginTop: 6,
    marginBottom: 6,
  },
  medName: {
    fontWeight: 'bold',
    fontSize: 15,
  },
  apptTitle: {
    fontWeight: 'bold',
    fontSize: 14,
  },
});
