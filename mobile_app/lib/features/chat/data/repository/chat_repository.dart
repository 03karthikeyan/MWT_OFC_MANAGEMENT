import 'package:hrms_app/core/network/api_client.dart';
import 'package:hrms_app/core/network/api_constants.dart';
import '../models/chat_model.dart';

class ChatRepository {
  final ApiClient _apiClient;

  ChatRepository({ApiClient? apiClient}) : _apiClient = apiClient ?? ApiClient();

  /// Get team directory list for chat with unread badges (with fallback to /api/users/team or /api/users)
  Future<List<ChatUserModel>> getChatUsers() async {
    try {
      final response = await _apiClient.get(ApiConstants.chatUsers);
      final data = response.data;
      if (data is Map && data.containsKey('users')) {
        final list = data['users'] as List;
        return list.map((e) => ChatUserModel.fromJson(e as Map<String, dynamic>)).toList();
      }
    } catch (_) {
      // Fallback 1: Try /api/users/team
      try {
        final response = await _apiClient.get(ApiConstants.team);
        final data = response.data;
        if (data is Map && data.containsKey('team')) {
          final list = data['team'] as List;
          return list.map((e) => ChatUserModel.fromJson(e as Map<String, dynamic>)).toList();
        }
      } catch (_) {
        // Fallback 2: Try /api/users
        try {
          final response = await _apiClient.get(ApiConstants.users);
          final data = response.data;
          if (data is Map && data.containsKey('users')) {
            final list = data['users'] as List;
            return list.map((e) => ChatUserModel.fromJson(e as Map<String, dynamic>)).toList();
          }
        } catch (_) {}
      }
    }
    return [];
  }

  /// Get chat message history with a specific team member
  Future<List<ChatMessageModel>> getMessages(String otherUserId) async {
    try {
      final response = await _apiClient.get(ApiConstants.chatHistory(otherUserId));
      final data = response.data;
      if (data is Map && data.containsKey('messages')) {
        final list = data['messages'] as List;
        return list.map((e) => ChatMessageModel.fromJson(e as Map<String, dynamic>)).toList();
      }
    } catch (_) {}
    return [];
  }

  /// Send message REST fallback
  Future<ChatMessageModel> sendMessage(String receiverId, String content) async {
    final response = await _apiClient.post(
      ApiConstants.chatMessages,
      data: {
        'receiverId': receiverId,
        'content': content,
      },
    );
    final data = response.data;
    if (data is Map && data.containsKey('message')) {
      return ChatMessageModel.fromJson(data['message'] as Map<String, dynamic>);
    }
    return ChatMessageModel.fromJson(data as Map<String, dynamic>);
  }

  /// Mark conversation as read
  Future<void> markRead(String otherUserId) async {
    try {
      await _apiClient.put(ApiConstants.chatMarkRead(otherUserId));
    } catch (_) {}
  }
}
