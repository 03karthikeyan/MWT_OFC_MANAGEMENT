import 'package:hrms_app/core/network/api_client.dart';
import 'package:hrms_app/core/network/api_constants.dart';
import 'package:hrms_app/features/auth/data/models/user_model.dart';

class EmployeeRepository {
  final ApiClient _apiClient;

  EmployeeRepository({ApiClient? apiClient}) : _apiClient = apiClient ?? ApiClient();

  Future<List<UserModel>> getUsers() async {
    final response = await _apiClient.get(ApiConstants.users);
    final data = response.data;
    if (data is List) {
      return data.map((e) => UserModel.fromJson(e as Map<String, dynamic>)).toList();
    } else if (data is Map && data.containsKey('users')) {
      final list = data['users'] as List;
      return list.map((e) => UserModel.fromJson(e as Map<String, dynamic>)).toList();
    }
    return [];
  }

  Future<List<UserModel>> getLeads() async {
    final response = await _apiClient.get(ApiConstants.userLeads);
    final data = response.data;
    if (data is List) {
      return data.map((e) => UserModel.fromJson(e as Map<String, dynamic>)).toList();
    } else if (data is Map && data.containsKey('leads')) {
      final list = data['leads'] as List;
      return list.map((e) => UserModel.fromJson(e as Map<String, dynamic>)).toList();
    }
    return [];
  }

  Future<UserModel> addUser(Map<String, dynamic> userData) async {
    final response = await _apiClient.post(ApiConstants.users, data: userData);
    final data = response.data as Map<String, dynamic>;
    return UserModel.fromJson(data['user'] ?? data);
  }

  Future<UserModel> updateUser(String id, Map<String, dynamic> userData) async {
    final response = await _apiClient.put(ApiConstants.userDetail(id), data: userData);
    final data = response.data as Map<String, dynamic>;
    return UserModel.fromJson(data['user'] ?? data);
  }

  Future<void> deleteUser(String id) async {
    await _apiClient.delete(ApiConstants.userDetail(id));
  }

  Future<List<UserModel>> getTeam() async {
    final response = await _apiClient.get(ApiConstants.team);
    final data = response.data;
    if (data is List) {
      return data.map((e) => UserModel.fromJson(e as Map<String, dynamic>)).toList();
    } else if (data is Map && data.containsKey('team')) {
      final list = data['team'] as List;
      return list.map((e) => UserModel.fromJson(e as Map<String, dynamic>)).toList();
    }
    return [];
  }
}
