import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeft, Play, Tv } from 'lucide-react-native';
import { VideoView, useVideoPlayer } from 'expo-video';
import { WebView } from 'react-native-webview';
import { useTheme } from '@/contexts/ThemeContext';
import { useLanguage } from '@/contexts/LanguageContext';

const VIDEO_URL = 'http://dub.sh/sharabtoot';

const VIDEO_HTML = `<!doctype html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0" />
  <style>
    html, body { margin: 0; padding: 0; background: #000; height: 100%; overflow: hidden; }
    video { width: 100%; height: 100%; background: #000; }
  </style>
</head>
<body>
  <video controls playsinline webkit-playsinline preload="metadata" src="${VIDEO_URL}"></video>
</body>
</html>`;

function ExpoVideoPlayer() {
  const player = useVideoPlayer(VIDEO_URL, (createdPlayer) => {
    createdPlayer.loop = false;
  });

  return (
    <VideoView
      player={player}
      style={styles.video}
      nativeControls
      allowsFullscreen
      allowsPictureInPicture
      contentFit="contain"
    />
  );
}

function WebViewVideoPlayer() {
  return (
    <WebView
      source={{ html: VIDEO_HTML }}
      style={styles.video}
      allowsFullscreenVideo
      mediaPlaybackRequiresUserAction={false}
      javaScriptEnabled
      domStorageEnabled
      testID="tv-webview-player"
    />
  );
}

export default function TVScreen() {
  const { colors, isDark } = useTheme();
  const { t, isRTL } = useLanguage();
  const [showPlayer, setShowPlayer] = useState<boolean>(false);
  const [useWebViewFallback, setUseWebViewFallback] = useState<boolean>(false);

  if (!showPlayer) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}> 
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.header}>
            <Text style={[styles.headerTitle, { color: colors.text }, isRTL && styles.rtlText]}>{t('tv')}</Text>
          </View>

          <View style={styles.episodeListContainer}>
            <TouchableOpacity
              style={[styles.episodeCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
              onPress={() => setShowPlayer(true)}
              activeOpacity={0.85}
              testID="episode-card"
            >
              <View style={[styles.episodeThumbnail, { backgroundColor: isDark ? '#0F172A' : '#111827' }]}>
                <Tv size={46} color="#F43F5E" />
                <View style={styles.playCircle}>
                  <Play size={22} color="#FFFFFF" fill="#FFFFFF" />
                </View>
              </View>

              <View style={[styles.episodeInfo, isRTL && styles.rtlRow]}>
                <View style={styles.episodeTextContainer}>
                  <Text style={[styles.showTitle, isRTL && styles.rtlText]}>شراب التوت</Text>
                  <Text style={[styles.episodeTitle, { color: colors.text }, isRTL && styles.rtlText]}>أخر حلقة</Text>
                  <Text style={[styles.episodeSubtitle, { color: colors.textSecondary }, isRTL && styles.rtlText]}>
                    {t('tapToWatch')}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View style={styles.playerContainer}>
      <SafeAreaView edges={['top']} style={styles.playerTopBar}>
        <TouchableOpacity
          onPress={() => setShowPlayer(false)}
          style={styles.backButton}
          testID="back-button"
          accessibilityRole="button"
        >
          <ChevronLeft size={28} color="#FFF" />
        </TouchableOpacity>
        <View style={styles.playerTitleContainer}>
          <Text style={styles.playerShowTitle}>شراب التوت</Text>
          <Text style={styles.playerEpTitle}>أخر حلقة</Text>
        </View>
        <View style={styles.rightSpacer} />
      </SafeAreaView>

      <View style={styles.videoWrapper}>
        {useWebViewFallback ? <WebViewVideoPlayer /> : <ExpoVideoPlayer />}

        <TouchableOpacity
          style={styles.compatibilityButton}
          onPress={() => {
            console.log('[TV] User switched to WebView compatibility player');
            setUseWebViewFallback(true);
          }}
          testID="compatibility-player-button"
        >
          <Text style={styles.compatibilityButtonText}>Open compatibility player</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },
  header: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 16 },
  headerTitle: { fontSize: 28, fontWeight: '800', letterSpacing: -0.5 },
  rtlText: { textAlign: 'right', writingDirection: 'rtl' },
  rtlRow: { flexDirection: 'row-reverse' },
  episodeListContainer: { flex: 1, paddingHorizontal: 16 },
  episodeCard: { borderWidth: 1, borderRadius: 24, overflow: 'hidden' },
  episodeThumbnail: {
    height: 210,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  playCircle: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: 'rgba(244,63,94,0.92)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  episodeInfo: { padding: 16 },
  episodeTextContainer: { gap: 6 },
  showTitle: { color: '#F43F5E', fontSize: 22, fontWeight: '800' },
  episodeTitle: { fontSize: 18, fontWeight: '700' },
  episodeSubtitle: { fontSize: 14, fontWeight: '500' },
  playerContainer: { flex: 1, backgroundColor: '#000' },
  playerTopBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingBottom: 8,
    backgroundColor: '#000',
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playerTitleContainer: { alignItems: 'center' },
  playerShowTitle: { color: '#F43F5E', fontSize: 15, fontWeight: '800' },
  playerEpTitle: { color: '#FFF', fontSize: 13, fontWeight: '600', marginTop: 2 },
  rightSpacer: { width: 40 },
  videoWrapper: { flex: 1, backgroundColor: '#000' },
  video: { flex: 1, backgroundColor: '#000' },
  compatibilityButton: {
    position: 'absolute',
    right: 14,
    bottom: 16,
    backgroundColor: 'rgba(17,24,39,0.9)',
    borderWidth: 1,
    borderColor: 'rgba(244,63,94,0.7)',
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  compatibilityButtonText: {
    color: '#F9FAFB',
    fontSize: 12,
    fontWeight: '700',
  },
  errorCard: {
    margin: 24,
    padding: 16,
    borderRadius: 14,
    backgroundColor: '#111827',
    borderWidth: 1,
    borderColor: '#374151',
  },
  errorTitle: { color: '#F9FAFB', fontSize: 16, fontWeight: '700' },
  errorSubtitle: { color: '#D1D5DB', fontSize: 13, marginTop: 8, lineHeight: 18 },
});
