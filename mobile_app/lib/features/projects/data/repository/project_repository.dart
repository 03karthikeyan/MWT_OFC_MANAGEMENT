import 'package:hrms_app/core/network/api_client.dart';
import 'package:hrms_app/core/network/api_constants.dart';
import '../models/project_model.dart';

class ProjectRepository {
  final ApiClient _apiClient;

  ProjectRepository({ApiClient? apiClient}) : _apiClient = apiClient ?? ApiClient();

  Future<List<ProjectModel>> getProjects() async {
    final response = await _apiClient.get(ApiConstants.projects);
    final data = response.data;
    if (data is List) {
      return data.map((e) => ProjectModel.fromJson(e as Map<String, dynamic>)).toList();
    } else if (data is Map && data.containsKey('projects')) {
      final list = data['projects'] as List;
      return list.map((e) => ProjectModel.fromJson(e as Map<String, dynamic>)).toList();
    }
    return [];
  }

  Future<ProjectModel> addProject(Map<String, dynamic> projectData) async {
    final response = await _apiClient.post(ApiConstants.projects, data: projectData);
    final data = response.data as Map<String, dynamic>;
    return ProjectModel.fromJson(data['project'] ?? data);
  }

  Future<ProjectModel> updateProject(String id, Map<String, dynamic> projectData) async {
    final response = await _apiClient.put(ApiConstants.projectDetail(id), data: projectData);
    final data = response.data as Map<String, dynamic>;
    return ProjectModel.fromJson(data['project'] ?? data);
  }

  Future<void> deleteProject(String id) async {
    await _apiClient.delete(ApiConstants.projectDetail(id));
  }
}
