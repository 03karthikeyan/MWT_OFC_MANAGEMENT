import '../../../../features/auth/data/models/user_model.dart';

class EnquiryModel {
  final String id;
  final String name;
  final String? email;
  final String? phone;
  final String subject;
  final String message;
  final String status;
  final String? assignedToId;
  final UserModel? assignedTo;
  final String createdById;
  final UserModel? createdBy;
  final DateTime? createdAt;

  EnquiryModel({
    required this.id,
    required this.name,
    this.email,
    this.phone,
    required this.subject,
    required this.message,
    required this.status,
    this.assignedToId,
    this.assignedTo,
    required this.createdById,
    this.createdBy,
    this.createdAt,
  });

  factory EnquiryModel.fromJson(Map<String, dynamic> json) {
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

    return EnquiryModel(
      id: json['_id'] ?? json['id'] ?? '',
      name: json['name'] ?? '',
      email: json['email'],
      phone: json['phone'],
      subject: json['subject'] ?? '',
      message: json['message'] ?? '',
      status: json['status'] ?? 'New',
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
      'name': name,
      'email': email,
      'phone': phone,
      'subject': subject,
      'message': message,
      'status': status,
      'assignedTo': assignedTo != null ? assignedTo!.toJson() : assignedToId,
      'createdBy': createdBy != null ? createdBy!.toJson() : createdById,
    };
  }
}
