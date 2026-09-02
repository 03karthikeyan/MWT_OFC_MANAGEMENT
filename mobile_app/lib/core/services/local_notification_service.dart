import 'dart:convert';
import 'dart:developer';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';

class LocalNotificationService {
  static final LocalNotificationService _instance = LocalNotificationService._internal();
  factory LocalNotificationService() => _instance;
  LocalNotificationService._internal();

  static LocalNotificationService get instance => _instance;

  final FlutterLocalNotificationsPlugin _notificationsPlugin = FlutterLocalNotificationsPlugin();

  void Function(String? payload)? onNotificationTap;

  static const String _channelId = 'hrms_high_importance_channel';
  static const String _channelName = 'HRMS Alerts & Notifications';
  static const String _channelDescription = 'High-priority notifications for chats, attendance reminders, leave updates, and company announcements';

  Future<void> initialize({void Function(String? payload)? onSelectNotification}) async {
    try {
      onNotificationTap = onSelectNotification;

      const androidSettings = AndroidInitializationSettings('@mipmap/ic_launcher');
      const iosSettings = DarwinInitializationSettings(
        requestAlertPermission: true,
        requestBadgePermission: true,
        requestSoundPermission: true,
      );

      const initSettings = InitializationSettings(
        android: androidSettings,
        iOS: iosSettings,
      );

      await _notificationsPlugin.initialize(
        settings: initSettings,
        onDidReceiveNotificationResponse: (NotificationResponse response) {
          log("🔔 Local notification tapped with payload: ${response.payload}");
          if (onNotificationTap != null && response.payload != null) {
            onNotificationTap!(response.payload);
          }
        },
      );

      // Create Android Notification Channel
      final androidNotificationChannel = AndroidNotificationChannel(
        _channelId,
        _channelName,
        description: _channelDescription,
        importance: Importance.max,
        playSound: true,
        enableVibration: true,
        showBadge: true,
      );

      final androidPlugin = _notificationsPlugin
          .resolvePlatformSpecificImplementation<AndroidFlutterLocalNotificationsPlugin>();
      
      await androidPlugin?.createNotificationChannel(androidNotificationChannel);
      await androidPlugin?.requestNotificationsPermission();

      log("✅ LocalNotificationService initialized successfully with channel: $_channelId");
    } catch (e) {
      log("⚠️ LocalNotificationService init error: $e");
    }
  }

  /// Check if the app was launched by tapping a local notification from cold start
  Future<String?> getAppLaunchPayload() async {
    try {
      final launchDetails = await _notificationsPlugin.getNotificationAppLaunchDetails();
      if (launchDetails != null &&
          launchDetails.didNotificationLaunchApp &&
          launchDetails.notificationResponse != null) {
        return launchDetails.notificationResponse!.payload;
      }
    } catch (e) {
      log("⚠️ Error reading app launch payload: $e");
    }
    return null;
  }

  Future<void> showNotification({
    required int id,
    required String title,
    required String body,
    String? payload,
  }) async {
    try {
      final androidDetails = AndroidNotificationDetails(
        _channelId,
        _channelName,
        channelDescription: _channelDescription,
        importance: Importance.max,
        priority: Priority.high,
        showWhen: true,
        icon: '@mipmap/ic_launcher',
        largeIcon: const DrawableResourceAndroidBitmap('@mipmap/ic_launcher'),
        enableVibration: true,
        playSound: true,
        styleInformation: BigTextStyleInformation(
          body,
          contentTitle: title,
          summaryText: 'Media Wave HRMS',
        ),
      );

      const iosDetails = DarwinNotificationDetails(
        presentAlert: true,
        presentBadge: true,
        presentSound: true,
      );

      final notificationDetails = NotificationDetails(
        android: androidDetails,
        iOS: iosDetails,
      );

      await _notificationsPlugin.show(
        id: id,
        title: title,
        body: body,
        notificationDetails: notificationDetails,
        payload: payload,
      );
      log("🔔 Showed notification [id: $id]: $title - $body");
    } catch (e) {
      log("⚠️ Error showing local notification: $e");
    }
  }

  Future<void> showChatNotification({
    required String senderId,
    required String senderName,
    required String messageContent,
  }) async {
    final notificationId = senderId.hashCode;
    final payload = jsonEncode({
      'type': 'chat',
      'userId': senderId,
      'senderId': senderId,
      'title': senderName,
    });

    await showNotification(
      id: notificationId,
      title: '💬 $senderName',
      body: messageContent,
      payload: payload,
    );
  }

  Future<void> showEventNotification({
    required String title,
    required String body,
    required String type,
    Map<String, dynamic>? extraData,
  }) async {
    final id = DateTime.now().millisecondsSinceEpoch ~/ 1000;
    final payload = jsonEncode({
      'type': type,
      ...?extraData,
    });

    await showNotification(
      id: id,
      title: title,
      body: body,
      payload: payload,
    );
  }
}
