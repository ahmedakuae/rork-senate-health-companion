import React, { useRef, useCallback } from 'react';
import {
  Modal,
  View,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  StatusBar,
  Platform,
  Animated,
  PanResponder,
} from 'react-native';
import { Image } from 'expo-image';
import { X } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface ImageViewerProps {
  visible: boolean;
  imageUrl: string;
  onClose: () => void;
}

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function ImageViewer({ visible, imageUrl, onClose }: ImageViewerProps) {
  const insets = useSafeAreaInsets();
  const scale = useRef(new Animated.Value(1)).current;
  const translateX = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(0)).current;

  const baseScale = useRef(1);
  const pinchScale = useRef(1);
  const lastDistance = useRef(0);
  const lastTranslateX = useRef(0);
  const lastTranslateY = useRef(0);
  const isPinching = useRef(false);

  const resetTransform = useCallback(() => {
    baseScale.current = 1;
    pinchScale.current = 1;
    lastDistance.current = 0;
    lastTranslateX.current = 0;
    lastTranslateY.current = 0;
    isPinching.current = false;
    scale.setValue(1);
    translateX.setValue(0);
    translateY.setValue(0);
  }, [scale, translateX, translateY]);

  const getDistance = (touches: { pageX: number; pageY: number }[]) => {
    const dx = touches[0].pageX - touches[1].pageX;
    const dy = touches[0].pageY - touches[1].pageY;
    return Math.sqrt(dx * dx + dy * dy);
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return (
          Math.abs(gestureState.dx) > 2 ||
          Math.abs(gestureState.dy) > 2
        );
      },
      onPanResponderGrant: () => {},
      onPanResponderMove: (evt, gestureState) => {
        const touches = evt.nativeEvent.touches;

        if (touches.length >= 2) {
          isPinching.current = true;
          const distance = getDistance(touches as unknown as { pageX: number; pageY: number }[]);

          if (lastDistance.current === 0) {
            lastDistance.current = distance;
            return;
          }

          const newPinchScale = distance / lastDistance.current;
          const newScale = Math.max(0.5, Math.min(baseScale.current * newPinchScale, 5));
          pinchScale.current = newPinchScale;
          scale.setValue(newScale);
        } else if (!isPinching.current && baseScale.current > 1) {
          const newX = lastTranslateX.current + gestureState.dx;
          const newY = lastTranslateY.current + gestureState.dy;
          translateX.setValue(newX);
          translateY.setValue(newY);
        }
      },
      onPanResponderRelease: () => {
        if (isPinching.current) {
          baseScale.current = Math.max(0.5, Math.min(baseScale.current * pinchScale.current, 5));
          pinchScale.current = 1;
          lastDistance.current = 0;
          isPinching.current = false;

          if (baseScale.current < 1) {
            baseScale.current = 1;
            lastTranslateX.current = 0;
            lastTranslateY.current = 0;
            Animated.parallel([
              Animated.spring(scale, { toValue: 1, useNativeDriver: true }),
              Animated.spring(translateX, { toValue: 0, useNativeDriver: true }),
              Animated.spring(translateY, { toValue: 0, useNativeDriver: true }),
            ]).start();
          }
        } else {
          lastTranslateX.current = (translateX as unknown as { _value: number })._value ?? 0;
          lastTranslateY.current = (translateY as unknown as { _value: number })._value ?? 0;
        }
      },
    })
  ).current;

  const handleClose = useCallback(() => {
    resetTransform();
    onClose();
  }, [onClose, resetTransform]);

  const handleDoubleTap = useCallback(() => {
    if (baseScale.current > 1) {
      baseScale.current = 1;
      lastTranslateX.current = 0;
      lastTranslateY.current = 0;
      Animated.parallel([
        Animated.spring(scale, { toValue: 1, useNativeDriver: true }),
        Animated.spring(translateX, { toValue: 0, useNativeDriver: true }),
        Animated.spring(translateY, { toValue: 0, useNativeDriver: true }),
      ]).start();
    } else {
      baseScale.current = 2.5;
      Animated.spring(scale, { toValue: 2.5, useNativeDriver: true }).start();
    }
  }, [scale, translateX, translateY]);

  const lastTap = useRef(0);
  const handleTap = useCallback(() => {
    const now = Date.now();
    if (now - lastTap.current < 300) {
      handleDoubleTap();
    } else {
      setTimeout(() => {
        if (Date.now() - lastTap.current >= 300 && baseScale.current <= 1) {
          handleClose();
        }
      }, 300);
    }
    lastTap.current = now;
  }, [handleDoubleTap, handleClose]);

  if (!imageUrl) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        {Platform.OS !== 'web' && <StatusBar barStyle="light-content" />}
        <TouchableOpacity
          style={[styles.closeBtn, { top: insets.top + 12 }]}
          onPress={handleClose}
          activeOpacity={0.7}
          testID="image-viewer-close"
        >
          <View style={styles.closeBtnInner}>
            <X size={22} color="#FFFFFF" />
          </View>
        </TouchableOpacity>

        <Animated.View
          style={[
            styles.imageContainer,
            {
              transform: [
                { scale },
                { translateX },
                { translateY },
              ],
            },
          ]}
          {...panResponder.panHandlers}
        >
          <TouchableOpacity
            activeOpacity={1}
            onPress={handleTap}
            style={styles.imageTouchable}
          >
            <Image
              source={{ uri: imageUrl }}
              style={styles.fullImage}
              contentFit="contain"
              transition={200}
            />
          </TouchableOpacity>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.95)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeBtn: {
    position: 'absolute',
    right: 16,
    zIndex: 10,
  },
  closeBtnInner: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  imageContainer: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT * 0.75,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageTouchable: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullImage: {
    width: SCREEN_WIDTH - 16,
    height: SCREEN_HEIGHT * 0.75,
  },
});
