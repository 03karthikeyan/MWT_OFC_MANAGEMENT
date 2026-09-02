import 'package:hrms_app/core/network/api_client.dart';
import 'package:hrms_app/core/network/api_constants.dart';
import '../models/attendance_model.dart';
import '../models/holiday_model.dart';

class AttendanceRepository {
  final ApiClient _apiClient;

  AttendanceRepository({ApiClient? apiClient}) : _apiClient = apiClient ?? ApiClient();

  Future<AttendanceModel> checkIn() async {
    final response = await _apiClient.post(ApiConstants.checkIn);
    final data = response.data as Map<String, dynamic>;
    return AttendanceModel.fromJson(data['attendance'] ?? data);
  }

  Future<AttendanceModel> checkOut() async {
    final response = await _apiClient.post(ApiConstants.checkOut);
    final data = response.data as Map<String, dynamic>;
    return AttendanceModel.fromJson(data['attendance'] ?? data);
  }

  Future<List<AttendanceModel>> getMyAttendance({String? month}) async {
    final Map<String, dynamic> params = {};
    if (month != null) params['month'] = month;
    final response = await _apiClient.get(ApiConstants.myAttendance, queryParameters: params);
    final data = response.data;
    if (data is List) {
      return data.map((e) => AttendanceModel.fromJson(e as Map<String, dynamic>)).toList();
    } else if (data is Map && data.containsKey('attendance')) {
      final list = data['attendance'] as List;
      return list.map((e) => AttendanceModel.fromJson(e as Map<String, dynamic>)).toList();
    }
    return [];
  }

  Future<List<AttendanceModel>> getAllAttendance({String? date}) async {
    final Map<String, dynamic> params = {};
    if (date != null) params['date'] = date;
    final response = await _apiClient.get(ApiConstants.allAttendance, queryParameters: params);
    final data = response.data;
    if (data is List) {
      return data.map((e) => AttendanceModel.fromJson(e as Map<String, dynamic>)).toList();
    } else if (data is Map) {
      final list = (data['allAttendance'] ?? data['attendance']) as List?;
      if (list != null) {
        return list.map((e) => AttendanceModel.fromJson(e as Map<String, dynamic>)).toList();
      }
    }
    return [];
  }

  Future<AttendanceModel?> getTodayAttendance() async {
    try {
      final response = await _apiClient.get(ApiConstants.todayAttendance);
      final data = response.data as Map<String, dynamic>;
      if (data['attendance'] != null) {
        return AttendanceModel.fromJson(data['attendance']);
      }
      return null;
    } catch (_) {
      return null;
    }
  }

  Future<Map<String, dynamic>> getAttendanceSummary({String? month, String? year}) async {
    final Map<String, dynamic> params = {};
    final now = DateTime.now();
    params['month'] = month ?? (now.month - 1).toString();
    params['year'] = year ?? now.year.toString();
    final response = await _apiClient.get(ApiConstants.attendanceSummary, queryParameters: params);
    return response.data as Map<String, dynamic>;
  }

  Future<List<HolidayModel>> getHolidays() async {
    final response = await _apiClient.get(ApiConstants.holidays);
    final data = response.data;
    if (data is List) {
      return data.map((e) => HolidayModel.fromJson(e as Map<String, dynamic>)).toList();
    } else if (data is Map && data.containsKey('holidays')) {
      final list = data['holidays'] as List;
      return list.map((e) => HolidayModel.fromJson(e as Map<String, dynamic>)).toList();
    }
    return [];
  }

  Future<HolidayModel> addHoliday(DateTime date, String reason, String type) async {
    final response = await _apiClient.post(
      ApiConstants.holidays,
      data: {
        'date': date.toIso8601String(),
        'reason': reason,
        'type': type,
      },
    );
    final data = response.data as Map<String, dynamic>;
    return HolidayModel.fromJson(data['holiday'] ?? data);
  }

  Future<void> deleteHoliday(String id) async {
    await _apiClient.delete(ApiConstants.holidayDetail(id));
  }
}
