import '../../../../features/auth/data/models/user_model.dart';

class TaskComment {
  final String id;
  final UserModel? user;
  final String message;
  final DateTime createdAt;

  TaskComment({
    required this.id,
    this.user,
    required this.message,
    required this.createdAt,
  });

  factory TaskComment.fromJson(Map<String, dynamic> json) {
    UserModel? user;
    if (json['userId'] is Map<String, dynamic>) {
      user = UserModel.fromJson(json['userId']);
    }
    return TaskComment(
      id: json['_id'] ?? '',
      user: user,
      message: json['message'] ?? '',
      createdAt: json['createdAt'] != null
          ? DateTime.parse(json['createdAt'].toString())
          : DateTime.now(),
    );
  }
}

class TaskModel {
  final String id;
  final String title;
  final String description;
  final UserModel? assignedTo;
  final UserModel? assignedBy;
  final String? projectId;
  final String? projectName;
  final String priority;
  final String status;
  final int progress;
  final DateTime? dueDate;
  final DateTime? completedAt;
  final List<TaskComment> comments;
  final DateTime? createdAt;

  TaskModel({
    required this.id,
    required this.title,
    required this.description,
    this.assignedTo,
    this.assignedBy,
    this.projectId,
    this.projectName,
    required this.priority,
    required this.status,
    this.progress = 0,
    this.dueDate,
    this.completedAt,
    this.comments = const [],
    this.createdAt,
  });

  factory TaskModel.fromJson(Map<String, dynamic> json) {
    UserModel? assignedTo;
    if (json['assignedTo'] is Map<String, dynamic>) {
      assignedTo = UserModel.fromJson(json['assignedTo']);
    }

    UserModel? assignedBy;
    if (json['assignedBy'] is Map<String, dynamic>) {
      assignedBy = UserModel.fromJson(json['assignedBy']);
    }

    String? projectId;
    String? projectName;
    if (json['projectId'] is Map<String, dynamic>) {
      projectId = json['projectId']['_id'];
      projectName = json['projectId']['name'];
    } else if (json['projectId'] is String) {
      projectId = json['projectId'];
    }

    List<TaskComment> comments = [];
    if (json['comments'] is List) {
      comments = (json['comments'] as List)
          .map((c) => TaskComment.fromJson(c as Map<String, dynamic>))
          .toList();
    }

    return TaskModel(
      id: json['_id'] ?? json['id'] ?? '',
      title: json['title'] ?? '',
      description: json['description'] ?? '',
      assignedTo: assignedTo,
      assignedBy: assignedBy,
      projectId: projectId,
      projectName: projectName,
      priority: json['priority'] ?? 'medium',
      status: json['status'] ?? 'todo',
      progress: (json['progress'] is num) ? (json['progress'] as num).toInt() : 0,
      dueDate: json['dueDate'] != null ? DateTime.tryParse(json['dueDate'].toString()) : null,
      completedAt: json['completedAt'] != null ? DateTime.tryParse(json['completedAt'].toString()) : null,
      comments: comments,
      createdAt: json['createdAt'] != null ? DateTime.tryParse(json['createdAt'].toString()) : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'title': title,
      'description': description,
      'assignedTo': assignedTo?.id,
      'projectId': projectId,
      'priority': priority,
      'status': status,
      'dueDate': dueDate?.toIso8601String(),
    };
  }
}
