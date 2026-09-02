import 'package:hrms_app/core/network/api_client.dart';
import 'package:hrms_app/core/network/api_constants.dart';
import '../models/portfolio_model.dart';

class PortfolioRepository {
  final ApiClient _apiClient;

  PortfolioRepository({ApiClient? apiClient}) : _apiClient = apiClient ?? ApiClient();

  Future<List<PortfolioModel>> getPortfolios() async {
    final response = await _apiClient.get(ApiConstants.portfolios);
    final data = response.data;
    if (data is List) {
      return data.map((e) => PortfolioModel.fromJson(e as Map<String, dynamic>)).toList();
    } else if (data is Map && data.containsKey('portfolios')) {
      final list = data['portfolios'] as List;
      return list.map((e) => PortfolioModel.fromJson(e as Map<String, dynamic>)).toList();
    }
    return [];
  }

  Future<PortfolioModel> addPortfolio(Map<String, dynamic> portfolioData) async {
    final response = await _apiClient.post(ApiConstants.portfolios, data: portfolioData);
    final data = response.data as Map<String, dynamic>;
    return PortfolioModel.fromJson(data['portfolio'] ?? data);
  }

  Future<PortfolioModel> updatePortfolio(String id, Map<String, dynamic> portfolioData) async {
    final response = await _apiClient.put(ApiConstants.portfolioDetail(id), data: portfolioData);
    final data = response.data as Map<String, dynamic>;
    return PortfolioModel.fromJson(data['portfolio'] ?? data);
  }

  Future<void> deletePortfolio(String id) async {
    await _apiClient.delete(ApiConstants.portfolioDetail(id));
  }
}
