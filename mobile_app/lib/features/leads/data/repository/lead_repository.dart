import 'package:hrms_app/core/network/api_client.dart';
import 'package:hrms_app/core/network/api_constants.dart';
import '../models/lead_model.dart';

class LeadRepository {
  final ApiClient _apiClient;

  LeadRepository({ApiClient? apiClient}) : _apiClient = apiClient ?? ApiClient();

  Future<List<LeadModel>> getLeads() async {
    final response = await _apiClient.get(ApiConstants.leads);
    final data = response.data;
    if (data is List) {
      return data.map((e) => LeadModel.fromJson(e as Map<String, dynamic>)).toList();
    } else if (data is Map && data.containsKey('leads')) {
      final list = data['leads'] as List;
      return list.map((e) => LeadModel.fromJson(e as Map<String, dynamic>)).toList();
    }
    return [];
  }

  Future<LeadModel> addLead(Map<String, dynamic> leadData) async {
    final response = await _apiClient.post(ApiConstants.leads, data: leadData);
    final data = response.data as Map<String, dynamic>;
    return LeadModel.fromJson(data['lead'] ?? data);
  }

  Future<LeadModel> updateLead(String id, Map<String, dynamic> leadData) async {
    final response = await _apiClient.put(ApiConstants.leadDetail(id), data: leadData);
    final data = response.data as Map<String, dynamic>;
    return LeadModel.fromJson(data['lead'] ?? data);
  }

  Future<void> deleteLead(String id) async {
    await _apiClient.delete(ApiConstants.leadDetail(id));
  }
}
