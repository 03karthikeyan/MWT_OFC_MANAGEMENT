import 'package:hrms_app/core/network/api_client.dart';
import 'package:hrms_app/core/network/api_constants.dart';
import '../models/expense_model.dart';

class ExpenseRepository {
  final ApiClient _apiClient;

  ExpenseRepository({ApiClient? apiClient}) : _apiClient = apiClient ?? ApiClient();

  Future<List<ExpenseModel>> getMyExpenses() async {
    final response = await _apiClient.get(ApiConstants.myExpenses);
    final data = response.data;
    if (data is Map && data.containsKey('expenses')) {
      final list = data['expenses'] as List;
      return list.map((e) => ExpenseModel.fromJson(e as Map<String, dynamic>)).toList();
    }
    return [];
  }

  Future<List<ExpenseModel>> getAllExpenses({String? status, String? category}) async {
    final response = await _apiClient.get(
      ApiConstants.allExpenses,
      queryParameters: {
        if (status != null) 'status': status,
        if (category != null) 'category': category,
      },
    );
    final data = response.data;
    if (data is Map && data.containsKey('expenses')) {
      final list = data['expenses'] as List;
      return list.map((e) => ExpenseModel.fromJson(e as Map<String, dynamic>)).toList();
    }
    return [];
  }

  Future<ExpenseModel> submitExpense({
    required String title,
    required String category,
    required double amount,
    DateTime? date,
    String? description,
    String? receiptUrl,
  }) async {
    final response = await _apiClient.post(
      ApiConstants.expenses,
      data: {
        'title': title,
        'category': category,
        'amount': amount,
        'date': date?.toIso8601String(),
        'description': description,
        'receiptUrl': receiptUrl,
      },
    );
    final data = response.data as Map<String, dynamic>;
    return ExpenseModel.fromJson(data['expense'] ?? data);
  }

  Future<ExpenseModel> updateExpenseStatus(String id, String status, {String? reviewNote}) async {
    final response = await _apiClient.put(
      ApiConstants.expenseStatus(id),
      data: {
        'status': status,
        if (reviewNote != null) 'reviewNote': reviewNote,
      },
    );
    final data = response.data as Map<String, dynamic>;
    return ExpenseModel.fromJson(data['expense'] ?? data);
  }

  Future<void> deleteExpense(String id) async {
    await _apiClient.delete(ApiConstants.expenseDetail(id));
  }
}
