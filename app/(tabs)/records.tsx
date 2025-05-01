import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Button,
  StyleSheet,
  FlatList,
  Image,
  Alert,
  TouchableOpacity,
  Modal,
  Pressable,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import * as MediaLibrary from 'expo-media-library';

type ImageData = {
  uri: string;
  uploadedAt: string;
};

type Folder = {
  name: string;
  images: ImageData[];
};

export default function RecordsScreen() {
  const [folders, setFolders] = useState<Folder[]>([]);
  const [newFolderName, setNewFolderName] = useState('');
  const [showFolderInput, setShowFolderInput] = useState(false);
  const [selectedFolderIndex, setSelectedFolderIndex] = useState<number | null>(null);
  const [renamingIndex, setRenamingIndex] = useState<number | null>(null);
  const [renameText, setRenameText] = useState('');
  const [previewImage, setPreviewImage] = useState<ImageData | null>(null);
  const [previewIndex, setPreviewIndex] = useState<number | null>(null);

  const handleCreateFolder = () => {
    if (!newFolderName.trim()) {
      Alert.alert('Please enter a folder name');
      return;
    }

    if (folders.find(f => f.name === newFolderName.trim())) {
      Alert.alert('Folder already exists');
      return;
    }

    setFolders([...folders, { name: newFolderName.trim(), images: [] }]);
    setNewFolderName('');
    setShowFolderInput(false);
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
      const imageUri = result.assets[0].uri;
      const updated = [...folders];
      updated[selectedFolderIndex].images.push({
        uri: imageUri,
        uploadedAt: new Date().toISOString(),
      });
      setFolders(updated);
    }
  };

  const handleDeleteFolder = (index: number) => {
    Alert.alert(
      'Delete Folder',
      `Delete "${folders[index].name}" and all its images?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            const updated = folders.filter((_, i) => i !== index);
            setFolders(updated);
            if (selectedFolderIndex === index) {
              setSelectedFolderIndex(null);
            }
          },
        },
      ]
    );
  };

  const handleDeleteImage = () => {
    if (selectedFolderIndex === null || previewIndex === null) return;
    const updated = [...folders];
    updated[selectedFolderIndex].images.splice(previewIndex, 1);
    setFolders(updated);
    setPreviewImage(null);
    setPreviewIndex(null);
  };

  const handleDownloadImage = async () => {
    if (!previewImage) return;

    const { status } = await MediaLibrary.requestPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission required', 'Enable media access to download images.');
      return;
    }

    const filename = previewImage.uri.split('/').pop() || `record-${Date.now()}.jpg`;
    const fileUri = FileSystem.documentDirectory + filename;

    await FileSystem.downloadAsync(previewImage.uri, fileUri);
    const asset = await MediaLibrary.createAssetAsync(fileUri);
    await MediaLibrary.createAlbumAsync('CoCa Records', asset, false);

    // ✅ Alert after successful download
    Alert.alert('Download complete', 'Image saved to gallery.');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Medical Records</Text>

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

      <View style={{ height: 16 }} />

      <FlatList
        data={folders}
        keyExtractor={(item) => item.name}
        renderItem={({ item, index }) => (
          <View style={styles.folder}>
            <View style={styles.folderHeader}>
              <TouchableOpacity
                onPress={() =>
                  setSelectedFolderIndex(index === selectedFolderIndex ? null : index)
                }
              >
                <Text
                  style={[
                    styles.folderName,
                    index === selectedFolderIndex && styles.selectedFolderName,
                  ]}
                >
                  📁 {item.name}
                </Text>
              </TouchableOpacity>

              {index === selectedFolderIndex && renamingIndex !== index && (
                <View style={styles.folderActions}>
                  <Button
                    title="Edit"
                    onPress={() => {
                      setRenameText(item.name);
                      setRenamingIndex(index);
                    }}
                  />
                  <Button title="Delete" onPress={() => handleDeleteFolder(index)} />
                </View>
              )}
            </View>

            {index === renamingIndex && (
              <View style={styles.renameForm}>
                <TextInput
                  style={styles.input}
                  value={renameText}
                  onChangeText={setRenameText}
                />
                <Button
                  title="Save"
                  onPress={() => {
                    const updated = [...folders];
                    updated[index].name = renameText.trim();
                    setFolders(updated);
                    setRenamingIndex(null);
                    setRenameText('');
                  }}
                />
                <Button title="Cancel" onPress={() => setRenamingIndex(null)} />
              </View>
            )}

            {index === selectedFolderIndex && (
              <View style={styles.imageGrid}>
                {item.images.length > 0 ? (
                  item.images.map((img, idx) => (
                    <TouchableOpacity
                      key={idx}
                      onPress={() => {
                        setPreviewImage(img);
                        setPreviewIndex(idx);
                      }}
                    >
                      <Image source={{ uri: img.uri }} style={styles.image} />
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

      {/* Modal for image preview */}
      <Modal visible={!!previewImage} transparent animationType="fade">
        <Pressable style={styles.modalOverlay} onPress={() => setPreviewImage(null)}>
          <View style={styles.modalContent}>
            {previewImage && (
              <>
                <Image source={{ uri: previewImage.uri }} style={styles.modalImage} />
                <Text style={styles.modalText}>
                  Uploaded: {new Date(previewImage.uploadedAt).toLocaleString()}
                </Text>
                <Button title="Download Image" onPress={handleDownloadImage} />
                <View style={{ height: 8 }} />
                <Button title="Delete Image" onPress={handleDeleteImage} color="#ff3b30" />
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
  folderForm: { marginBottom: 12, gap: 6 },
  renameForm: { gap: 6, marginTop: 6 },
  input: {
    borderWidth: 1, borderColor: '#ccc', padding: 10, borderRadius: 6,
  },
  folder: {
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingBottom: 12,
  },
  folderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  folderActions: { flexDirection: 'row', gap: 8 },
  folderName: { fontSize: 16, marginBottom: 6 },
  selectedFolderName: { fontWeight: 'bold', color: '#007AFF' },
  imageGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
    alignItems: 'center',
  },
  image: {
    width: 80,
    height: 80,
    borderRadius: 8,
  },
  noImages: {
    color: '#666',
    marginBottom: 6,
  },
  addButton: {
    fontSize: 30,
    fontWeight: '600',
    color: '#007AFF',
    paddingHorizontal: 12,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    maxWidth: '90%',
  },
  modalImage: {
    width: 250,
    height: 250,
    resizeMode: 'contain',
    marginBottom: 10,
    borderRadius: 8,
  },
  modalText: {
    fontSize: 14,
    marginBottom: 10,
    color: '#555',
  },
});
