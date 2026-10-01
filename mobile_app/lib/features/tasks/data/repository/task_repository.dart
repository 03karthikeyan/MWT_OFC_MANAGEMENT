import 'package:hrms_app/core/network/api_client.dart';
import 'package:hrms_app/core/network/api_constants.dart';
import '../models/task_model.dart';

class TaskRepository {
  final ApiClient _apiClient;

  TaskRepository({ApiClient? apiClient}) : _apiClient = apiClient ?? ApiClient();

  Future<List<TaskModel>> getMyTasks({String? status, String? priority}) async {
    final response = await _apiClient.get(
      ApiConstants.myTasks,
      queryParameters: {
        if (status != null) 'status': status,
        if (priority != null) 'priority': priority,
      },
    );
    final data = response.data;
    if (data is Map && data.containsKey('tasks')) {
      final list = data['tasks'] as List;
      return list.map((e) => TaskModel.fromJson(e as Map<String, dynamic>)).toList();
    }
    return [];
  }

  Future<List<TaskModel>> getAllTasks({String? status, String? priority, String? assignedTo}) async {
    final response = await _apiClient.get(
      ApiConstants.allTasks,
      queryParameters: {
        if (status != null) 'status': status,
        if (priority != null) 'priority': priority,
        if (assignedTo != null) 'assignedTo': assignedTo,
      },
    );
    final data = response.data;
    if (data is Map && data.containsKey('tasks')) {
      final list = data['tasks'] as List;
      return list.map((e) => TaskModel.fromJson(e as Map<String, dynamic>)).toList();
    }
    return [];
  }

  Future<TaskModel> createTask({
    required String title,
    String? description,
    required String assignedTo,
    String? projectId,
    String priority = 'medium',
    DateTime? dueDate,
  }) async {
    final response = await _apiClient.post(
      ApiConstants.tasks,
      data: {
        'title': title,
        'description': description,
        'assignedTo': assignedTo,
        'projectId': projectId,
        'priority': priority,
        'dueDate': dueDate?.toIso8601String(),
      },
    );
    final data = response.data as Map<String, dynamic>;
    return TaskModel.fromJson(data['task'] ?? data);
  }

  Future<TaskModel> updateTaskStatus(String id, {String? status, int? progress}) async {
    final response = await _apiClient.put(
      ApiConstants.taskStatus(id),
      data: {
        if (status != null) 'status': status,
        if (progress != null) 'progress': progress,
      },
    );
    final data = response.data as Map<String, dynamic>;
    return TaskModel.fromJson(data['task'] ?? data);
  }

  Future<TaskModel> addComment(String id, String message) async {
    final response = await _apiClient.post(
      ApiConstants.taskComments(id),
      data: {'message': message},
    );
    final data = response.data as Map<String, dynamic>;
    return TaskModel.fromJson(data['task'] ?? data);
  }

  Future<void> deleteTask(String id) async {
    await _apiClient.delete(ApiConstants.taskDetail(id));
  }
}
