import '../../../../features/auth/data/models/user_model.dart';

class LeadModel {
  final String id;
  final String clientName;
  final String? company;
  final String email;
  final String? phone;
  final String? projectType;
  final String? budget;
  final String status;
  final String? notes;
  final String? assignedToId;
  final UserModel? assignedTo;
  final String createdById;
  final UserModel? createdBy;
  final DateTime? createdAt;

  LeadModel({
    required this.id,
    required this.clientName,
    this.company,
    required this.email,
    this.phone,
    this.projectType,
    this.budget,
    required this.status,
    this.notes,
    this.assignedToId,
    this.assignedTo,
    required this.createdById,
    this.createdBy,
    this.createdAt,
  });

  factory LeadModel.fromJson(Map<String, dynamic> json) {
    String? assignedToId;
    UserModel? assignedTo;
    final rawAssigned = json['assignedTo'];
    if (rawAssigned is Map<String, dynamic>) {
      assignedTo = UserModel.fromJson(rawAssigned);
      assignedToId = assignedTo.id;
    } else if (rawAssigned is String) {
      assignedToId = rawAssigned;
    }

    String createdById = '';
    UserModel? createdBy;
    final rawCreated = json['createdBy'];
    if (rawCreated is Map<String, dynamic>) {
      createdBy = UserModel.fromJson(rawCreated);
      createdById = createdBy.id;
    } else if (rawCreated is String) {
      createdById = rawCreated;
    }

    return LeadModel(
      id: json['_id'] ?? json['id'] ?? '',
      clientName: json['clientName'] ?? '',
      company: json['company'],
      email: json['email'] ?? '',
      phone: json['phone'],
      projectType: json['projectType'],
      budget: json['budget']?.toString(),
      status: json['status'] ?? 'New',
      notes: json['notes'],
      assignedToId: assignedToId,
      assignedTo: assignedTo,
      createdById: createdById,
      createdBy: createdBy,
      createdAt: json['createdAt'] != null ? DateTime.tryParse(json['createdAt'].toString()) : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      '_id': id,
      'clientName': clientName,
      'company': company,
      'email': email,
      'phone': phone,
      'projectType': projectType,
      'budget': budget,
      'status': status,
      'notes': notes,
      'assignedTo': assignedTo != null ? assignedTo!.toJson() : assignedToId,
      'createdBy': createdBy != null ? createdBy!.toJson() : createdById,
    };
  }
}
