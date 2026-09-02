import 'package:hrms_app/core/network/api_client.dart';
import 'package:hrms_app/core/network/api_constants.dart';
import '../models/leave_model.dart';

class LeaveRepository {
  final ApiClient _apiClient;

  LeaveRepository({ApiClient? apiClient}) : _apiClient = apiClient ?? ApiClient();

  Future<LeaveModel> applyLeave(DateTime startDate, DateTime endDate, String reason) async {
    final response = await _apiClient.post(
      ApiConstants.leave,
      data: {
        'startDate': startDate.toIso8601String(),
        'endDate': endDate.toIso8601String(),
        'reason': reason,
      },
    );
    final data = response.data as Map<String, dynamic>;
    return LeaveModel.fromJson(data['leave'] ?? data);
  }

  Future<List<LeaveModel>> getMyLeaves() async {
    final response = await _apiClient.get(ApiConstants.myLeave);
    final data = response.data;
    if (data is List) {
      return data.map((e) => LeaveModel.fromJson(e as Map<String, dynamic>)).toList();
    } else if (data is Map && data.containsKey('leaves')) {
      final list = data['leaves'] as List;
      return list.map((e) => LeaveModel.fromJson(e as Map<String, dynamic>)).toList();
    }
    return [];
  }

  Future<List<LeaveModel>> getAllLeaves() async {
    final response = await _apiClient.get(ApiConstants.allLeave);
    final data = response.data;
    if (data is List) {
      return data.map((e) => LeaveModel.fromJson(e as Map<String, dynamic>)).toList();
    } else if (data is Map) {
      final list = (data['allLeaves'] ?? data['leaves']) as List?;
      if (list != null) {
        return list.map((e) => LeaveModel.fromJson(e as Map<String, dynamic>)).toList();
      }
    }
    return [];
  }

  Future<LeaveModel> updateLeave(String id, String status) async {
    final response = await _apiClient.put(ApiConstants.leaveDetail(id), data: {'status': status});
    final data = response.data as Map<String, dynamic>;
    return LeaveModel.fromJson(data['leave'] ?? data);
  }

  Future<void> deleteLeave(String id) async {
    await _apiClient.delete(ApiConstants.leaveDetail(id));
  }

  Future<int> getPendingLeavesCount() async {
    try {
      final response = await _apiClient.get(ApiConstants.leavePendingCount);
      final data = response.data as Map<String, dynamic>;
      return data['count'] ?? 0;
    } catch (_) {
      return 0;
    }
  }
}
