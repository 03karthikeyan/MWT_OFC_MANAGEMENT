import '../../../../features/auth/data/models/user_model.dart';

class AssetModel {
  final String id;
  final String name;
  final String category;
  final String assetTag;
  final String serialNumber;
  final UserModel? assignedTo;
  final DateTime? allocatedDate;
  final DateTime? returnDate;
  final String status;
  final String specifications;
  final String condition;
  final String notes;

  AssetModel({
    required this.id,
    required this.name,
    required this.category,
    required this.assetTag,
    required this.serialNumber,
    this.assignedTo,
    this.allocatedDate,
    this.returnDate,
    required this.status,
    this.specifications = '',
    this.condition = 'Good',
    this.notes = '',
  });

  factory AssetModel.fromJson(Map<String, dynamic> json) {
    UserModel? assignedTo;
    if (json['assignedTo'] is Map<String, dynamic>) {
      assignedTo = UserModel.fromJson(json['assignedTo']);
    }

    return AssetModel(
      id: json['_id'] ?? json['id'] ?? '',
      name: json['name'] ?? '',
      category: json['category'] ?? 'Laptop',
      assetTag: json['assetTag'] ?? '',
      serialNumber: json['serialNumber'] ?? '',
      assignedTo: assignedTo,
      allocatedDate: json['allocatedDate'] != null ? DateTime.tryParse(json['allocatedDate'].toString()) : null,
      returnDate: json['returnDate'] != null ? DateTime.tryParse(json['returnDate'].toString()) : null,
      status: json['status'] ?? 'available',
      specifications: json['specifications'] ?? '',
      condition: json['condition'] ?? 'Good',
      notes: json['notes'] ?? '',
    );
  }
}
