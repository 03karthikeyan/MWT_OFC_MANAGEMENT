import 'package:equatable/equatable.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import '../data/models/leave_model.dart';
import '../data/repository/leave_repository.dart';

abstract class LeaveState extends Equatable {
  const LeaveState();
  @override
  List<Object?> get props => [];
}

class LeaveInitial extends LeaveState {}
class LeaveLoading extends LeaveState {}

class LeaveLoaded extends LeaveState {
  final List<LeaveModel> leaves;
  final int pendingCount;
  final Map<String, dynamic> balances;
  const LeaveLoaded({
    required this.leaves,
    this.pendingCount = 0,
    this.balances = const {'casual': 12, 'sick': 6, 'earned': 15},
  });

  @override
  List<Object?> get props => [leaves, pendingCount, balances];
}

class LeaveFailure extends LeaveState {
  final String message;
  const LeaveFailure(this.message);

  @override
  List<Object?> get props => [message];
}

class LeaveCubit extends Cubit<LeaveState> {
  final LeaveRepository _repository;

  LeaveCubit({LeaveRepository? repository})
      : _repository = repository ?? LeaveRepository(),
        super(LeaveInitial());

  Future<void> loadMyLeaves() async {
    emit(LeaveLoading());
    try {
      final list = await _repository.getMyLeaves();
      final balances = await _repository.getLeaveBalances();
      emit(LeaveLoaded(leaves: list, balances: balances));
    } catch (e) {
      emit(LeaveFailure(e.toString()));
    }
  }

  Future<void> loadAllLeaves({bool showLoading = true}) async {
    if (showLoading) {
      emit(LeaveLoading());
    }
    try {
      final list = await _repository.getAllLeaves();
      final count = await _repository.getPendingLeavesCount();
      emit(LeaveLoaded(leaves: list, pendingCount: count));
    } catch (e) {
      emit(LeaveFailure(e.toString()));
    }
  }

  Future<void> requestLeave(
    DateTime startDate,
    DateTime endDate,
    String reason, {
    String leaveType = 'casual',
    String session = 'full_day',
  }) async {
    emit(LeaveLoading());
    try {
      await _repository.applyLeave(
        startDate,
        endDate,
        reason,
        leaveType: leaveType,
        session: session,
      );
      await loadMyLeaves();
    } catch (e) {
      emit(LeaveFailure(e.toString()));
    }
  }

  Future<void> reviewLeave(
    String id,
    String status, {
    String? rejectionReason,
    bool showLoading = true,
  }) async {
    if (showLoading) {
      emit(LeaveLoading());
    }
    try {
      await _repository.updateLeave(id, status, rejectionReason: rejectionReason);
      await loadAllLeaves(showLoading: showLoading);
    } catch (e) {
      emit(LeaveFailure(e.toString()));
    }
  }

  Future<void> cancelLeave(String id) async {
    emit(LeaveLoading());
    try {
      await _repository.deleteLeave(id);
      await loadMyLeaves();
    } catch (e) {
      emit(LeaveFailure(e.toString()));
    }
  }
}
