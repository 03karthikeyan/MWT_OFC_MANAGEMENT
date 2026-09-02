import 'package:hrms_app/core/network/api_client.dart';
import 'package:hrms_app/core/network/api_constants.dart';
import '../models/enquiry_model.dart';

class EnquiryRepository {
  final ApiClient _apiClient;

  EnquiryRepository({ApiClient? apiClient}) : _apiClient = apiClient ?? ApiClient();

  Future<List<EnquiryModel>> getEnquiries() async {
    final response = await _apiClient.get(ApiConstants.enquiries);
    final data = response.data;
    if (data is List) {
      return data.map((e) => EnquiryModel.fromJson(e as Map<String, dynamic>)).toList();
    } else if (data is Map && data.containsKey('enquiries')) {
      final list = data['enquiries'] as List;
      return list.map((e) => EnquiryModel.fromJson(e as Map<String, dynamic>)).toList();
    }
    return [];
  }

  Future<EnquiryModel> addEnquiry(Map<String, dynamic> enquiryData) async {
    final response = await _apiClient.post(ApiConstants.enquiries, data: enquiryData);
    final data = response.data as Map<String, dynamic>;
    return EnquiryModel.fromJson(data['enquiry'] ?? data);
  }

  Future<EnquiryModel> updateEnquiry(String id, Map<String, dynamic> enquiryData) async {
    final response = await _apiClient.put(ApiConstants.enquiryDetail(id), data: enquiryData);
    final data = response.data as Map<String, dynamic>;
    return EnquiryModel.fromJson(data['enquiry'] ?? data);
  }

  Future<void> deleteEnquiry(String id) async {
    await _apiClient.delete(ApiConstants.enquiryDetail(id));
  }
}
