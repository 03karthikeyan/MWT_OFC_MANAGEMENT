import 'package:hrms_app/core/network/api_client.dart';
import 'package:hrms_app/core/network/api_constants.dart';
import '../models/internship_model.dart';

class InternshipRepository {
  final ApiClient _apiClient;

  InternshipRepository({ApiClient? apiClient}) : _apiClient = apiClient ?? ApiClient();

  Future<InternshipModel> submitInternshipEnquiry(Map<String, dynamic> enquiryData) async {
    final response = await _apiClient.post(ApiConstants.internshipEnquiry, data: enquiryData);
    final data = response.data as Map<String, dynamic>;
    return InternshipModel.fromJson(data['internship'] ?? data);
  }

  Future<List<InternshipModel>> getInternships() async {
    final response = await _apiClient.get(ApiConstants.internships);
    final data = response.data;
    if (data is List) {
      return data.map((e) => InternshipModel.fromJson(e as Map<String, dynamic>)).toList();
    } else if (data is Map && data.containsKey('internships')) {
      final list = data['internships'] as List;
      return list.map((e) => InternshipModel.fromJson(e as Map<String, dynamic>)).toList();
    }
    return [];
  }

  Future<InternshipModel> getInternship(String id) async {
    final response = await _apiClient.get(ApiConstants.internshipDetail(id));
    final data = response.data as Map<String, dynamic>;
    return InternshipModel.fromJson(data['internship'] ?? data);
  }

  Future<InternshipModel> updateInternship(String id, Map<String, dynamic> internshipData) async {
    final response = await _apiClient.put(ApiConstants.internshipDetail(id), data: internshipData);
    final data = response.data as Map<String, dynamic>;
    return InternshipModel.fromJson(data['internship'] ?? data);
  }

  Future<void> deleteInternship(String id) async {
    await _apiClient.delete(ApiConstants.internshipDetail(id));
  }

  Future<Map<String, dynamic>> getInternshipStats() async {
    final response = await _apiClient.get(ApiConstants.internshipStats);
    return response.data as Map<String, dynamic>;
  }
}
