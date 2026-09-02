import '../../../../features/auth/data/models/user_model.dart';
import '../../../../features/projects/data/models/project_model.dart';

class WorkUpdateModel {
  final String id;
  final String userId;
  final UserModel? user;
  final String title;
  final String description;
  final String status;
  final String? projectId;
  final ProjectModel? project;
  final DateTime date;
  final DateTime? createdAt;

  WorkUpdateModel({
    required this.id,
    required this.userId,
    this.user,
    required this.title,
    required this.description,
    required this.status,
    this.projectId,
    this.project,
    required this.date,
    this.createdAt,
  });

  factory WorkUpdateModel.fromJson(Map<String, dynamic> json) {
    String userId = '';
    UserModel? user;
    final rawUser = json['userId'];
    if (rawUser is Map<String, dynamic>) {
      user = UserModel.fromJson(rawUser);
      userId = user.id;
    } else if (rawUser is String) {
      userId = rawUser;
    }

    String? projectId;
    ProjectModel? project;
    final rawProject = json['projectId'];
    if (rawProject is Map<String, dynamic>) {
      project = ProjectModel.fromJson(rawProject);
      projectId = project.id;
    } else if (rawProject is String) {
      projectId = rawProject;
    }

    return WorkUpdateModel(
      id: json['_id'] ?? json['id'] ?? '',
      userId: userId,
      user: user,
      title: json['title'] ?? '',
      description: json['description'] ?? '',
      status: json['status'] ?? 'pending',
      projectId: projectId,
      project: project,
      date: json['date'] != null ? DateTime.parse(json['date'].toString()) : DateTime.now(),
      createdAt: json['createdAt'] != null ? DateTime.parse(json['createdAt'].toString()) : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      '_id': id,
      'userId': user != null ? user!.toJson() : userId,
      'title': title,
      'description': description,
      'status': status,
      'projectId': project != null ? project!.toJson() : projectId,
      'date': date.toIso8601String(),
    };
  }
}
