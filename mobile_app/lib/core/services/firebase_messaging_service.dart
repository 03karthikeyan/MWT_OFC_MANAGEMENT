import 'dart:convert';
import 'dart:developer';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:permission_handler/permission_handler.dart';
import 'package:hrms_app/core/network/api_client.dart';
import 'local_notification_service.dart';

@pragma('vm:entry-point')
Future<void> _firebaseMessagingBackgroundHandler(RemoteMessage message) async {
  log("🔥 Handling background message: ${message.messageId} - ${message.data}");
}

class FirebaseMessagingService {
  static final FirebaseMessaging _fcm = FirebaseMessaging.instance;
  static void Function(String? payload)? onNotificationClick;
  static void Function(String title, String message, Map<String, dynamic> data)? onForegroundAlert;

  static Future<void> initialize(ApiClient apiClient, {
    void Function(String? payload)? onNotificationTap,
    void Function(String title, String message, Map<String, dynamic> data)? onForegroundNotification,
  }) async {
    try {
      if (onNotificationTap != null) onNotificationClick = onNotificationTap;
      if (onForegroundNotification != null) onForegroundAlert = onForegroundNotification;

      // 1. Request Android 13+ Notification Runtime Permission
      if (await Permission.notification.isDenied) {
        final status = await Permission.notification.request();
        log("🔔 Permission_handler notification status: $status");
      }

      // 2. Request Firebase Messaging permissions
      final settings = await _fcm.requestPermission(
        alert: true,
        announcement: false,
        badge: true,
        carPlay: false,
        criticalAlert: false,
        provisional: false,
        sound: true,
      );

      log("🔔 FCM Permission status: ${settings.authorizationStatus}");

      // 3. Set foreground notification presentation options
      await _fcm.setForegroundNotificationPresentationOptions(
        alert: true,
        badge: true,
        sound: true,
      );

      // 4. Register background handler
      FirebaseMessaging.onBackgroundMessage(_firebaseMessagingBackgroundHandler);

      // 5. Get FCM Token & register with backend
      final token = await _fcm.getToken();
      if (token != null) {
        log("📱 FCM Token retrieved: ${token.slice(0, 15)}...");
        await _registerTokenWithBackend(apiClient, token);
      }

      // 6. Token refresh listener
      _fcm.onTokenRefresh.listen((newToken) {
        _registerTokenWithBackend(apiClient, newToken);
      });

      // 7. Foreground notification listener
      FirebaseMessaging.onMessage.listen((RemoteMessage message) {
        log("💬 Foreground FCM Message arrived: ${message.notification?.title} - ${message.notification?.body}");

        final title = message.notification?.title ?? message.data['title'] ?? 'Media Wave HRMS';
        final body = message.notification?.body ?? message.data['message'] ?? message.data['body'] ?? '';
        final payloadData = Map<String, dynamic>.from(message.data);

        if (title.isNotEmpty || body.isNotEmpty) {
          final id = DateTime.now().millisecondsSinceEpoch ~/ 1000;
          
          // 1. Show System Heads-Up Notification
          LocalNotificationService.instance.showNotification(
            id: id,
            title: title,
            body: body,
            payload: jsonEncode(payloadData),
          );

          // 2. Trigger In-App Floating Banner Alert
          if (onForegroundAlert != null) {
            onForegroundAlert!(title, body, payloadData);
          }
        }
      });

      // 8. Notification Click when app in Background
      FirebaseMessaging.onMessageOpenedApp.listen((RemoteMessage message) {
        log("🚀 Notification tapped in background: ${message.data}");
        if (onNotificationClick != null) {
          onNotificationClick!(jsonEncode(message.data));
        }
      });

      // 9. Notification Click when app opened from Terminated State
      final initialMessage = await _fcm.getInitialMessage();
      if (initialMessage != null) {
        log("🚀 App launched from terminated state via notification: ${initialMessage.data}");
        if (onNotificationClick != null) {
          // Delay briefly to allow router to be initialized
          Future.delayed(const Duration(milliseconds: 600), () {
            onNotificationClick!(jsonEncode(initialMessage.data));
          });
        }
      }
    } catch (e) {
      log("ℹ️ FCM Initialization notice: $e");
    }
  }

  static Future<void> syncUserFcmToken(ApiClient apiClient) async {
    try {
      final token = await _fcm.getToken();
      if (token != null) {
        await _registerTokenWithBackend(apiClient, token);
      }
    } catch (_) {}
  }

  static Future<void> _registerTokenWithBackend(ApiClient apiClient, String token) async {
    try {
      await apiClient.post('/api/users/fcm-token', data: {'token': token});
      log("✅ FCM Token registered with backend");
    } catch (e) {
      // Silently catch if user is not authenticated yet
    }
  }
}

extension StringSliceExt on String {
  String slice(int start, int end) {
    if (length <= end) return this;
    return substring(start, end);
  }
}
