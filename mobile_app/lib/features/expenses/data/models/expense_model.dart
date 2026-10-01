import '../../../../features/auth/data/models/user_model.dart';

class ExpenseModel {
  final String id;
  final String userId;
  final UserModel? user;
  final String title;
  final String category;
  final double amount;
  final DateTime date;
  final String description;
  final String receiptUrl;
  final String status;
  final String? reviewNote;
  final DateTime? reimbursedAt;
  final DateTime? createdAt;

  ExpenseModel({
    required this.id,
    required this.userId,
    this.user,
    required this.title,
    required this.category,
    required this.amount,
    required this.date,
    required this.description,
    this.receiptUrl = '',
    required this.status,
    this.reviewNote,
    this.reimbursedAt,
    this.createdAt,
  });

  factory ExpenseModel.fromJson(Map<String, dynamic> json) {
    UserModel? user;
    String userId = '';
    if (json['userId'] is Map<String, dynamic>) {
      user = UserModel.fromJson(json['userId']);
      userId = user.id;
    } else if (json['userId'] is String) {
      userId = json['userId'];
    }

    return ExpenseModel(
      id: json['_id'] ?? json['id'] ?? '',
      userId: userId,
      user: user,
      title: json['title'] ?? '',
      category: json['category'] ?? 'Other',
      amount: (json['amount'] is num) ? (json['amount'] as num).toDouble() : 0.0,
      date: json['date'] != null ? DateTime.parse(json['date'].toString()) : DateTime.now(),
      description: json['description'] ?? '',
      receiptUrl: json['receiptUrl'] ?? '',
      status: json['status'] ?? 'pending',
      reviewNote: json['reviewNote'],
      reimbursedAt: json['reimbursedAt'] != null ? DateTime.tryParse(json['reimbursedAt'].toString()) : null,
      createdAt: json['createdAt'] != null ? DateTime.tryParse(json['createdAt'].toString()) : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'title': title,
      'category': category,
      'amount': amount,
      'date': date.toIso8601String(),
      'description': description,
      'receiptUrl': receiptUrl,
    };
  }
}
