import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator, Button, StyleSheet } from 'react-native';
import { Video } from 'expo-video';

// Configure these via environment or edit for local testing
const API_BASE_URL = typeof global?.API_BASE_URL !== 'undefined' ? global.API_BASE_URL : 'http://10.0.2.2:4000';
const AUTH_TOKEN = typeof global?.AUTH_TOKEN !== 'undefined' ? global.AUTH_TOKEN : 'demo-token';

export default function App() {
  const [manifestUrl, setManifestUrl] = useState(null);
  const [loading, setLoading] = useState(false);

  async function fetchManifest() {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/media/video/demo/master/manifest`, {
        headers: { Authorization: `Bearer ${AUTH_TOKEN}` },
      });
      if (!res.ok) throw new Error('Failed to fetch manifest: ' + res.status);
      const json = await res.json();
      if (!json.url) throw new Error('No url in response');
      setManifestUrl(json.url);
    } catch (err) {
      console.warn(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchManifest();
  }, []);

  return (
    <View style={styles.container}>
      {loading && <ActivityIndicator size="large" />}

      {!loading && !manifestUrl && (
        <Button title="Load Manifest" onPress={fetchManifest} />
      )}

      {manifestUrl && (
        <Video
          source={{ uri: manifestUrl }}
          useNativeControls
          shouldPlay
          resizeMode="contain"
          style={styles.video}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 16 },
  video: { width: '100%', height: 320 },
});
