// Configuración dinámica de Expo (permite inyectar la llave de Google Maps desde variables de entorno)
module.exports = ({ config }) => ({
  ...config,
  name: 'SST 360',
  slug: 'sst360',
  scheme: 'sst360',
  version: '1.0.0',
  orientation: 'portrait',
  userInterfaceStyle: 'automatic',
  newArchEnabled: true,
  ios: { supportsTablet: false, bundleIdentifier: 'com.sst360.app' },
  android: {
    package: 'com.sst360.app',
    permissions: ['CAMERA', 'ACCESS_FINE_LOCATION', 'ACCESS_COARSE_LOCATION', 'READ_MEDIA_IMAGES'],
  },
  plugins: [
    'expo-router',
    ['expo-camera', { cameraPermission: 'SST 360 necesita la cámara para registrar tu asistencia y adjuntar evidencias.' }],
    ['expo-location', { locationWhenInUsePermission: 'SST 360 necesita tu ubicación para verificar el lugar de tu marcación de asistencia.' }],
    ['expo-image-picker', { photosPermission: 'SST 360 necesita acceso a tus fotos para adjuntar evidencias.', cameraPermission: 'SST 360 necesita la cámara para tomar evidencias.' }],
  ],
  experiments: { typedRoutes: false },
  extra: { eas: { projectId: process.env.EAS_PROJECT_ID } },
})
