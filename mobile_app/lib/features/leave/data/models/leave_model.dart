import '../../../../features/auth/data/models/user_model.dart';

class LeaveModel {
  final String id;
  final String userId;
  final UserModel? user;
  final DateTime startDate;
  final DateTime endDate;
  final String reason;
  final String status;
  final String leaveType;
  final String session;
  final double daysCount;
  final String? rejectionReason;
  final DateTime? createdAt;

  LeaveModel({
    required this.id,
    required this.userId,
    this.user,
    required this.startDate,
    required this.endDate,
    required this.reason,
    required this.status,
    this.leaveType = 'casual',
    this.session = 'full_day',
    this.daysCount = 1.0,
    this.rejectionReason,
    this.createdAt,
  });

  int get durationInDays => daysCount.ceil();

  factory LeaveModel.fromJson(Map<String, dynamic> json) {
    String userId = '';
    UserModel? user;
    final rawUser = json['userId'];
    if (rawUser is Map<String, dynamic>) {
      user = UserModel.fromJson(rawUser);
      userId = user.id;
    } else if (rawUser is String) {
      userId = rawUser;
    }

    return LeaveModel(
      id: json['_id'] ?? json['id'] ?? '',
      userId: userId,
      user: user,
      startDate: DateTime.parse(json['startDate'].toString()),
      endDate: DateTime.parse(json['endDate'].toString()),
      reason: json['reason'] ?? '',
      status: json['status'] ?? 'pending',
      leaveType: json['leaveType'] ?? 'casual',
      session: json['session'] ?? 'full_day',
      daysCount: (json['daysCount'] is num) ? (json['daysCount'] as num).toDouble() : 1.0,
      rejectionReason: json['rejectionReason'],
      createdAt: json['createdAt'] != null ? DateTime.tryParse(json['createdAt'].toString()) : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      '_id': id,
      'userId': user != null ? user!.toJson() : userId,
      'startDate': startDate.toIso8601String(),
      'endDate': endDate.toIso8601String(),
      'reason': reason,
      'status': status,
      'leaveType': leaveType,
      'session': session,
      'daysCount': daysCount,
      'rejectionReason': rejectionReason,
    };
  }
}
