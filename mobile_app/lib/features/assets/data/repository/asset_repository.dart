import 'package:hrms_app/core/network/api_client.dart';
import 'package:hrms_app/core/network/api_constants.dart';
import '../models/asset_model.dart';

class AssetRepository {
  final ApiClient _apiClient;

  AssetRepository({ApiClient? apiClient}) : _apiClient = apiClient ?? ApiClient();

  Future<List<AssetModel>> getMyAssets() async {
    final response = await _apiClient.get(ApiConstants.myAssets);
    final data = response.data;
    if (data is Map && data.containsKey('assets')) {
      final list = data['assets'] as List;
      return list.map((e) => AssetModel.fromJson(e as Map<String, dynamic>)).toList();
    }
    return [];
  }

  Future<List<AssetModel>> getAllAssets({String? status, String? category, String? search}) async {
    final response = await _apiClient.get(
      ApiConstants.allAssets,
      queryParameters: {
        if (status != null) 'status': status,
        if (category != null) 'category': category,
        if (search != null) 'search': search,
      },
    );
    final data = response.data;
    if (data is Map && data.containsKey('assets')) {
      final list = data['assets'] as List;
      return list.map((e) => AssetModel.fromJson(e as Map<String, dynamic>)).toList();
    }
    return [];
  }

  Future<AssetModel> createAsset({
    required String name,
    required String category,
    required String assetTag,
    String? serialNumber,
    String? specifications,
    String? assignedTo,
  }) async {
    final response = await _apiClient.post(
      ApiConstants.assets,
      data: {
        'name': name,
        'category': category,
        'assetTag': assetTag,
        'serialNumber': serialNumber,
        'specifications': specifications,
        'assignedTo': assignedTo,
      },
    );
    final data = response.data as Map<String, dynamic>;
    return AssetModel.fromJson(data['asset'] ?? data);
  }

  Future<AssetModel> allocateAsset(String id, {String? assignedTo, String? status}) async {
    final response = await _apiClient.put(
      ApiConstants.assetAllocate(id),
      data: {
        'assignedTo': assignedTo,
        'status': status,
      },
    );
    final data = response.data as Map<String, dynamic>;
    return AssetModel.fromJson(data['asset'] ?? data);
  }

  Future<void> deleteAsset(String id) async {
    await _apiClient.delete(ApiConstants.assetDetail(id));
  }
}
