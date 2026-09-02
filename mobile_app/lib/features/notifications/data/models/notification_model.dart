import '../../../../features/auth/data/models/user_model.dart';

class NotificationModel {
  final String id;
  final String title;
  final String message;
  final String type;
  final String target;
  final List<String> recipients;
  final String senderId;
  final UserModel? sender;
  final DateTime startsAt;
  final DateTime? expiresAt;
  final DateTime? createdAt;
  final bool isRead; // UI-side helper field or check local read status

  NotificationModel({
    required this.id,
    required this.title,
    required this.message,
    required this.type,
    required this.target,
    required this.recipients,
    required this.senderId,
    this.sender,
    required this.startsAt,
    this.expiresAt,
    this.createdAt,
    this.isRead = false,
  });

  factory NotificationModel.fromJson(Map<String, dynamic> json) {
    String senderId = '';
    UserModel? sender;
    final rawSender = json['sender'];
    if (rawSender is Map<String, dynamic>) {
      sender = UserModel.fromJson(rawSender);
      senderId = sender.id;
    } else if (rawSender is String) {
      senderId = rawSender;
    }

    var recs = json['recipients'] as List?;
    List<String> recipientsList = [];
    if (recs != null) {
      recipientsList = recs.map((e) {
        if (e is Map) return e['_id']?.toString() ?? '';
        return e.toString();
      }).toList();
    }

    return NotificationModel(
      id: json['_id'] ?? json['id'] ?? '',
      title: json['title'] ?? '',
      message: json['message'] ?? '',
      type: json['type'] ?? 'info',
      target: json['target'] ?? 'all',
      recipients: recipientsList,
      senderId: senderId,
      sender: sender,
      startsAt: json['startsAt'] != null ? DateTime.parse(json['startsAt'].toString()) : DateTime.now(),
      expiresAt: json['expiresAt'] != null ? DateTime.tryParse(json['expiresAt'].toString()) : null,
      createdAt: json['createdAt'] != null ? DateTime.tryParse(json['createdAt'].toString()) : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      '_id': id,
      'title': title,
      'message': message,
      'type': type,
      'target': target,
      'recipients': recipients,
      'sender': sender != null ? sender!.toJson() : senderId,
      'startsAt': startsAt.toIso8601String(),
      'expiresAt': expiresAt?.toIso8601String(),
    };
  }
}
