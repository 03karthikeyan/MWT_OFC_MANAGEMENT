import 'package:equatable/equatable.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import '../data/models/admin_dashboard_model.dart';
import '../data/models/dashboard_stats_model.dart';
import '../data/repository/dashboard_repository.dart';
import '../../attendance/data/repository/attendance_repository.dart';
import '../../work_updates/data/repository/work_repository.dart';
import '../../leave/data/repository/leave_repository.dart';
import '../../requests/data/repository/request_repository.dart';
import '../../notifications/data/repository/notification_repository.dart';

abstract class DashboardState extends Equatable {
  const DashboardState();
  @override
  List<Object?> get props => [];
}

class DashboardInitial extends DashboardState {}
class DashboardLoading extends DashboardState {}

class EmployeeDashboardSuccess extends DashboardState {
  final Map<String, dynamic> attendanceSummary;
  final dynamic todayAttendance;
  final List<dynamic> recentWork;
  final List<dynamic> recentLeaves;
  final List<dynamic> recentRequests;
  final List<dynamic> notifications;

  const EmployeeDashboardSuccess({
    required this.attendanceSummary,
    required this.todayAttendance,
    required this.recentWork,
    required this.recentLeaves,
    required this.recentRequests,
    required this.notifications,
  });

  @override
  List<Object?> get props => [attendanceSummary, todayAttendance, recentWork, recentLeaves, recentRequests, notifications];
}

class AdminDashboardSuccess extends DashboardState {
  final DashboardStatsModel stats;
  final AdminDashboardModel details;

  const AdminDashboardSuccess({required this.stats, required this.details});

  @override
  List<Object?> get props => [stats, details];
}

class DashboardFailure extends DashboardState {
  final String message;
  const DashboardFailure(this.message);

  @override
  List<Object?> get props => [message];
}

class DashboardCubit extends Cubit<DashboardState> {
  final DashboardRepository _dashboardRepository;
  final AttendanceRepository _attendanceRepository;
  final WorkRepository _workRepository;
  final LeaveRepository _leaveRepository;
  final RequestRepository _requestRepository;
  final NotificationRepository _notificationRepository;

  DashboardCubit({
    DashboardRepository? dashboardRepository,
    AttendanceRepository? attendanceRepository,
    WorkRepository? workRepository,
    LeaveRepository? leaveRepository,
    RequestRepository? requestRepository,
    NotificationRepository? notificationRepository,
  })  : _dashboardRepository = dashboardRepository ?? DashboardRepository(),
        _attendanceRepository = attendanceRepository ?? AttendanceRepository(),
        _workRepository = workRepository ?? WorkRepository(),
        _leaveRepository = leaveRepository ?? LeaveRepository(),
        _requestRepository = requestRepository ?? RequestRepository(),
        _notificationRepository = notificationRepository ?? NotificationRepository(),
        super(DashboardInitial());

  Future<void> loadDashboard(String role) async {
    emit(DashboardLoading());
    try {
      if (role == 'admin') {
        final stats = await _dashboardRepository.getDashboardStats();
        final details = await _dashboardRepository.getDashboardData();
        emit(AdminDashboardSuccess(stats: stats, details: details));
      } else {
        // Load combined personal info for employee
        dynamic today;
        try {
          today = await _attendanceRepository.getTodayAttendance();
        } catch (e) {
          print('Dashboard error fetching today attendance: $e');
        }

        Map<String, dynamic> summary = {};
        try {
          summary = await _attendanceRepository.getAttendanceSummary();
        } catch (e) {
          print('Dashboard error fetching attendance summary: $e');
        }

        List<dynamic> workList = [];
        try {
          workList = await _workRepository.getMyWork();
        } catch (e) {
          print('Dashboard error fetching my work: $e');
        }

        List<dynamic> leaves = [];
        try {
          leaves = await _leaveRepository.getMyLeaves();
        } catch (e) {
          print('Dashboard error fetching my leaves: $e');
        }

        List<dynamic> reqs = [];
        try {
          reqs = await _requestRepository.getMyRequests();
        } catch (e) {
          print('Dashboard error fetching my requests: $e');
        }

        List<dynamic> notifs = [];
        try {
          notifs = await _notificationRepository.getMyNotifications();
        } catch (e) {
          print('Dashboard error fetching my notifications: $e');
        }

        emit(EmployeeDashboardSuccess(
          todayAttendance: today,
          attendanceSummary: summary,
          recentWork: workList.take(5).toList(),
          recentLeaves: leaves.take(5).toList(),
          recentRequests: reqs.take(5).toList(),
          notifications: notifs.take(5).toList(),
        ));
      }
    } catch (e) {
      emit(DashboardFailure(e.toString()));
    }
  }
}
