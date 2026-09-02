import 'package:hrms_app/core/network/api_client.dart';
import 'package:hrms_app/core/network/api_constants.dart';
import '../models/admin_dashboard_model.dart';
import '../models/dashboard_stats_model.dart';

class DashboardRepository {
  final ApiClient _apiClient;

  DashboardRepository({ApiClient? apiClient}) : _apiClient = apiClient ?? ApiClient();

  Future<DashboardStatsModel> getDashboardStats() async {
    final response = await _apiClient.get(ApiConstants.dashboardStats);
    return DashboardStatsModel.fromJson(response.data as Map<String, dynamic>);
  }

  Future<AdminDashboardModel> getDashboardData() async {
    final response = await _apiClient.get(ApiConstants.dashboardAdmin);
    return AdminDashboardModel.fromJson(response.data as Map<String, dynamic>);
  }
}
