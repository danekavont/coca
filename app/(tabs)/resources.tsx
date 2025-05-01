import React from 'react';
import { View, Text, ScrollView, StyleSheet, Linking, TouchableOpacity, Image } from 'react-native';

const sources = [
  {
    title: 'CDC - Colorectal Cancer Overview',
    url: 'https://www.cdc.gov/cancer/colorectal/index.htm',
    image: 'https://i.imgur.com/rQVR2bO.jpg'
  },
  {
    title: 'American Cancer Society - Colorectal Cancer',
    url: 'https://www.cancer.org/cancer/colon-rectal-cancer.html',
    image: 'https://i.imgur.com/xH7NszE.png'
  },
  {
    title: 'World Health Organization - Digestive Cancers',
    url: 'https://www.who.int/news-room/fact-sheets/detail/cancer',
    image: 'https://i.imgur.com/fE5n6nt.png'
  },
  {
    title: 'National Cancer Institute - Colorectal Cancer',
    url: 'https://www.cancer.gov/types/colorectal',
    image: 'https://i.imgur.com/YeB2EWL.png'
  },
  {
    title: 'Mayo Clinic - Colon Cancer',
    url: 'https://www.mayoclinic.org/diseases-conditions/colon-cancer/symptoms-causes/syc-20353669',
    image: 'https://i.imgur.com/3p75Uby.png'
  },
  {
    title: 'Johns Hopkins Medicine - Colorectal Cancer',
    url: 'https://www.hopkinsmedicine.org/health/conditions-and-diseases/colorectal-cancer',
    image: 'https://i.imgur.com/PYShgBP.jpg'
  }
];

export default function ExploreScreen() {
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Explore: Reliable Sources on Colorectal Cancer</Text>
      {sources.map((source, index) => (
        <TouchableOpacity key={index} onPress={() => Linking.openURL(source.url)} style={styles.linkItem}>
          <Image source={{ uri: source.image }} style={styles.thumbnail} />
          <Text style={styles.linkText}>{source.title}</Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 16,
    textAlign: 'center',
  },
  linkItem: {
    marginBottom: 16,
    padding: 12,
    backgroundColor: '#f0f0f0',
    borderRadius: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  linkText: {
    fontSize: 16,
    color: '#007AFF',
    flexShrink: 1,
  },
  thumbnail: {
    width: 48,
    height: 48,
    borderRadius: 4,
    backgroundColor: '#ccc',
  },
});
