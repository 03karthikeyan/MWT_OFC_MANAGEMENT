import 'package:equatable/equatable.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import '../data/models/expense_model.dart';
import '../data/repository/expense_repository.dart';

abstract class ExpenseState extends Equatable {
  const ExpenseState();
  @override
  List<Object?> get props => [];
}

class ExpenseInitial extends ExpenseState {}
class ExpenseLoading extends ExpenseState {}

class ExpenseLoaded extends ExpenseState {
  final List<ExpenseModel> expenses;
  const ExpenseLoaded({required this.expenses});

  @override
  List<Object?> get props => [expenses];
}

class ExpenseFailure extends ExpenseState {
  final String message;
  const ExpenseFailure(this.message);

  @override
  List<Object?> get props => [message];
}

class ExpenseCubit extends Cubit<ExpenseState> {
  final ExpenseRepository _repository;

  ExpenseCubit({ExpenseRepository? repository})
      : _repository = repository ?? ExpenseRepository(),
        super(ExpenseInitial());

  Future<void> loadExpenses({required bool isAdmin, String? status, String? category}) async {
    emit(ExpenseLoading());
    try {
      final list = isAdmin
          ? await _repository.getAllExpenses(status: status, category: category)
          : await _repository.getMyExpenses();
      emit(ExpenseLoaded(expenses: list));
    } catch (e) {
      emit(ExpenseFailure(e.toString()));
    }
  }

  Future<void> submitExpense({
    required String title,
    required String category,
    required double amount,
    DateTime? date,
    String? description,
    String? receiptUrl,
  }) async {
    try {
      await _repository.submitExpense(
        title: title,
        category: category,
        amount: amount,
        date: date,
        description: description,
        receiptUrl: receiptUrl,
      );
      await loadExpenses(isAdmin: false);
    } catch (e) {
      emit(ExpenseFailure(e.toString()));
    }
  }

  Future<void> updateStatus(String id, String status, {String? reviewNote, required bool isAdmin}) async {
    try {
      await _repository.updateExpenseStatus(id, status, reviewNote: reviewNote);
      await loadExpenses(isAdmin: isAdmin);
    } catch (e) {
      emit(ExpenseFailure(e.toString()));
    }
  }

  Future<void> deleteExpense(String id, {required bool isAdmin}) async {
    try {
      await _repository.deleteExpense(id);
      await loadExpenses(isAdmin: isAdmin);
    } catch (e) {
      emit(ExpenseFailure(e.toString()));
    }
  }
}
