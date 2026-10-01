import 'package:hrms_app/core/network/api_client.dart';
import 'package:hrms_app/core/network/api_constants.dart';
import '../models/report_model.dart';

class ReportRepository {
  final ApiClient _apiClient;

  ReportRepository({ApiClient? apiClient}) : _apiClient = apiClient ?? ApiClient();

  Future<MusterRollReport> getMusterRoll({required int month, required int year}) async {
    final response = await _apiClient.get(
      ApiConstants.reportsMusterRoll,
      queryParameters: {'month': month, 'year': year},
    );
    return MusterRollReport.fromJson(response.data as Map<String, dynamic>);
  }

  Future<HRSummaryOverview> getSummaryOverview() async {
    final response = await _apiClient.get(ApiConstants.reportsSummaryOverview);
    return HRSummaryOverview.fromJson(response.data as Map<String, dynamic>);
  }
}
