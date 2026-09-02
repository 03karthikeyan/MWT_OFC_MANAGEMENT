import 'package:equatable/equatable.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import '../data/models/on_duty_model.dart';
import '../data/repository/on_duty_repository.dart';

abstract class OnDutyState extends Equatable {
  const OnDutyState();
  @override
  List<Object?> get props => [];
}

class OnDutyInitial extends OnDutyState {}
class OnDutyLoading extends OnDutyState {}

class OnDutyLoaded extends OnDutyState {
  final List<OnDutyModel> requests;
  final int pendingCount;
  const OnDutyLoaded({required this.requests, this.pendingCount = 0});

  @override
  List<Object?> get props => [requests, pendingCount];
}

class OnDutyFailure extends OnDutyState {
  final String message;
  const OnDutyFailure(this.message);

  @override
  List<Object?> get props => [message];
}

class OnDutyCubit extends Cubit<OnDutyState> {
  final OnDutyRepository _repository;

  OnDutyCubit({OnDutyRepository? repository})
      : _repository = repository ?? OnDutyRepository(),
        super(OnDutyInitial());

  Future<void> loadMyOnDuty() async {
    emit(OnDutyLoading());
    try {
      final list = await _repository.getMyOnDuty();
      emit(OnDutyLoaded(requests: list));
    } catch (e) {
      emit(OnDutyFailure(e.toString()));
    }
  }

  Future<void> loadAllOnDuty({String? status, bool showLoading = true}) async {
    if (showLoading) {
      emit(OnDutyLoading());
    }
    try {
      final list = await _repository.getAllOnDuty(status: status);
      final count = await _repository.getPendingOnDutyCount();
      emit(OnDutyLoaded(requests: list, pendingCount: count));
    } catch (e) {
      emit(OnDutyFailure(e.toString()));
    }
  }

  Future<void> requestOnDuty(DateTime date, String reason, String? expTitle, double expPrice) async {
    emit(OnDutyLoading());
    try {
      await _repository.applyOnDuty(date, reason, expTitle, expPrice);
      await loadMyOnDuty();
    } catch (e) {
      emit(OnDutyFailure(e.toString()));
    }
  }

  Future<void> reviewOnDuty(String id, String status, {bool showLoading = true}) async {
    if (showLoading) {
      emit(OnDutyLoading());
    }
    try {
      await _repository.updateOnDuty(id, status);
      await loadAllOnDuty(showLoading: showLoading);
    } catch (e) {
      emit(OnDutyFailure(e.toString()));
    }
  }

  Future<void> cancelOnDuty(String id) async {
    emit(OnDutyLoading());
    try {
      await _repository.deleteOnDuty(id);
      await loadMyOnDuty();
    } catch (e) {
      emit(OnDutyFailure(e.toString()));
    }
  }
}
