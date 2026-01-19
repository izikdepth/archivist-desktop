import { useEffect } from 'react';
import { listen } from '@tauri-apps/api/event';
import { invoke } from '@tauri-apps/api/core';

interface NotificationSettings {
  sound_enabled: boolean;
  sound_on_startup: boolean;
  sound_on_peer_connect: boolean;
  sound_on_download: boolean;
  sound_volume: number;
}

// Extend Window interface for webkit prefix
interface WindowWithWebkit extends Window {
  webkitAudioContext?: typeof AudioContext;
}

// Simple notification sounds using Web Audio API
const playNotificationSound = (type: 'startup' | 'peer-connect' | 'download', volume: number) => {
  const audioContext = new (window.AudioContext || (window as unknown as WindowWithWebkit).webkitAudioContext!)();
  const oscillator = audioContext.createOscillator();
  const gainNode = audioContext.createGain();

  oscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);

  // Different frequencies for different notification types
  const frequencies: Record<typeof type, number[]> = {
    'startup': [523.25, 659.25, 783.99], // C5, E5, G5 (major chord)
    'peer-connect': [440, 554.37], // A4, C#5 (two notes)
    'download': [880, 987.77], // A5, B5 (high two notes)
  };

  const notes = frequencies[type];
  const noteDuration = 0.15;

  // Play each note in sequence
  notes.forEach((freq, index) => {
    const osc = audioContext.createOscillator();
    const gain = audioContext.createGain();

    osc.connect(gain);
    gain.connect(audioContext.destination);

    osc.frequency.value = freq;
    osc.type = 'sine';

    const startTime = audioContext.currentTime + (index * noteDuration);
    const endTime = startTime + noteDuration;

    // Set volume with envelope
    gain.gain.setValueAtTime(0, startTime);
    gain.gain.linearRampToValueAtTime(volume * 0.3, startTime + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.01, endTime);

    osc.start(startTime);
    osc.stop(endTime);
  });
};

export function useSoundNotifications() {
  useEffect(() => {
    // Skip if not in Tauri environment (e.g., during tests)
    if (typeof window === 'undefined' || !(window as { __TAURI_INTERNALS__?: unknown }).__TAURI_INTERNALS__) {
      return;
    }

    const setupListeners = async () => {
      // Fetch current notification settings
      const getSettings = async (): Promise<NotificationSettings> => {
        try {
          const config = await invoke<{ notifications: NotificationSettings }>('get_config');
          return config.notifications;
        } catch (error) {
          console.error('Failed to get notification settings:', error);
          return {
            sound_enabled: true,
            sound_on_startup: true,
            sound_on_peer_connect: true,
            sound_on_download: true,
            sound_volume: 0.5,
          };
        }
      };

      // Node startup event
      const unlistenStartup = await listen('node-started', async () => {
        const settings = await getSettings();
        if (settings.sound_enabled && settings.sound_on_startup) {
          playNotificationSound('startup', settings.sound_volume);
        }
      });

      // Peer connection event
      const unlistenPeer = await listen<string>('peer-connected', async () => {
        const settings = await getSettings();
        if (settings.sound_enabled && settings.sound_on_peer_connect) {
          playNotificationSound('peer-connect', settings.sound_volume);
        }
      });

      // File download event
      const unlistenDownload = await listen<string>('file-downloaded', async () => {
        const settings = await getSettings();
        if (settings.sound_enabled && settings.sound_on_download) {
          playNotificationSound('download', settings.sound_volume);
        }
      });

      // Cleanup function
      return () => {
        unlistenStartup();
        unlistenPeer();
        unlistenDownload();
      };
    };

    const cleanup = setupListeners();

    return () => {
      cleanup.then((fn) => fn?.());
    };
  }, []);
}
