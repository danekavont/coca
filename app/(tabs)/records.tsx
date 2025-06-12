import React, { useEffect, useState } from 'react';
import {
  View, Text, TextInput, Button, StyleSheet, FlatList,
  Image, Alert, TouchableOpacity, Modal, Pressable, ActivityIndicator,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import * as MediaLibrary from 'expo-media-library';
import NetInfo from '@react-native-community/netinfo';
import {
  collection, addDoc, updateDoc, doc, onSnapshot, getDocs
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../lib/firebase'; // adjust the path if needed

type ImageData = {
  uri: string; // local or remote
  uploadedAt: string;
  storagePath?: string;
  downloadURL?: string;
  pendingUpload?: boolean;
};

type Folder = {
  id: string;
  name: string;
  images: ImageData[];
};

export default function RecordsScreen() {
  const [folders, setFolders] = useState<Folder[]>([]);
  const [newFolderName, setNewFolderName] = useState('');
  const [showFolderInput, setShowFolderInput] = useState(false);
  const [selectedFolderIndex, setSelectedFolderIndex] = useState<number | null>(null);
  const [previewImage, setPreviewImage] = useState<ImageData | null>(null);
  const [previewIndex, setPreviewIndex] = useState<number | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // 🔌 Upload pending images when online
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      if (state.isConnected) {
        uploadPendingImages();
      }
    });
    loadFolders(); // Firestore listener
    return unsubscribe;
  }, []);

  const loadFolders = () => {
    const q = collection(db, 'folders');
    onSnapshot(q, async (snapshot) => {
      const folderData: Folder[] = [];
      for (const docSnap of snapshot.docs) {
        const folderId = docSnap.id;
        const folder = docSnap.data();
        const imagesSnap = await getDocs(collection(db, 'folders', folderId, 'images'));
        const images: ImageData[] = [];
        imagesSnap.forEach(imgDoc => {
          images.push(imgDoc.data() as ImageData);
        });
        folderData.push({ id: folderId, name: folder.name, images });
      }
      setFolders(folderData);
    });
  };

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) {
      Alert.alert('Please enter a folder name');
      return;
    }

    await addDoc(collection(db, 'folders'), {
      name: newFolderName.trim(),
    });

    setNewFolderName('');
    setShowFolderInput(false);
    Alert.alert('Folder Created', 'Your folder has been created.');
  };

  const handlePickImage = async () => {
    if (selectedFolderIndex === null) {
      Alert.alert('Please select a folder first');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 1,
    });

    if (!result.canceled && result.assets.length > 0) {
      const folder = folders[selectedFolderIndex];
      const imageUri = result.assets[0].uri;

      const metadata: ImageData = {
        uri: imageUri,
        uploadedAt: new Date().toISOString(),
        pendingUpload: true,
      };

      await addDoc(collection(db, 'folders', folder.id, 'images'), metadata);
      Alert.alert('Image Added', 'Image metadata saved offline. Will upload when online.');
    }
  };

  const uploadPendingImages = async () => {
    for (const folder of folders) {
      for (const [i, img] of folder.images.entries()) {
        if (img.pendingUpload) {
          try {
            const response = await fetch(img.uri);
            const blob = await response.blob();
            const path = `records/${folder.id}/${Date.now()}-${i}.jpg`;
            const storageRef = ref(storage, path);
            await uploadBytes(storageRef, blob);
            const url = await getDownloadURL(storageRef);

            const imageDocs = await getDocs(collection(db, 'folders', folder.id, 'images'));
            const docRef = imageDocs.docs[i].ref;

            await updateDoc(docRef, {
              storagePath: path,
              downloadURL: url,
              pendingUpload: false,
            });

            console.log(`✅ Uploaded image: ${url}`);
          } catch (err) {
            console.error(`❌ Failed to upload image: ${img.uri}`, err);
          }
        }
      }
    }
  };

  const handleDownloadImage = async () => {
    if (!previewImage?.downloadURL) {
      Alert.alert('Unavailable', 'This image is not uploaded yet.');
      return;
    }

    setIsProcessing(true);
    try {
      const filename = previewImage.downloadURL.split('/').pop()?.split('?')[0] || `record.jpg`;
      const fileUri = FileSystem.documentDirectory + filename;
      const downloadResumable = FileSystem.createDownloadResumable(previewImage.downloadURL, fileUri);
      await downloadResumable.downloadAsync();

      const asset = await MediaLibrary.createAssetAsync(fileUri);
      await MediaLibrary.createAlbumAsync('CoCa Records', asset, false);
      Alert.alert('Download complete', 'Image saved to gallery.');
    } catch (e) {
      console.error('Download failed:', e);
      Alert.alert('Error', 'Could not download image.');
    }
    setIsProcessing(false);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.mainTitle}>Medical Records</Text>

      {!showFolderInput ? (
        <Button title="Create Folder" onPress={() => setShowFolderInput(true)} />
      ) : (
        <View style={styles.folderForm}>
          <TextInput
            style={styles.input}
            placeholder="Enter folder name"
            value={newFolderName}
            onChangeText={setNewFolderName}
          />
          <Button title="Save Folder" onPress={handleCreateFolder} />
        </View>
      )}

      <FlatList
        data={folders}
        keyExtractor={(item) => item.id}
        renderItem={({ item, index }) => (
          <View style={styles.folder}>
            <TouchableOpacity
              onPress={() => setSelectedFolderIndex(index === selectedFolderIndex ? null : index)}
            >
              <Text style={[
                styles.folderName,
                index === selectedFolderIndex && styles.selectedFolderName,
              ]}>
                📁 {item.name}
              </Text>
            </TouchableOpacity>

            {index === selectedFolderIndex && (
              <View style={styles.imageGrid}>
                {item.images.length > 0 ? (
                  item.images.map((img, i) => (
                    <TouchableOpacity
                      key={i}
                      onPress={() => {
                        setPreviewImage(img);
                        setPreviewIndex(i);
                      }}
                    >
                      <Image source={{ uri: img.downloadURL || img.uri }} style={styles.image} />
                    </TouchableOpacity>
                  ))
                ) : (
                  <Text style={styles.noImages}>No images yet.</Text>
                )}
                <TouchableOpacity onPress={handlePickImage}>
                  <Text style={styles.addButton}>＋</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}
      />

      {/* Modal for preview */}
      <Modal visible={!!previewImage} transparent animationType="fade">
        <Pressable style={styles.modalOverlay} onPress={() => setPreviewImage(null)}>
          <View style={styles.modalContent}>
            {previewImage && (
              <>
                <Image source={{ uri: previewImage.downloadURL || previewImage.uri }} style={styles.modalImage} />
                <Text style={styles.modalText}>
                  Uploaded: {new Date(previewImage.uploadedAt).toLocaleString()}
                </Text>
                {isProcessing ? (
                  <ActivityIndicator color="#007AFF" />
                ) : (
                  <Button title="Download Image" onPress={handleDownloadImage} />
                )}
              </>
            )}
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  heading: { fontSize: 20, fontWeight: '600', marginBottom: 10 },
  folderForm: { marginBottom: 12 },
  input: {
    borderWidth: 1, borderColor: '#ccc', padding: 10, borderRadius: 6, marginBottom: 6,
  },
  folder: { marginBottom: 16 },
  folderName: { fontSize: 16 },
  selectedFolderName: { fontWeight: 'bold', color: '#007AFF' },
  imageGrid: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8,
  },
  image: {
    width: 80, height: 80, borderRadius: 8,
  },
  noImages: { color: '#666' },
  addButton: {
    fontSize: 30, color: '#007AFF', paddingHorizontal: 10,
  },
  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff', padding: 20, borderRadius: 12, maxWidth: '90%', alignItems: 'center',
  },
  modalImage: {
    width: 250, height: 250, resizeMode: 'contain', marginBottom: 10, borderRadius: 8,
  },
  modalText: {
    fontSize: 14, marginBottom: 10, color: '#555',
  },
  mainTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 12,
    // color: '#007AFF',
  },
});
