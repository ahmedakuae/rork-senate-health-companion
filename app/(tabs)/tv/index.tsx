import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Platform,
  ActivityIndicator,
  Animated,
} from 'react-native';
import { Video, ResizeMode, AVPlaybackStatus } from 'expo-av';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Play,
  Pause,
  Maximize2,
  Minimize2,
  Volume2,
  VolumeX,
  RotateCcw,
  Tv,
  ChevronLeft,
} from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { useLanguage } from '@/contexts/LanguageContext';

const VIDEO_URL = 'http://dub.sh/sharabtoot';
const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function TVScreen() {
  const { colors, isDark } = useTheme();
  const { t, isRTL } = useLanguage();
  const videoRef = useRef<Video>(null);

  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [isBuffering, setIsBuffering] = useState<boolean>(true);
  const [duration, setDuration] = useState<number>(0);
  const [position, setPosition] = useState<number>(0);
  const [showControls, setShowControls] = useState<boolean>(true);
  const [hasError, setHasError] = useState<boolean>(false);
  const [showPlayer, setShowPlayer] = useState<boolean>(false);
  const [volume, setVolume] = useState<number>(1.0);

  const controlsOpacity = useRef(new Animated.Value(1)).current;
  const hideControlsTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const scheduleHideControls = useCallback(() => {
    if (hideControlsTimeout.current) {
      clearTimeout(hideControlsTimeout.current);
    }
    if (isPlaying) {
      hideControlsTimeout.current = setTimeout(() => {
        Animated.timing(controlsOpacity, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }).start(() => setShowControls(false));
      }, 4000);
    }
  }, [isPlaying, controlsOpacity]);

  const revealControls = useCallback(() => {
    setShowControls(true);
    Animated.timing(controlsOpacity, {
      toValue: 1,
      duration: 200,
      useNativeDriver: true,
    }).start();
    scheduleHideControls();
  }, [controlsOpacity, scheduleHideControls]);

  useEffect(() => {
    if (isPlaying) {
      scheduleHideControls();
    }
    return () => {
      if (hideControlsTimeout.current) {
        clearTimeout(hideControlsTimeout.current);
      }
    };
  }, [isPlaying, scheduleHideControls]);

  const onPlaybackStatusUpdate = useCallback((status: AVPlaybackStatus) => {
    if (!status.isLoaded) {
      if (status.error) {
        console.log('[TV] Playback error:', status.error);
        setHasError(true);
        setIsBuffering(false);
      }
      return;
    }
    setIsPlaying(status.isPlaying);
    setIsBuffering(status.isBuffering);
    setDuration(status.durationMillis ?? 0);
    setPosition(status.positionMillis ?? 0);
  }, []);

  const togglePlayPause = useCallback(async () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      await videoRef.current.pauseAsync();
    } else {
      await videoRef.current.playAsync();
    }
    revealControls();
  }, [isPlaying, revealControls]);

  const toggleMute = useCallback(async () => {
    if (!videoRef.current) return;
    const newMuted = !isMuted;
    setIsMuted(newMuted);
    await videoRef.current.setIsMutedAsync(newMuted);
    revealControls();
  }, [isMuted, revealControls]);

  const changeVolume = useCallback(async (delta: number) => {
    if (!videoRef.current) return;
    const newVol = Math.max(0, Math.min(1, volume + delta));
    setVolume(newVol);
    await videoRef.current.setVolumeAsync(newVol);
    if (newVol === 0) setIsMuted(true);
    else setIsMuted(false);
    revealControls();
  }, [volume, revealControls]);

  const seekRelative = useCallback(async (ms: number) => {
    if (!videoRef.current) return;
    const newPos = Math.max(0, Math.min(duration, position + ms));
    await videoRef.current.setPositionAsync(newPos);
    revealControls();
  }, [duration, position, revealControls]);

  const toggleFullscreen = useCallback(async () => {
    if (!videoRef.current) return;
    try {
      if (Platform.OS === 'web') {
        await videoRef.current.presentFullscreenPlayer();
      } else {
        await videoRef.current.presentFullscreenPlayer();
        setIsFullscreen(!isFullscreen);
      }
    } catch (e) {
      console.log('[TV] Fullscreen error:', e);
    }
    revealControls();
  }, [isFullscreen, revealControls]);

  const restart = useCallback(async () => {
    if (!videoRef.current) return;
    setHasError(false);
    try {
      await videoRef.current.setPositionAsync(0);
      await videoRef.current.playAsync();
    } catch (e) {
      console.log('[TV] Restart error:', e);
    }
    revealControls();
  }, [revealControls]);

  const handleSeek = useCallback(async (ratio: number) => {
    if (!videoRef.current || duration === 0) return;
    const newPos = Math.max(0, Math.min(duration, ratio * duration));
    await videoRef.current.setPositionAsync(newPos);
    revealControls();
  }, [duration, revealControls]);

  const formatTime = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const progress = duration > 0 ? position / duration : 0;

  if (!showPlayer) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.header}>
            <Text style={[styles.headerTitle, { color: colors.text }, isRTL && styles.rtlText]}>
              {t('tv')}
            </Text>
          </View>
          <View style={styles.episodeListContainer}>
            <TouchableOpacity
              style={[styles.episodeCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
              onPress={() => setShowPlayer(true)}
              activeOpacity={0.7}
              testID="episode-card"
            >
              <View style={[styles.episodeThumbnail, { backgroundColor: isDark ? '#1a1a2e' : '#0f0f23' }]}>
                <View style={styles.tvIconContainer}>
                  <Tv size={48} color="#e74c8b" />
                </View>
                <View style={styles.playOverlay}>
                  <View style={styles.playButton}>
                    <Play size={28} color="#FFFFFF" fill="#FFFFFF" />
                  </View>
                </View>
              </View>
              <View style={[styles.episodeInfo, isRTL && styles.rtlRow]}>
                <View style={styles.episodeTextContainer}>
                  <Text style={[styles.showTitle, { color: '#e74c8b' }, isRTL && styles.rtlText]}>
                    شراب التوت
                  </Text>
                  <Text style={[styles.episodeTitle, { color: colors.text }, isRTL && styles.rtlText]}>
                    أخر حلقة
                  </Text>
                  <Text style={[styles.episodeSubtitle, { color: colors.textSecondary }, isRTL && styles.rtlText]}>
                    {t('tapToWatch')}
                  </Text>
                </View>
                <View style={[styles.episodeBadge, { backgroundColor: '#e74c8b' }]}>
                  <Text style={styles.badgeText}>{t('newEpisode')}</Text>
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
      {!isFullscreen && (
        <SafeAreaView edges={['top']} style={styles.playerTopBar}>
          <TouchableOpacity
            onPress={() => {
              setShowPlayer(false);
              if (videoRef.current) {
                videoRef.current.pauseAsync();
              }
            }}
            style={styles.backButton}
            testID="back-button"
          >
            <ChevronLeft size={28} color="#FFF" />
          </TouchableOpacity>
          <View style={styles.playerTitleContainer}>
            <Text style={styles.playerShowTitle}>شراب التوت</Text>
            <Text style={styles.playerEpTitle}>أخر حلقة</Text>
          </View>
          <View style={{ width: 40 }} />
        </SafeAreaView>
      )}

      <TouchableOpacity
        activeOpacity={1}
        onPress={revealControls}
        style={styles.videoWrapper}
      >
        <Video
          ref={videoRef}
          source={{ uri: VIDEO_URL }}
          style={styles.video}
          resizeMode={ResizeMode.CONTAIN}
          shouldPlay={false}
          isMuted={isMuted}
          volume={volume}
          onPlaybackStatusUpdate={onPlaybackStatusUpdate}
          onError={(error) => {
            console.log('[TV] Video error:', error);
            setHasError(true);
          }}
          useNativeControls={false}
        />

        {isBuffering && !hasError && (
          <View style={styles.bufferingOverlay}>
            <ActivityIndicator size="large" color="#e74c8b" />
            <Text style={styles.bufferingText}>{t('loading')}...</Text>
          </View>
        )}

        {hasError && (
          <View style={styles.errorOverlay}>
            <Text style={styles.errorText}>{t('videoError')}</Text>
            <TouchableOpacity onPress={restart} style={styles.retryButton}>
              <RotateCcw size={20} color="#FFF" />
              <Text style={styles.retryText}>{t('retry')}</Text>
            </TouchableOpacity>
          </View>
        )}

        {showControls && !hasError && (
          <Animated.View style={[styles.controlsOverlay, { opacity: controlsOpacity }]}>
            <View style={styles.controlsCenter}>
              <TouchableOpacity onPress={() => seekRelative(-10000)} style={styles.controlBtn}>
                <RotateCcw size={24} color="#FFF" />
                <Text style={styles.seekLabel}>10</Text>
              </TouchableOpacity>

              <TouchableOpacity onPress={togglePlayPause} style={styles.playPauseBtn}>
                {isPlaying ? (
                  <Pause size={36} color="#FFF" fill="#FFF" />
                ) : (
                  <Play size={36} color="#FFF" fill="#FFF" />
                )}
              </TouchableOpacity>

              <TouchableOpacity onPress={() => seekRelative(10000)} style={[styles.controlBtn, { transform: [{ scaleX: -1 }] }]}>
                <RotateCcw size={24} color="#FFF" />
                <Text style={[styles.seekLabel, { transform: [{ scaleX: -1 }] }]}>10</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.controlsBottom}>
              <View style={styles.progressContainer}>
                <Text style={styles.timeText}>{formatTime(position)}</Text>
                <TouchableOpacity
                  style={styles.progressBarContainer}
                  activeOpacity={1}
                  onPress={(e) => {
                    const { locationX } = e.nativeEvent;
                    const barWidth = SCREEN_WIDTH - 120;
                    const ratio = Math.max(0, Math.min(1, locationX / barWidth));
                    handleSeek(ratio);
                  }}
                >
                  <View style={styles.progressBarBg}>
                    <View style={[styles.progressBarFill, { width: `${progress * 100}%` }]} />
                    <View style={[styles.progressDot, { left: `${progress * 100}%` }]} />
                  </View>
                </TouchableOpacity>
                <Text style={styles.timeText}>{formatTime(duration)}</Text>
              </View>

              <View style={styles.bottomControls}>
                <TouchableOpacity onPress={toggleMute} style={styles.bottomBtn}>
                  {isMuted || volume === 0 ? (
                    <VolumeX size={22} color="#FFF" />
                  ) : (
                    <Volume2 size={22} color="#FFF" />
                  )}
                </TouchableOpacity>

                <View style={styles.volumeBarContainer}>
                  <TouchableOpacity onPress={() => changeVolume(-0.1)} style={styles.volBtn}>
                    <Text style={styles.volBtnText}>−</Text>
                  </TouchableOpacity>
                  <View style={styles.volumeBar}>
                    <View style={[styles.volumeFill, { width: `${volume * 100}%` }]} />
                  </View>
                  <TouchableOpacity onPress={() => changeVolume(0.1)} style={styles.volBtn}>
                    <Text style={styles.volBtnText}>+</Text>
                  </TouchableOpacity>
                </View>

                <TouchableOpacity onPress={toggleFullscreen} style={styles.bottomBtn}>
                  {isFullscreen ? (
                    <Minimize2 size={22} color="#FFF" />
                  ) : (
                    <Maximize2 size={22} color="#FFF" />
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </Animated.View>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 16,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800' as const,
    letterSpacing: -0.5,
  },
  rtlText: {
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  rtlRow: {
    flexDirection: 'row-reverse',
  },
  episodeListContainer: {
    flex: 1,
    paddingHorizontal: 16,
  },
  episodeCard: {
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
  },
  episodeThumbnail: {
    width: '100%',
    aspectRatio: 16 / 9,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tvIconContainer: {
    opacity: 0.6,
  },
  playOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(231, 76, 139, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingLeft: 4,
  },
  episodeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  episodeTextContainer: {
    flex: 1,
  },
  showTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    marginBottom: 2,
  },
  episodeTitle: {
    fontSize: 15,
    fontWeight: '600' as const,
    marginBottom: 4,
  },
  episodeSubtitle: {
    fontSize: 13,
    fontWeight: '400' as const,
  },
  episodeBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    marginLeft: 12,
  },
  badgeText: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: '700' as const,
  },
  playerContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  playerTopBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingBottom: 8,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  backButton: {
    padding: 8,
  },
  playerTitleContainer: {
    flex: 1,
    alignItems: 'center',
  },
  playerShowTitle: {
    color: '#e74c8b',
    fontSize: 16,
    fontWeight: '700' as const,
  },
  playerEpTitle: {
    color: '#ccc',
    fontSize: 12,
    fontWeight: '500' as const,
  },
  videoWrapper: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
  video: {
    width: '100%',
    height: '100%',
  },
  bufferingOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  bufferingText: {
    color: '#FFF',
    marginTop: 10,
    fontSize: 14,
  },
  errorOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.7)',
  },
  errorText: {
    color: '#FFF',
    fontSize: 16,
    marginBottom: 16,
    textAlign: 'center',
    paddingHorizontal: 32,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e74c8b',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 24,
    gap: 8,
  },
  retryText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600' as const,
  },
  controlsOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  controlsCenter: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 40,
    flex: 1,
  },
  controlBtn: {
    alignItems: 'center',
    padding: 8,
  },
  seekLabel: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: '700' as const,
    marginTop: 2,
  },
  playPauseBtn: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(231, 76, 139, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingLeft: 3,
  },
  controlsBottom: {
    paddingHorizontal: 16,
    paddingBottom: Platform.OS === 'web' ? 16 : 32,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  timeText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '500' as const,
    minWidth: 44,
    textAlign: 'center',
    fontVariant: ['tabular-nums'],
  },
  progressBarContainer: {
    flex: 1,
    paddingVertical: 10,
  },
  progressBarBg: {
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 2,
    position: 'relative',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#e74c8b',
    borderRadius: 2,
  },
  progressDot: {
    position: 'absolute',
    top: -5,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#e74c8b',
    marginLeft: -7,
    borderWidth: 2,
    borderColor: '#FFF',
  },
  bottomControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  bottomBtn: {
    padding: 8,
  },
  volumeBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  volBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  volBtnText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '600' as const,
    lineHeight: 20,
  },
  volumeBar: {
    width: 80,
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 2,
  },
  volumeFill: {
    height: '100%',
    backgroundColor: '#FFF',
    borderRadius: 2,
  },
});
