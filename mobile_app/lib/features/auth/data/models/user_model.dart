class UserModel {
  final String id;
  final String name;
  final String? email;
  final String username;
  final String role;
  final String? employeeId;
  final String jobRole;
  final String department;
  final DateTime? dateOfJoining;
  final String bankName;
  final String bankAccountNo;
  final String ifscCode;
  final String? profilePicture;
  final String? contact;
  final String? payslip;
  final bool canManageInternships;
  final bool canManageEnquiries;
  final bool canManageLeads;
  final String status;
  final DateTime? createdAt;

  UserModel({
    required this.id,
    required this.name,
    this.email,
    required this.username,
    required this.role,
    this.employeeId,
    required this.jobRole,
    required this.department,
    this.dateOfJoining,
    required this.bankName,
    required this.bankAccountNo,
    required this.ifscCode,
    this.profilePicture,
    this.contact,
    this.payslip,
    required this.canManageInternships,
    required this.canManageEnquiries,
    required this.canManageLeads,
    required this.status,
    this.createdAt,
  });

  bool get isAdmin => role == 'admin';

  factory UserModel.fromJson(Map<String, dynamic> json) {
    return UserModel(
      id: json['_id'] ?? json['id'] ?? '',
      name: json['name'] ?? '',
      email: json['email'],
      username: json['username'] ?? '',
      role: json['role'] ?? 'user',
      employeeId: json['employeeId'],
      jobRole: json['jobRole'] ?? 'Staff',
      department: json['department'] ?? 'IT',
      dateOfJoining: json['dateOfJoining'] != null
          ? DateTime.tryParse(json['dateOfJoining'].toString())
          : null,
      bankName: json['bankName'] ?? '',
      bankAccountNo: json['bankAccountNo'] ?? '',
      ifscCode: json['ifscCode'] ?? '',
      profilePicture: json['profilePicture'],
      contact: json['contact'],
      payslip: json['payslip'],
      canManageInternships: json['canManageInternships'] ?? false,
      canManageEnquiries: json['canManageEnquiries'] ?? false,
      canManageLeads: json['canManageLeads'] ?? false,
      status: json['status'] ?? 'enquiry',
      createdAt: json['createdAt'] != null
          ? DateTime.tryParse(json['createdAt'].toString())
          : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      '_id': id,
      'name': name,
      'email': email,
      'username': username,
      'role': role,
      'employeeId': employeeId,
      'jobRole': jobRole,
      'department': department,
      'dateOfJoining': dateOfJoining?.toIso8601String(),
      'bankName': bankName,
      'bankAccountNo': bankAccountNo,
      'ifscCode': ifscCode,
      'profilePicture': profilePicture,
      'contact': contact,
      'payslip': payslip,
      'canManageInternships': canManageInternships,
      'canManageEnquiries': canManageEnquiries,
      'canManageLeads': canManageLeads,
      'status': status,
      'createdAt': createdAt?.toIso8601String(),
    };
  }

  UserModel copyWith({
    String? name,
    String? email,
    String? contact,
    String? bankName,
    String? bankAccountNo,
    String? ifscCode,
    String? profilePicture,
  }) {
    return UserModel(
      id: id,
      name: name ?? this.name,
      email: email ?? this.email,
      username: username,
      role: role,
      employeeId: employeeId,
      jobRole: jobRole,
      department: department,
      dateOfJoining: dateOfJoining,
      bankName: bankName ?? this.bankName,
      bankAccountNo: bankAccountNo ?? this.bankAccountNo,
      ifscCode: ifscCode ?? this.ifscCode,
      profilePicture: profilePicture ?? this.profilePicture,
      contact: contact ?? this.contact,
      payslip: payslip,
      canManageInternships: canManageInternships,
      canManageEnquiries: canManageEnquiries,
      canManageLeads: canManageLeads,
      status: status,
      createdAt: createdAt,
    );
  }
}
