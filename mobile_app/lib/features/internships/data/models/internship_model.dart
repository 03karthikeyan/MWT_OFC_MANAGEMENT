import '../../../../features/auth/data/models/user_model.dart';

class DocumentsModel {
  final bool certificate;
  final bool offerLetter;
  final bool completionLetter;
  final bool bill;

  DocumentsModel({
    required this.certificate,
    required this.offerLetter,
    required this.completionLetter,
    required this.bill,
  });

  factory DocumentsModel.fromJson(Map<String, dynamic> json) {
    return DocumentsModel(
      certificate: json['certificate'] ?? false,
      offerLetter: json['offerLetter'] ?? false,
      completionLetter: json['completionLetter'] ?? false,
      bill: json['bill'] ?? false,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'certificate': certificate,
      'offerLetter': offerLetter,
      'completionLetter': completionLetter,
      'bill': bill,
    };
  }
}

class InternshipModel {
  final String id;
  final String name;
  final String email;
  final String? phone;
  final String? college;
  final String? year;
  final String domain;
  final String duration;
  final DateTime? startDate;
  final DateTime? endDate;
  final String? leadManagerId;
  final UserModel? leadManager;
  final double fees;
  final String status;
  final String about;
  final DocumentsModel documents;
  final String? notes;
  final String? billNumber;
  final DateTime? billDate;
  final double billAmount;
  final double paidAmount;
  final String? billDescription;
  final String billPaid;
  final DateTime? createdAt;

  InternshipModel({
    required this.id,
    required this.name,
    required this.email,
    this.phone,
    this.college,
    this.year,
    required this.domain,
    required this.duration,
    this.startDate,
    this.endDate,
    this.leadManagerId,
    this.leadManager,
    required this.fees,
    required this.status,
    required this.about,
    required this.documents,
    this.notes,
    this.billNumber,
    this.billDate,
    required this.billAmount,
    required this.paidAmount,
    this.billDescription,
    required this.billPaid,
    this.createdAt,
  });

  factory InternshipModel.fromJson(Map<String, dynamic> json) {
    String? leadManagerId;
    UserModel? leadManager;
    final rawLead = json['leadManager'];
    if (rawLead is Map<String, dynamic>) {
      leadManager = UserModel.fromJson(rawLead);
      leadManagerId = leadManager.id;
    } else if (rawLead is String) {
      leadManagerId = rawLead;
    }

    return InternshipModel(
      id: json['_id'] ?? json['id'] ?? '',
      name: json['name'] ?? '',
      email: json['email'] ?? '',
      phone: json['phone'],
      college: json['college'],
      year: json['year'],
      domain: json['domain'] ?? '',
      duration: json['duration']?.toString() ?? '',
      startDate: json['startDate'] != null ? DateTime.tryParse(json['startDate'].toString()) : null,
      endDate: json['endDate'] != null ? DateTime.tryParse(json['endDate'].toString()) : null,
      leadManagerId: leadManagerId,
      leadManager: leadManager,
      fees: double.tryParse(json['fees']?.toString() ?? '') ?? 0.0,
      status: json['status'] ?? 'Pending',
      about: json['about'] ?? 'enquiry',
      documents: (json['documents'] is Map)
          ? DocumentsModel.fromJson(json['documents'] as Map<String, dynamic>)
          : DocumentsModel(certificate: false, offerLetter: false, completionLetter: false, bill: false),
      notes: json['notes'],
      billNumber: json['billNumber'],
      billDate: json['billDate'] != null ? DateTime.tryParse(json['billDate'].toString()) : null,
      billAmount: double.tryParse(json['billAmount']?.toString() ?? '') ?? 0.0,
      paidAmount: double.tryParse(json['paidAmount']?.toString() ?? '') ?? 0.0,
      billDescription: json['billDescription'],
      billPaid: json['billPaid'] ?? 'Unpaid',
      createdAt: json['createdAt'] != null ? DateTime.tryParse(json['createdAt'].toString()) : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      '_id': id,
      'name': name,
      'email': email,
      'phone': phone,
      'college': college,
      'year': year,
      'domain': domain,
      'duration': duration,
      'startDate': startDate?.toIso8601String(),
      'endDate': endDate?.toIso8601String(),
      'leadManager': leadManager != null ? leadManager!.toJson() : leadManagerId,
      'fees': fees,
      'status': status,
      'about': about,
      'documents': documents.toJson(),
      'notes': notes,
      'billNumber': billNumber,
      'billDate': billDate?.toIso8601String(),
      'billAmount': billAmount,
      'paidAmount': paidAmount,
      'billDescription': billDescription,
      'billPaid': billPaid,
    };
  }
}
