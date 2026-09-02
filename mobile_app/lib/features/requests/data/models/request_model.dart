import '../../../../features/auth/data/models/user_model.dart';

class RequestModel {
  final String id;
  final String userId;
  final UserModel? user;
  final String? recipientId;
  final UserModel? recipient;
  final String type;
  final String subject;
  final String description;
  final String? websiteLink;
  final String status;
  final String remarks;
  final DateTime? createdAt;

  RequestModel({
    required this.id,
    required this.userId,
    this.user,
    this.recipientId,
    this.recipient,
    required this.type,
    required this.subject,
    required this.description,
    this.websiteLink,
    required this.status,
    required this.remarks,
    this.createdAt,
  });

  factory RequestModel.fromJson(Map<String, dynamic> json) {
    String userId = '';
    UserModel? user;
    final rawUser = json['userId'];
    if (rawUser is Map<String, dynamic>) {
      user = UserModel.fromJson(rawUser);
      userId = user.id;
    } else if (rawUser is String) {
      userId = rawUser;
    }

    String? recipientId;
    UserModel? recipient;
    final rawRecipient = json['recipientId'];
    if (rawRecipient is Map<String, dynamic>) {
      recipient = UserModel.fromJson(rawRecipient);
      recipientId = recipient.id;
    } else if (rawRecipient is String) {
      recipientId = rawRecipient;
    }

    return RequestModel(
      id: json['_id'] ?? json['id'] ?? '',
      userId: userId,
      user: user,
      recipientId: recipientId,
      recipient: recipient,
      type: json['type'] ?? 'Request',
      subject: json['subject'] ?? '',
      description: json['description'] ?? '',
      websiteLink: json['websiteLink'],
      status: json['status'] ?? 'Pending',
      remarks: json['remarks'] ?? '',
      createdAt: json['createdAt'] != null ? DateTime.tryParse(json['createdAt'].toString()) : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      '_id': id,
      'userId': user != null ? user!.toJson() : userId,
      'recipientId': recipient != null ? recipient!.toJson() : recipientId,
      'type': type,
      'subject': subject,
      'description': description,
      'websiteLink': websiteLink,
      'status': status,
      'remarks': remarks,
    };
  }
}
