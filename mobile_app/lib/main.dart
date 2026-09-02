import 'package:flutter/material.dart';
import 'package:flutter_native_splash/flutter_native_splash.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:hrms_app/core/network/api_client.dart';
import 'package:hrms_app/core/services/firebase_messaging_service.dart';
import 'package:hrms_app/core/services/local_notification_service.dart';
import 'app/app.dart';

void main() async {
  WidgetsBinding widgetsBinding = WidgetsFlutterBinding.ensureInitialized();
  FlutterNativeSplash.preserve(widgetsBinding: widgetsBinding);

  // Initialize Local Notifications for foreground heads-up banners
  await LocalNotificationService.instance.initialize();

  try {
    await Firebase.initializeApp();
    FirebaseMessagingService.initialize(ApiClient());
  } catch (e) {
    debugPrint("Firebase init note: $e");
  }

  runApp(const HrmsApp());
}


