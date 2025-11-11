# Environment Variables Setup

This document describes the environment variables needed for the Traversium Mobile app.

## Service Base URLs

Since Traversium uses multiple microservices running on different ports, you need to configure separate base URLs for each service.

### Required Environment Variables

Create a `.env` file in the root of `TraversiumMobile` directory with the following variables:

```env
# User Service (TraversiumUserService)
# Default port: 8080
# For Android emulator: http://10.0.2.2:8080
# For iOS simulator: http://localhost:8080
# For physical devices: http://YOUR_MACHINE_IP:8080
EXPO_PUBLIC_TRAVERSIUM_USER_SERVICE_BASE=http://10.0.2.2:8080

# Trip Service (TraversiumTripService)
# Default port: 8091
EXPO_PUBLIC_TRAVERSIUM_TRIP_SERVICE_BASE=http://10.0.2.2:8091

# File Storage Service (TraversiumFileStorageService)
# Default port: 8092
EXPO_PUBLIC_TRAVERSIUM_FILE_STORAGE_SERVICE_BASE=http://10.0.2.2:8092

# Notification Service (TraversiumNotificationService)
# Default port: 8093
EXPO_PUBLIC_TRAVERSIUM_NOTIFICATION_SERVICE_BASE=http://10.0.2.2:8093

# Social Service (TraversiumSocialService)
# Default port: 8094
EXPO_PUBLIC_TRAVERSIUM_SOCIAL_SERVICE_BASE=http://10.0.2.2:8094
```

### Legacy Support

For backward compatibility, if individual service variables are not set, the app will fall back to:
- `EXPO_PUBLIC_TRAVERSIUM_API_BASE` (if set)
- Default ports based on service type

### Platform-Specific Notes

- **Android Emulator**: Use `http://10.0.2.2` to access your host machine's localhost
- **iOS Simulator**: Use `http://localhost`
- **Physical Devices**: Use your development machine's IP address (e.g., `http://192.168.1.100`)

### Example for Physical Device

If your development machine's IP is `192.168.1.100`:

```env
EXPO_PUBLIC_TRAVERSIUM_USER_SERVICE_BASE=http://192.168.1.100:8080
EXPO_PUBLIC_TRAVERSIUM_TRIP_SERVICE_BASE=http://192.168.1.100:8091
EXPO_PUBLIC_TRAVERSIUM_FILE_STORAGE_SERVICE_BASE=http://192.168.1.100:8092
EXPO_PUBLIC_TRAVERSIUM_NOTIFICATION_SERVICE_BASE=http://192.168.1.100:8093
EXPO_PUBLIC_TRAVERSIUM_SOCIAL_SERVICE_BASE=http://192.168.1.100:8094
```

