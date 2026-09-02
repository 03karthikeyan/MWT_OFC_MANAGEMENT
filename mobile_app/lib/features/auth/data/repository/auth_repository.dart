import 'package:hrms_app/core/network/api_client.dart';
import 'package:hrms_app/core/network/api_constants.dart';
import '../models/user_model.dart';

class AuthRepository {
  final ApiClient _apiClient;

  AuthRepository({ApiClient? apiClient}) : _apiClient = apiClient ?? ApiClient();

  Future<Map<String, dynamic>> login(String username, String password) async {
    final response = await _apiClient.post(
      ApiConstants.login,
      data: {
        'identifier': username,
        'username': username,
        'password': password,
      },
    );
    // Returns { token, user }
    return response.data as Map<String, dynamic>;
  }

  Future<Map<String, dynamic>> register(Map<String, dynamic> data) async {
    final response = await _apiClient.post(ApiConstants.register, data: data);
    return response.data as Map<String, dynamic>;
  }

  Future<UserModel> getMe() async {
    final response = await _apiClient.get(ApiConstants.me);
    // Returns { user }
    final data = response.data as Map<String, dynamic>;
    return UserModel.fromJson(data['user'] ?? data);
  }

  Future<UserModel> updateProfile(Map<String, dynamic> profileData) async {
    final response = await _apiClient.put(ApiConstants.profile, data: profileData);
    final data = response.data as Map<String, dynamic>;
    return UserModel.fromJson(data['user'] ?? data);
  }
}
