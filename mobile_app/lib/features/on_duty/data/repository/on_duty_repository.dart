import 'package:hrms_app/core/network/api_client.dart';
import 'package:hrms_app/core/network/api_constants.dart';
import '../models/on_duty_model.dart';

class OnDutyRepository {
  final ApiClient _apiClient;

  OnDutyRepository({ApiClient? apiClient}) : _apiClient = apiClient ?? ApiClient();

  Future<OnDutyModel> applyOnDuty(DateTime date, String reason, String? expenseTitle, double expensePrice) async {
    final response = await _apiClient.post(
      ApiConstants.onDuty,
      data: {
        'date': date.toIso8601String(),
        'reason': reason,
        if (expenseTitle != null && expenseTitle.isNotEmpty)
          'expenses': {
            'title': expenseTitle,
            'price': expensePrice,
          }
      },
    );
    final data = response.data as Map<String, dynamic>;
    return OnDutyModel.fromJson(data['onDuty'] ?? data);
  }

  Future<List<OnDutyModel>> getMyOnDuty() async {
    final response = await _apiClient.get(ApiConstants.myOnDuty);
    final data = response.data;
    if (data is List) {
      return data.map((e) => OnDutyModel.fromJson(e as Map<String, dynamic>)).toList();
    } else if (data is Map) {
      final list = (data['onDutyRecords'] ?? data['onDutyRequests']) as List?;
      if (list != null) {
        return list.map((e) => OnDutyModel.fromJson(e as Map<String, dynamic>)).toList();
      }
    }
    return [];
  }

  Future<List<OnDutyModel>> getAllOnDuty({String? status}) async {
    final Map<String, dynamic> params = {};
    if (status != null) params['status'] = status;

    final response = await _apiClient.get(ApiConstants.allOnDuty, queryParameters: params);
    final data = response.data;
    if (data is List) {
      return data.map((e) => OnDutyModel.fromJson(e as Map<String, dynamic>)).toList();
    } else if (data is Map) {
      final list = (data['allOnDuty'] ?? data['onDutyRecords'] ?? data['onDutyRequests']) as List?;
      if (list != null) {
        return list.map((e) => OnDutyModel.fromJson(e as Map<String, dynamic>)).toList();
      }
    }
    return [];
  }

  Future<OnDutyModel> updateOnDuty(String id, String status) async {
    final response = await _apiClient.put(ApiConstants.onDutyDetail(id), data: {'status': status});
    final data = response.data as Map<String, dynamic>;
    return OnDutyModel.fromJson(data['onDuty'] ?? data);
  }

  Future<void> deleteOnDuty(String id) async {
    await _apiClient.delete(ApiConstants.onDutyDetail(id));
  }

  Future<int> getPendingOnDutyCount() async {
    try {
      final response = await _apiClient.get(ApiConstants.onDutyPendingCount);
      final data = response.data as Map<String, dynamic>;
      return data['count'] ?? 0;
    } catch (_) {
      return 0;
    }
  }
}
