import { useEffect, useState } from "react";
import { ScrollView, StyleSheet, ActivityIndicator, View } from "react-native";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { auth, db } from "../lib/firebase";
import { onAuthStateChanged, User } from "firebase/auth";
import {
  collection,
  onSnapshot,
  query,
  where,
  Timestamp,
  orderBy,
} from "firebase/firestore";

type Medication = {
  id: string;
  name: string;
  dosage: string;
  time: Timestamp;
  taken: boolean;
  userId: string;
};

type Appointment = {
  id: string;
  title: string;
  date: string;
  time: Timestamp;
  location?: string;
  attended: boolean;
  userId: string;
};

export default function HomeScreen() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [medications, setMedications] = useState<Medication[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setLoading(false);
    });
    return unsubscribeAuth;
  }, []);

  useEffect(() => {
    if (!user) return;

    const today = new Date().toISOString().split("T")[0];

    const medsRef = query(
      collection(db, "medications"),
      where("userId", "==", user.uid),
      where("date", "==", today)
    );

    const apptsRef = query(
      collection(db, "appointments"),
      where("userId", "==", user.uid),
      where("date", ">=", today),
      orderBy("date"),
      orderBy("time")
    );

    const unsubMeds = onSnapshot(medsRef, (snapshot) => {
      setMedications(
        snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Medication[]
      );
    });

    const unsubAppts = onSnapshot(apptsRef, (snapshot) => {
      setAppointments(
        snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Appointment[]
      );
    });

    return () => {
      unsubMeds();
      unsubAppts();
    };
  }, [user]);

  if (loading) {
    return (
      <ThemedView style={styles.section}>
        <ActivityIndicator size="large" />
      </ThemedView>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.scrollContainer}>
      <ThemedView style={[styles.section, { backgroundColor: "#f5f5f5" }]}>
        <View style={styles.rectCard}>
          <ThemedText type="subtitle">Today's Medication Reminders</ThemedText>
          {medications.length === 0 ? (
            <ThemedText>No medications scheduled for today.</ThemedText>
          ) : (
            medications.map((med) => {
              const time = med.time.toDate();
              const timeString = time.toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              });
              return (
                <View key={med.id} style={styles.itemRow}>
                  <ThemedText style={styles.medName}>{med.name}</ThemedText>
                  <ThemedText>
                    {timeString} ({med.dosage})
                  </ThemedText>
                </View>
              );
            })
          )}
        </View>

        <View style={styles.rectCard}>
          <ThemedText type="subtitle">Upcoming Appointments</ThemedText>
          {appointments.length === 0 ? (
            <ThemedText>No upcoming appointments.</ThemedText>
          ) : (
            appointments.map((appt) => {
              const time = appt.time.toDate();
              return (
                <View key={appt.id} style={styles.itemRow}>
                  <ThemedText style={styles.apptTitle}>{appt.title}</ThemedText>
                  <ThemedText>
                    {appt.date} at{" "}
                    {time.toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                    {appt.location ? ` @ ${appt.location}` : ""}
                  </ThemedText>
                </View>
              );
            })
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
  section: {
    gap: 12,
    backgroundColor: "#000",
  },
  rectCard: {
    backgroundColor: "#d0e4fa",
    borderRadius: 8,
    padding: 8,
    shadowColor: "#000",
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
    width: "100%",
    justifyContent: "flex-start",
    marginVertical: 4,
    borderWidth: 1,
    borderColor: "#d0d8e0",
    minHeight: 120,
  },
  itemRow: {
    marginTop: 6,
    marginBottom: 6,
  },
  medName: {
    fontWeight: "bold",
    fontSize: 15,
  },
  apptTitle: {
    fontWeight: "bold",
    fontSize: 14,
  },
});
