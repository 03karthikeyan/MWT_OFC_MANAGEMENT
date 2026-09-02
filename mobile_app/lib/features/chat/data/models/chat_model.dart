import '../../../auth/data/models/user_model.dart';

class ChatMessageModel {
  final String id;
  final String senderId;
  final UserModel? sender;
  final String receiverId;
  final UserModel? receiver;
  final String content;
  final bool read;
  final DateTime createdAt;

  ChatMessageModel({
    required this.id,
    required this.senderId,
    this.sender,
    required this.receiverId,
    this.receiver,
    required this.content,
    required this.read,
    required this.createdAt,
  });

  factory ChatMessageModel.fromJson(Map<String, dynamic> json) {
    String senderId = '';
    UserModel? sender;
    final rawSender = json['senderId'];
    if (rawSender is Map<String, dynamic>) {
      sender = UserModel.fromJson(rawSender);
      senderId = sender.id;
    } else if (rawSender != null) {
      senderId = rawSender.toString();
    }

    String receiverId = '';
    UserModel? receiver;
    final rawReceiver = json['receiverId'];
    if (rawReceiver is Map<String, dynamic>) {
      receiver = UserModel.fromJson(rawReceiver);
      receiverId = receiver.id;
    } else if (rawReceiver != null) {
      receiverId = rawReceiver.toString();
    }

    return ChatMessageModel(
      id: json['_id']?.toString() ?? json['id']?.toString() ?? '',
      senderId: senderId,
      sender: sender,
      receiverId: receiverId,
      receiver: receiver,
      content: json['content']?.toString() ?? '',
      read: json['read'] == true,
      createdAt: json['createdAt'] != null
          ? DateTime.tryParse(json['createdAt'].toString())?.toLocal() ?? DateTime.now()
          : DateTime.now(),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      '_id': id,
      'senderId': sender != null ? sender!.toJson() : senderId,
      'receiverId': receiver != null ? receiver!.toJson() : receiverId,
      'content': content,
      'read': read,
      'createdAt': createdAt.toIso8601String(),
    };
  }
}

class ChatUserModel {
  final String id;
  final String name;
  final String username;
  final String role;
  final String jobRole;
  final String department;
  final String? profilePicture;
  final String? lastMessage;
  final DateTime? lastMessageTime;
  final int unreadCount;
  final bool isOnline;

  ChatUserModel({
    required this.id,
    required this.name,
    required this.username,
    required this.role,
    required this.jobRole,
    required this.department,
    this.profilePicture,
    this.lastMessage,
    this.lastMessageTime,
    required this.unreadCount,
    this.isOnline = false,
  });

  factory ChatUserModel.fromJson(Map<String, dynamic> json) {
    return ChatUserModel(
      id: json['_id']?.toString() ?? json['id']?.toString() ?? '',
      name: json['name']?.toString() ?? '',
      username: json['username']?.toString() ?? '',
      role: json['role']?.toString() ?? 'user',
      jobRole: json['jobRole']?.toString() ?? 'Staff',
      department: json['department']?.toString() ?? 'General',
      profilePicture: json['profilePicture']?.toString(),
      lastMessage: json['lastMessage']?.toString(),
      lastMessageTime: json['lastMessageTime'] != null
          ? DateTime.tryParse(json['lastMessageTime'].toString())?.toLocal()
          : null,
      unreadCount: (json['unreadCount'] is int)
          ? json['unreadCount'] as int
          : int.tryParse(json['unreadCount']?.toString() ?? '0') ?? 0,
      isOnline: json['isOnline'] == true,
    );
  }

  ChatUserModel copyWith({
    String? lastMessage,
    DateTime? lastMessageTime,
    int? unreadCount,
    bool? isOnline,
  }) {
    return ChatUserModel(
      id: id,
      name: name,
      username: username,
      role: role,
      jobRole: jobRole,
      department: department,
      profilePicture: profilePicture,
      lastMessage: lastMessage ?? this.lastMessage,
      lastMessageTime: lastMessageTime ?? this.lastMessageTime,
      unreadCount: unreadCount ?? this.unreadCount,
      isOnline: isOnline ?? this.isOnline,
    );
  }
}
