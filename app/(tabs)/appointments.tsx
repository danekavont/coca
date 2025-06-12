import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Button,
  StyleSheet,
  Alert,
  FlatList,
} from 'react-native';
import { Calendar, DateData } from 'react-native-calendars';
import { Picker } from '@react-native-picker/picker';
import { db, storage } from '../lib/firebase'; // adjust the path if needed
import {
  collection,
  addDoc,
  updateDoc,
  doc,
  onSnapshot,
  Timestamp,
} from 'firebase/firestore';

type Appointment = {
  id?: string;
  date: string;
  time: Date;
  title: string;
};

export default function AppointmentsScreen() {
  const [selectedDate, setSelectedDate] = useState('');
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [hour, setHour] = useState('09');
  const [minute, setMinute] = useState('00');
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'appointments'), (snapshot) => {
      const appts = snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          title: data.title,
          date: data.date,
          time: data.time.toDate(),
        };
      });
      setAppointments(appts);
    });

    return () => unsubscribe();
  }, []);

  const handleAddAppointment = async () => {
    if (!selectedDate || !title) {
      Alert.alert('Missing Info', 'Please provide title and select date/time.');
      return;
    }

    const timeString = `${hour}:${minute}`;
    const scheduledDateTime = new Date(`${selectedDate}T${timeString}`);

    const newAppointment = {
      title,
      date: selectedDate,
      time: Timestamp.fromDate(scheduledDateTime),
    };

    try {
      if (editingIndex !== null && appointments[editingIndex]?.id) {
        const id = appointments[editingIndex].id!;
        await updateDoc(doc(db, 'appointments', id), newAppointment);
        setEditingIndex(null);
      } else {
        await addDoc(collection(db, 'appointments'), newAppointment);
      }

      setTitle('');
      setShowForm(false);
      setSelectedDate('');
      Alert.alert('Success', 'Appointment saved!');
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Something went wrong saving to Firebase.');
    }
  };

  const filteredAppointments = appointments.filter((a) => a.date === selectedDate);

  const getMarkedDates = () => {
    const marks: Record<string, any> = {};
    appointments.forEach((appt) => {
      if (!marks[appt.date]) {
        marks[appt.date] = { dots: [{ color: '#007AFF' }] };
      }
    });

    if (selectedDate) {
      marks[selectedDate] = {
        ...(marks[selectedDate] || {}),
        selected: true,
        selectedColor: '#007AFF',
      };
    }

    return marks;
  };

  const generatePickerItems = (max: number) =>
    Array.from({ length: max }, (_, i) => {
      const val = i.toString().padStart(2, '0');
      return <Picker.Item key={val} label={val} value={val} />;
    });

  return (
    <View style={styles.container}>
      <Text style={styles.mainTitle}>Appointments</Text>

      <Calendar
        onDayPress={(day: DateData) => {
          setSelectedDate(day.dateString);
          setShowForm(false);
        }}
        markedDates={getMarkedDates()}
        markingType="multi-dot"
      />

      {selectedDate ? (
        <>
          <Text style={styles.sectionTitle}>Appointments on {selectedDate}:</Text>
          {filteredAppointments.length > 0 ? (
            <FlatList
              data={filteredAppointments}
              keyExtractor={(item) => item.id || `${item.title}-${item.time}`}
              renderItem={({ item, index }) => (
                <View style={styles.appointmentItem}>
                  <Text
                    style={styles.appointmentText}
                    onPress={() => {
                      setTitle(item.title);
                      setHour(item.time.getHours().toString().padStart(2, '0'));
                      setMinute(item.time.getMinutes().toString().padStart(2, '0'));
                      setShowForm(true);
                      setEditingIndex(index);
                    }}
                  >
                    {item.title} — {item.time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </Text>
                </View>
              )}
            />
          ) : (
            <Text style={{ marginBottom: 12, color: '#777' }}>No appointments yet.</Text>
          )}
          {!showForm && <Button title="Add Appointment" onPress={() => setShowForm(true)} />}
        </>
      ) : (
        <Text style={{ color: '#999', marginTop: 12 }}>Select a date to see appointments.</Text>
      )}

      {showForm && (
        <View style={styles.form}>
          <TextInput
            style={styles.input}
            placeholder="Appointment Title"
            value={title}
            onChangeText={setTitle}
          />

          <Text style={{ marginTop: 10 }}>Select Time:</Text>
          <View style={styles.pickerRow}>
            <Picker
              selectedValue={hour}
              style={styles.picker}
              onValueChange={(val) => setHour(val)}
              itemStyle={{ fontSize: 20 }}
              mode="dropdown"
            >
              {generatePickerItems(24)}
            </Picker>

            <Text style={styles.colon}>:</Text>

            <Picker
              selectedValue={minute}
              style={styles.picker}
              onValueChange={(val) => setMinute(val)}
              itemStyle={{ fontSize: 20 }}
              mode="dropdown"
            >
              {generatePickerItems(60)}
            </Picker>
          </View>

          <Button
            title={editingIndex !== null ? 'Update Appointment' : 'Save Appointment'}
            onPress={handleAddAppointment}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    gap: 12,
  },
  mainTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginVertical: 8,
  },
  appointmentItem: {
    padding: 8,
    backgroundColor: '#eee',
    borderRadius: 6,
    marginBottom: 6,
  },
  appointmentText: {
    fontSize: 15,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 10,
    borderRadius: 6,
    marginTop: 10,
  },
  form: {
    marginTop: 10,
    gap: 8,
  },
  pickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  picker: {
    flex: 1,
    height: 50,
  },
  colon: {
    fontSize: 20,
    marginHorizontal: 8,
  },
});
