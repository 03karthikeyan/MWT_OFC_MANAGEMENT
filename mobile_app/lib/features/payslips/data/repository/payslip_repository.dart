import 'package:hrms_app/core/network/api_client.dart';
import 'package:hrms_app/core/network/api_constants.dart';
import '../models/payslip_model.dart';

class PayslipRepository {
  final ApiClient _apiClient;

  PayslipRepository({ApiClient? apiClient}) : _apiClient = apiClient ?? ApiClient();

  Future<PayslipModel> generatePayslip(String userId, Map<String, dynamic> payslipData) async {
    final response = await _apiClient.post(
      ApiConstants.generatePayslip(userId),
      data: payslipData,
    );
    final data = response.data as Map<String, dynamic>;
    return PayslipModel.fromJson(data['payslip'] ?? data);
  }

  Future<List<PayslipModel>> getUserPayslips(String userId) async {
    final response = await _apiClient.get(ApiConstants.userPayslipHistory(userId));
    final data = response.data;
    if (data is List) {
      return data.map((e) => PayslipModel.fromJson(e as Map<String, dynamic>)).toList();
    } else if (data is Map && data.containsKey('payslips')) {
      final list = data['payslips'] as List;
      return list.map((e) => PayslipModel.fromJson(e as Map<String, dynamic>)).toList();
    }
    return [];
  }

  Future<List<PayslipModel>> fetchMyPayslips() async {
    final response = await _apiClient.get(ApiConstants.myPayslips);
    final data = response.data;
    if (data is List) {
      return data.map((e) => PayslipModel.fromJson(e as Map<String, dynamic>)).toList();
    } else if (data is Map && data.containsKey('payslips')) {
      final list = data['payslips'] as List;
      return list.map((e) => PayslipModel.fromJson(e as Map<String, dynamic>)).toList();
    }
    return [];
  }

  Future<void> removePayslip(String id) async {
    await _apiClient.delete(ApiConstants.payslipDetail(id));
  }
}
