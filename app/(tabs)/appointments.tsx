import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Button,
  StyleSheet,
  Alert,
  Platform,
  FlatList,
} from 'react-native';
import { Calendar, DateData } from 'react-native-calendars';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as Notifications from 'expo-notifications';
import type { DateTriggerInput } from 'expo-notifications';

type Appointment = {
  date: string;
  time: Date;
  title: string;
};

export default function AppointmentsScreen() {
  const [selectedDate, setSelectedDate] = useState('');
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [time, setTime] = useState(new Date());
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  // Request permissions
  useEffect(() => {
    Notifications.requestPermissionsAsync().then(({ status }) => {
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Notifications are disabled.');
      }
    });
  }, []);

  // Add or update appointment
  const handleAddAppointment = async () => {
    if (!selectedDate || !title) {
      Alert.alert('Missing Info', 'Please provide title and select date/time.');
      return;
    }

    const scheduledDateTime = new Date(
      `${selectedDate}T${time.toTimeString().slice(0, 5)}`
    );

    const trigger = {
      type: 'date',
      date: scheduledDateTime,
    } as DateTriggerInput;

    await Notifications.scheduleNotificationAsync({
      content: {
        title: `Appointment: ${title}`,
        body: `Scheduled on ${selectedDate} at ${time.toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
        })}`,
      },
      trigger,
    });

    if (editingIndex !== null) {
      const updated = [...appointments];
      updated[editingIndex] = { title, date: selectedDate, time };
      setAppointments(updated);
      setEditingIndex(null);
    } else {
      setAppointments((prev) => [...prev, { date: selectedDate, time, title }]);
    }

    setTitle('');
    setShowForm(false);
    Alert.alert('Success', 'Appointment saved!');
  };

  const filteredAppointments = appointments.filter((a) => a.date === selectedDate);

  const getMarkedDates = () => {
    const marks: Record<string, any> = {};

    appointments.forEach((appt) => {
      if (!marks[appt.date]) {
        marks[appt.date] = {
          dots: [{ color: '#007AFF' }],
        };
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

  return (
    <View style={styles.container}>
      <Text style={styles.mainTitle}>Appointments</Text>

      <Calendar
        onDayPress={(day: DateData) => setSelectedDate(day.dateString)}
        markedDates={getMarkedDates()}
        markingType="multi-dot"
      />

      {selectedDate ? (
        <>
          <Text style={styles.sectionTitle}>Appointments on {selectedDate}:</Text>
          {filteredAppointments.length > 0 ? (
            <FlatList
              data={filteredAppointments}
              keyExtractor={(item, index) => `${item.title}-${index}`}
              renderItem={({ item, index }) => (
                <View style={styles.appointmentItem}>
                  <Text
                    style={styles.appointmentText}
                    onPress={() => {
                      setTitle(item.title);
                      setTime(item.time);
                      setShowForm(true);
                      setEditingIndex(index);
                    }}
                  >
                    {item.title} — {item.time.toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </Text>
                </View>
              )}
            />
          ) : (
            <Text style={{ marginBottom: 12, color: '#777' }}>No appointments yet.</Text>
          )}
        </>
      ) : (
        <Text style={{ color: '#999', marginTop: 12 }}>Select a date to see appointments.</Text>
      )}

      {!showForm ? (
        <Button title="Add Appointment" onPress={() => setShowForm(true)} />
      ) : (
        <View style={styles.form}>
          <TextInput
            style={styles.input}
            placeholder="Appointment Title"
            value={title}
            onChangeText={setTitle}
          />

          <Button title="Select Time" onPress={() => setShowTimePicker(true)} />

          {showTimePicker && (
            <DateTimePicker
              value={time}
              mode="time"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={(_, selectedTime) => {
                setShowTimePicker(false);
                if (selectedTime) setTime(selectedTime);
              }}
            />
          )}

          <Text style={styles.preview}>
            {time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Text>

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
    // color: '#007AFF',
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
  preview: {
    marginVertical: 8,
    fontSize: 16,
    color: '#333',
  },
  form: {
    marginTop: 10,
    gap: 8,
  },
});
