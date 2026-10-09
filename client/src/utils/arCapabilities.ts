/**
 * AR & Spatial Hardware Capability Checker
 * Detects WebXR immersive-ar support, camera sensors, gyroscope / deviceorientation,
 * and mobile OS (Android / iOS / Desktop) to ensure authentic AR execution and truthful fallbacks.
 */

export interface ARCapabilityReport {
  isSupported: boolean;
  hasWebXR: boolean;
  supportsImmersiveAR: boolean;
  hasCamera: boolean;
  hasOrientationSensor: boolean;
  isMobile: boolean;
  isAndroid: boolean;
  isIOS: boolean;
  mode: 'webxr' | 'spatial-camera' | 'desktop-3d';
  message: string;
}

export async function detectARCapabilities(): Promise<ARCapabilityReport> {
  const isBrowser = typeof window !== 'undefined' && typeof navigator !== 'undefined';
  if (!isBrowser) {
    return {
      isSupported: false,
      hasWebXR: false,
      supportsImmersiveAR: false,
      hasCamera: false,
      hasOrientationSensor: false,
      isMobile: false,
      isAndroid: false,
      isIOS: false,
      mode: 'desktop-3d',
      message: 'Running in non-browser environment.',
    };
  }

  const userAgent = navigator.userAgent || '';
  const isIOS = /iPad|iPhone|iPod/.test(userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const isAndroid = /android/i.test(userAgent);
  const isMobile = isIOS || isAndroid || /Mobi|Android/i.test(userAgent);

  const hasCamera = !!navigator.mediaDevices?.getUserMedia;
  const hasOrientationSensor = 'DeviceOrientationEvent' in window;

  let hasWebXR = false;
  let supportsImmersiveAR = false;

  if ('xr' in navigator && (navigator as any).xr?.isSessionSupported) {
    hasWebXR = true;
    try {
      supportsImmersiveAR = await (navigator as any).xr.isSessionSupported('immersive-ar');
    } catch (e) {
      supportsImmersiveAR = false;
    }
  }

  let mode: 'webxr' | 'spatial-camera' | 'desktop-3d' = 'desktop-3d';
  let message = '';

  if (supportsImmersiveAR) {
    mode = 'webxr';
    message = 'WebXR ARCore / ARKit Hardware detected with real surface hit-testing.';
  } else if (isMobile && hasCamera) {
    mode = 'spatial-camera';
    message = 'Mobile camera & spatial sensors active. Floor detection & spatial tracking enabled.';
  } else {
    mode = 'desktop-3d';
    message = 'Desktop browser detected. Interactive 3D Garden Space active with physical scale controls.';
  }

  return {
    isSupported: supportsImmersiveAR || (isMobile && hasCamera),
    hasWebXR,
    supportsImmersiveAR,
    hasCamera,
    hasOrientationSensor,
    isMobile,
    isAndroid,
    isIOS,
    mode,
    message,
  };
}

/**
 * iOS 13+ requires explicit permission for DeviceOrientationEvent
 */
export async function requestOrientationPermission(): Promise<boolean> {
  if (
    typeof DeviceOrientationEvent !== 'undefined' &&
    typeof (DeviceOrientationEvent as any).requestPermission === 'function'
  ) {
    try {
      const response = await (DeviceOrientationEvent as any).requestPermission();
      return response === 'granted';
    } catch (err) {
      console.warn('Orientation permission error:', err);
      return false;
    }
  }
  return true;
}
