import 'package:hrms_app/core/network/api_client.dart';
import 'package:hrms_app/core/network/api_constants.dart';
import '../models/request_model.dart';

class RequestRepository {
  final ApiClient _apiClient;

  RequestRepository({ApiClient? apiClient}) : _apiClient = apiClient ?? ApiClient();

  Future<List<RequestModel>> getMyRequests() async {
    final response = await _apiClient.get(ApiConstants.myRequests);
    final data = response.data;
    if (data is List) {
      return data.map((e) => RequestModel.fromJson(e as Map<String, dynamic>)).toList();
    } else if (data is Map && data.containsKey('requests')) {
      final list = data['requests'] as List;
      return list.map((e) => RequestModel.fromJson(e as Map<String, dynamic>)).toList();
    }
    return [];
  }

  Future<List<RequestModel>> getIncomingRequests() async {
    final response = await _apiClient.get(ApiConstants.incomingRequests);
    final data = response.data;
    if (data is List) {
      return data.map((e) => RequestModel.fromJson(e as Map<String, dynamic>)).toList();
    } else if (data is Map) {
      final list = (data['incomingRequests'] ?? data['requests']) as List?;
      if (list != null) {
        return list.map((e) => RequestModel.fromJson(e as Map<String, dynamic>)).toList();
      }
    }
    return [];
  }

  Future<int> getPendingRequestsCount() async {
    try {
      final response = await _apiClient.get(ApiConstants.requestsPendingCount);
      final data = response.data as Map<String, dynamic>;
      return data['count'] ?? 0;
    } catch (_) {
      return 0;
    }
  }

  Future<RequestModel> addRequest(String subject, String description, String type, String? websiteLink, String? recipientId) async {
    final response = await _apiClient.post(
      ApiConstants.requests,
      data: {
        'subject': subject,
        'description': description,
        'type': type,
        if (websiteLink != null && websiteLink.isNotEmpty) 'websiteLink': websiteLink,
        if (recipientId != null && recipientId.isNotEmpty) 'recipientId': recipientId,
      },
    );
    final data = response.data as Map<String, dynamic>;
    return RequestModel.fromJson(data['request'] ?? data);
  }

  Future<RequestModel> updateRequest(String id, Map<String, dynamic> requestData) async {
    final response = await _apiClient.put(ApiConstants.requestDetail(id), data: requestData);
    final data = response.data as Map<String, dynamic>;
    return RequestModel.fromJson(data['request'] ?? data);
  }

  Future<void> deleteRequest(String id) async {
    await _apiClient.delete(ApiConstants.requestDetail(id));
  }
}
