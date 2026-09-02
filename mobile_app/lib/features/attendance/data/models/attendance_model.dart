import '../../../../features/auth/data/models/user_model.dart';

class AttendanceModel {
  final String id;
  final String userId;
  final UserModel? user;
  final DateTime date;
  final DateTime? checkIn;
  final DateTime? checkOut;
  final String status;

  AttendanceModel({
    required this.id,
    required this.userId,
    this.user,
    required this.date,
    this.checkIn,
    this.checkOut,
    required this.status,
  });

  factory AttendanceModel.fromJson(Map<String, dynamic> json) {
    String userId = '';
    UserModel? user;
    
    final rawUser = json['userId'];
    if (rawUser is Map<String, dynamic>) {
      user = UserModel.fromJson(rawUser);
      userId = user.id;
    } else if (rawUser is String) {
      userId = rawUser;
    }

    return AttendanceModel(
      id: json['_id'] ?? json['id'] ?? '',
      userId: userId,
      user: user,
      date: DateTime.parse(json['date'].toString()).toLocal(),
      checkIn: json['checkIn'] != null ? DateTime.parse(json['checkIn'].toString()).toLocal() : null,
      checkOut: json['checkOut'] != null ? DateTime.parse(json['checkOut'].toString()).toLocal() : null,
      status: json['status'] ?? 'present',
    );
  }

  String get displayStatus {
    if (checkOut != null) {
      return 'Completed';
    }
    final now = DateTime.now();
    final isToday = date.year == now.year &&
        date.month == now.month &&
        date.day == now.day;
    if (isToday) {
      return 'Active Now';
    }
    return 'Missed Checkout';
  }

  Map<String, dynamic> toJson() {
    return {
      '_id': id,
      'userId': user != null ? user!.toJson() : userId,
      'date': date.toIso8601String(),
      'checkIn': checkIn?.toIso8601String(),
      'checkOut': checkOut?.toIso8601String(),
      'status': status,
    };
  }
}
