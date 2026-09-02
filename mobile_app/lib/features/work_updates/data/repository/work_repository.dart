import 'package:hrms_app/core/network/api_client.dart';
import 'package:hrms_app/core/network/api_constants.dart';
import '../models/work_update_model.dart';

class WorkRepository {
  final ApiClient _apiClient;

  WorkRepository({ApiClient? apiClient}) : _apiClient = apiClient ?? ApiClient();

  Future<WorkUpdateModel> addWork(String title, String description, String status, String? projectId, DateTime date) async {
    final response = await _apiClient.post(
      ApiConstants.work,
      data: {
        'title': title,
        'description': description,
        'status': status,
        if (projectId != null) 'projectId': projectId,
        'date': date.toIso8601String(),
      },
    );
    final data = response.data as Map<String, dynamic>;
    return WorkUpdateModel.fromJson(data['work'] ?? data);
  }

  Future<List<WorkUpdateModel>> getMyWork({String? date, String? status, String? search}) async {
    final Map<String, dynamic> params = {};
    if (date != null) params['date'] = date;
    if (status != null) params['status'] = status;
    if (search != null) params['search'] = search;

    final response = await _apiClient.get(ApiConstants.myWork, queryParameters: params);
    final data = response.data;
    if (data is List) {
      return data.map((e) => WorkUpdateModel.fromJson(e as Map<String, dynamic>)).toList();
    } else if (data is Map && data.containsKey('workUpdates')) {
      final list = data['workUpdates'] as List;
      return list.map((e) => WorkUpdateModel.fromJson(e as Map<String, dynamic>)).toList();
    }
    return [];
  }

  Future<List<WorkUpdateModel>> getAllWork({String? userId, String? date, String? status, String? search}) async {
    final Map<String, dynamic> params = {};
    if (userId != null) params['userId'] = userId;
    if (date != null) params['date'] = date;
    if (status != null) params['status'] = status;
    if (search != null) params['search'] = search;

    final response = await _apiClient.get(ApiConstants.allWork, queryParameters: params);
    final data = response.data;
    if (data is List) {
      return data.map((e) => WorkUpdateModel.fromJson(e as Map<String, dynamic>)).toList();
    } else if (data is Map && data.containsKey('workUpdates')) {
      final list = data['workUpdates'] as List;
      return list.map((e) => WorkUpdateModel.fromJson(e as Map<String, dynamic>)).toList();
    }
    return [];
  }

  Future<WorkUpdateModel> updateWork(String id, Map<String, dynamic> updateData) async {
    final response = await _apiClient.put(ApiConstants.workDetail(id), data: updateData);
    final data = response.data as Map<String, dynamic>;
    return WorkUpdateModel.fromJson(data['work'] ?? data);
  }

  Future<void> deleteWork(String id) async {
    await _apiClient.delete(ApiConstants.workDetail(id));
  }
}
