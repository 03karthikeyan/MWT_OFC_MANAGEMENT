import '../../../attendance/data/models/attendance_model.dart';
import '../../../work_updates/data/models/work_update_model.dart';
import '../../../leave/data/models/leave_model.dart';
import '../../../notifications/data/models/notification_model.dart';
import '../../../requests/data/models/request_model.dart';

class AdminDashboardModel {
  final List<AttendanceModel> allAttendance;
  final List<WorkUpdateModel> allWork;
  final List<LeaveModel> allLeaves;
  final List<NotificationModel> notifications;
  final List<RequestModel> incomingRequests;

  AdminDashboardModel({
    required this.allAttendance,
    required this.allWork,
    required this.allLeaves,
    required this.notifications,
    required this.incomingRequests,
  });

  factory AdminDashboardModel.fromJson(Map<String, dynamic> json) {
    var attendList = json['allAttendance'] as List?;
    var workList = json['allWork'] as List?;
    var leaveList = json['allLeaves'] as List?;
    var notifyList = json['notifications'] as List?;
    var requestList = json['incomingRequests'] as List?;

    return AdminDashboardModel(
      allAttendance: attendList != null
          ? attendList.map((e) => AttendanceModel.fromJson(e as Map<String, dynamic>)).toList()
          : [],
      allWork: workList != null
          ? workList.map((e) => WorkUpdateModel.fromJson(e as Map<String, dynamic>)).toList()
          : [],
      allLeaves: leaveList != null
          ? leaveList.map((e) => LeaveModel.fromJson(e as Map<String, dynamic>)).toList()
          : [],
      notifications: notifyList != null
          ? notifyList.map((e) => NotificationModel.fromJson(e as Map<String, dynamic>)).toList()
          : [],
      incomingRequests: requestList != null
          ? requestList.map((e) => RequestModel.fromJson(e as Map<String, dynamic>)).toList()
          : [],
    );
  }
}
