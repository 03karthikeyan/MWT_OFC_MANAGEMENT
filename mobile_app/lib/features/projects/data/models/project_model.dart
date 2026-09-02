import '../../../../features/auth/data/models/user_model.dart';

class TeamMemberModel {
  final String userId;
  final UserModel? user;
  final String? role;

  TeamMemberModel({
    required this.userId,
    this.user,
    this.role,
  });

  factory TeamMemberModel.fromJson(Map<String, dynamic> json) {
    String userId = '';
    UserModel? user;
    final rawUser = json['user'];
    if (rawUser is Map<String, dynamic>) {
      user = UserModel.fromJson(rawUser);
      userId = user.id;
    } else if (rawUser is String) {
      userId = rawUser;
    }

    return TeamMemberModel(
      userId: userId,
      user: user,
      role: json['role'],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'user': user != null ? user!.toJson() : userId,
      'role': role,
    };
  }
}

class ProjectModel {
  final String id;
  final String name;
  final String? description;
  final String clientName;
  final String status;
  final DateTime? deadline;
  final List<TeamMemberModel> teamMembers;
  final double progress;
  final String? budget;
  final String priority;
  final DateTime? createdAt;

  ProjectModel({
    required this.id,
    required this.name,
    this.description,
    required this.clientName,
    required this.status,
    this.deadline,
    required this.teamMembers,
    required this.progress,
    this.budget,
    required this.priority,
    this.createdAt,
  });

  factory ProjectModel.fromJson(Map<String, dynamic> json) {
    var list = json['teamMembers'] as List?;
    List<TeamMemberModel> membersList = list != null
        ? list.map((i) => TeamMemberModel.fromJson(i as Map<String, dynamic>)).toList()
        : [];

    return ProjectModel(
      id: json['_id'] ?? json['id'] ?? '',
      name: json['name'] ?? '',
      description: json['description'],
      clientName: json['clientName'] ?? '',
      status: json['status'] ?? 'In Progress',
      deadline: json['deadline'] != null ? DateTime.tryParse(json['deadline'].toString()) : null,
      teamMembers: membersList,
      progress: (json['progress'] ?? 0).toDouble(),
      budget: json['budget']?.toString(),
      priority: json['priority'] ?? 'Medium',
      createdAt: json['createdAt'] != null ? DateTime.tryParse(json['createdAt'].toString()) : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      '_id': id,
      'name': name,
      'description': description,
      'clientName': clientName,
      'status': status,
      'deadline': deadline?.toIso8601String(),
      'teamMembers': teamMembers.map((e) => e.toJson()).toList(),
      'progress': progress,
      'budget': budget,
      'priority': priority,
    };
  }
}
