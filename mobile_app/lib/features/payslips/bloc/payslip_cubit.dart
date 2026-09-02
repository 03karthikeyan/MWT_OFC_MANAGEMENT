import 'package:equatable/equatable.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import '../data/models/payslip_model.dart';
import '../data/repository/payslip_repository.dart';

abstract class PayslipState extends Equatable {
  const PayslipState();
  @override
  List<Object?> get props => [];
}

class PayslipInitial extends PayslipState {}
class PayslipLoading extends PayslipState {}

class PayslipLoaded extends PayslipState {
  final List<PayslipModel> payslips;
  const PayslipLoaded(this.payslips);

  @override
  List<Object?> get props => [payslips];
}

class PayslipFailure extends PayslipState {
  final String message;
  const PayslipFailure(this.message);

  @override
  List<Object?> get props => [message];
}

class PayslipCubit extends Cubit<PayslipState> {
  final PayslipRepository _repository;

  PayslipCubit({PayslipRepository? repository})
      : _repository = repository ?? PayslipRepository(),
        super(PayslipInitial());

  Future<void> loadMyPayslips() async {
    emit(PayslipLoading());
    try {
      final list = await _repository.fetchMyPayslips();
      emit(PayslipLoaded(list));
    } catch (e) {
      emit(PayslipFailure(e.toString()));
    }
  }

  Future<void> loadUserPayslipHistory(String userId) async {
    emit(PayslipLoading());
    try {
      final list = await _repository.getUserPayslips(userId);
      emit(PayslipLoaded(list));
    } catch (e) {
      emit(PayslipFailure(e.toString()));
    }
  }

  Future<void> createPayslip(String userId, Map<String, dynamic> data) async {
    emit(PayslipLoading());
    try {
      await _repository.generatePayslip(userId, data);
      await loadUserPayslipHistory(userId);
    } catch (e) {
      emit(PayslipFailure(e.toString()));
    }
  }

  Future<void> removePayslip(String id, String userId) async {
    emit(PayslipLoading());
    try {
      await _repository.removePayslip(id);
      await loadUserPayslipHistory(userId);
    } catch (e) {
      emit(PayslipFailure(e.toString()));
    }
  }
}
