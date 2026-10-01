import '../../../../features/auth/data/models/user_model.dart';

class AttendanceModel {
  final String id;
  final String userId;
  final UserModel? user;
  final DateTime date;
  final DateTime? checkIn;
  final DateTime? checkOut;
  final double workHours;
  final String status;
  final bool isOnDuty;
  final bool isManualCheckout;
  final String manualCheckoutReason;
  final bool isMissingCheckout;
  final String effectiveStatus;
  final double effectiveHours;
  final String locationAddress;

  AttendanceModel({
    required this.id,
    required this.userId,
    this.user,
    required this.date,
    this.checkIn,
    this.checkOut,
    this.workHours = 0.0,
    required this.status,
    this.isOnDuty = false,
    this.isManualCheckout = false,
    this.manualCheckoutReason = '',
    this.isMissingCheckout = false,
    this.effectiveStatus = 'present',
    this.effectiveHours = 0.0,
    this.locationAddress = '',
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

    String address = '';
    if (json['location'] is Map && json['location']['address'] != null) {
      address = json['location']['address'].toString();
    } else if (json['checkInLocation'] is Map && json['checkInLocation']['address'] != null) {
      address = json['checkInLocation']['address'].toString();
    }

    final parsedWorkHours = (json['workHours'] is num) ? (json['workHours'] as num).toDouble() : 0.0;
    final parsedEffHours = (json['effectiveHours'] is num) ? (json['effectiveHours'] as num).toDouble() : parsedWorkHours;

    return AttendanceModel(
      id: json['_id'] ?? json['id'] ?? '',
      userId: userId,
      user: user,
      date: DateTime.parse(json['date'].toString()).toLocal(),
      checkIn: json['checkIn'] != null ? DateTime.parse(json['checkIn'].toString()).toLocal() : null,
      checkOut: json['checkOut'] != null ? DateTime.parse(json['checkOut'].toString()).toLocal() : null,
      workHours: parsedWorkHours,
      status: json['status'] ?? 'present',
      isOnDuty: json['isOnDuty'] == true,
      isManualCheckout: json['isManualCheckout'] == true,
      manualCheckoutReason: json['manualCheckoutReason'] ?? '',
      isMissingCheckout: json['isMissingCheckout'] == true,
      effectiveStatus: json['effectiveStatus'] ?? json['status'] ?? 'present',
      effectiveHours: parsedEffHours,
      locationAddress: address,
    );
  }

  String get displayStatus {
    if (isOnDuty) {
      return 'On Duty';
    }
    if (checkOut != null) {
      final hrs = (workHours % 1 == 0) ? '${workHours.toInt()}h' : '${workHours.toStringAsFixed(1)}h';
      return isManualCheckout ? 'Regularized ($hrs)' : 'Completed ($hrs)';
    }
    final now = DateTime.now();
    final isToday = date.year == now.year &&
        date.month == now.month &&
        date.day == now.day;
    if (isToday) {
      return 'Active Now';
    }
    return isMissingCheckout ? 'Half-Day' : (effectiveStatus.isNotEmpty ? effectiveStatus : 'Absent');
  }

  Map<String, dynamic> toJson() {
    return {
      '_id': id,
      'userId': user != null ? user!.toJson() : userId,
      'date': date.toIso8601String(),
      'checkIn': checkIn?.toIso8601String(),
      'checkOut': checkOut?.toIso8601String(),
      'workHours': workHours,
      'status': status,
      'isOnDuty': isOnDuty,
      'isManualCheckout': isManualCheckout,
      'manualCheckoutReason': manualCheckoutReason,
    };
  }
}
