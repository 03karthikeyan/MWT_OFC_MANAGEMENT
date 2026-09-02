import 'package:hrms_app/core/network/api_client.dart';
import 'package:hrms_app/core/network/api_constants.dart';
import '../models/notification_model.dart';

class NotificationRepository {
  final ApiClient _apiClient;

  NotificationRepository({ApiClient? apiClient}) : _apiClient = apiClient ?? ApiClient();

  Future<List<NotificationModel>> getMyNotifications() async {
    final response = await _apiClient.get(ApiConstants.myNotifications);
    final data = response.data;
    if (data is List) {
      return data.map((e) => NotificationModel.fromJson(e as Map<String, dynamic>)).toList();
    } else if (data is Map && data.containsKey('notifications')) {
      final list = data['notifications'] as List;
      return list.map((e) => NotificationModel.fromJson(e as Map<String, dynamic>)).toList();
    }
    return [];
  }

  Future<List<NotificationModel>> getAllNotifications() async {
    final response = await _apiClient.get(ApiConstants.allNotifications);
    final data = response.data;
    if (data is List) {
      return data.map((e) => NotificationModel.fromJson(e as Map<String, dynamic>)).toList();
    } else if (data is Map && data.containsKey('notifications')) {
      final list = data['notifications'] as List;
      return list.map((e) => NotificationModel.fromJson(e as Map<String, dynamic>)).toList();
    }
    return [];
  }

  Future<NotificationModel> sendNotification(Map<String, dynamic> notificationData) async {
    final response = await _apiClient.post(ApiConstants.sendNotification, data: notificationData);
    final data = response.data as Map<String, dynamic>;
    return NotificationModel.fromJson(data['notification'] ?? data);
  }

  Future<void> deleteNotification(String id) async {
    await _apiClient.delete(ApiConstants.notificationDetail(id));
  }
}
