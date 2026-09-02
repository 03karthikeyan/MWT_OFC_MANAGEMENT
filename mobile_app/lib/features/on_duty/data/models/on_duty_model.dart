import '../../../../features/auth/data/models/user_model.dart';

class ExpenseModel {
  final String? title;
  final double price;

  ExpenseModel({
    this.title,
    required this.price,
  });

  factory ExpenseModel.fromJson(Map<String, dynamic> json) {
    return ExpenseModel(
      title: json['title'],
      price: (json['price'] ?? 0).toDouble(),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'title': title,
      'price': price,
    };
  }
}

class OnDutyModel {
  final String id;
  final String userId;
  final UserModel? user;
  final DateTime date;
  final String reason;
  final ExpenseModel? expenses;
  final String status;
  final DateTime? createdAt;

  OnDutyModel({
    required this.id,
    required this.userId,
    this.user,
    required this.date,
    required this.reason,
    this.expenses,
    required this.status,
    this.createdAt,
  });

  factory OnDutyModel.fromJson(Map<String, dynamic> json) {
    String userId = '';
    UserModel? user;
    final rawUser = json['userId'];
    if (rawUser is Map<String, dynamic>) {
      user = UserModel.fromJson(rawUser);
      userId = user.id;
    } else if (rawUser is String) {
      userId = rawUser;
    }

    ExpenseModel? expenses;
    if (json['expenses'] != null) {
      expenses = ExpenseModel.fromJson(json['expenses'] as Map<String, dynamic>);
    }

    return OnDutyModel(
      id: json['_id'] ?? json['id'] ?? '',
      userId: userId,
      user: user,
      date: DateTime.parse(json['date'].toString()),
      reason: json['reason'] ?? '',
      expenses: expenses,
      status: json['status'] ?? 'pending',
      createdAt: json['createdAt'] != null ? DateTime.tryParse(json['createdAt'].toString()) : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      '_id': id,
      'userId': user != null ? user!.toJson() : userId,
      'date': date.toIso8601String(),
      'reason': reason,
      'expenses': expenses?.toJson(),
      'status': status,
    };
  }
}
