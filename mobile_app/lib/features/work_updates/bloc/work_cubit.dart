import 'package:equatable/equatable.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import '../data/models/work_update_model.dart';
import '../data/repository/work_repository.dart';

abstract class WorkState extends Equatable {
  const WorkState();
  @override
  List<Object?> get props => [];
}

class WorkInitial extends WorkState {}
class WorkLoading extends WorkState {}

class WorkLoaded extends WorkState {
  final List<WorkUpdateModel> workUpdates;
  const WorkLoaded(this.workUpdates);

  @override
  List<Object?> get props => [workUpdates];
}

class WorkFailure extends WorkState {
  final String message;
  const WorkFailure(this.message);

  @override
  List<Object?> get props => [message];
}

class WorkCubit extends Cubit<WorkState> {
  final WorkRepository _repository;

  WorkCubit({WorkRepository? repository})
      : _repository = repository ?? WorkRepository(),
        super(WorkInitial());

  Future<void> loadMyWork({String? date, String? status, String? search}) async {
    emit(WorkLoading());
    try {
      final list = await _repository.getMyWork(date: date, status: status, search: search);
      emit(WorkLoaded(list));
    } catch (e) {
      emit(WorkFailure(e.toString()));
    }
  }

  Future<void> loadTeamWorkJournal({String? userId, String? date, String? status, String? search}) async {
    emit(WorkLoading());
    try {
      final list = await _repository.getAllWork(userId: userId, date: date, status: status, search: search);
      emit(WorkLoaded(list));
    } catch (e) {
      emit(WorkFailure(e.toString()));
    }
  }

  Future<void> createWorkUpdate({
    required String title,
    required String description,
    required String status,
    String? projectId,
    required DateTime date,
    required bool isAdminJournal,
    String? filterUserId,
  }) async {
    emit(WorkLoading());
    try {
      await _repository.addWork(title, description, status, projectId, date);
      if (isAdminJournal) {
        await loadTeamWorkJournal(userId: filterUserId);
      } else {
        await loadMyWork();
      }
    } catch (e) {
      emit(WorkFailure(e.toString()));
    }
  }

  Future<void> editWorkUpdate({
    required String id,
    required Map<String, dynamic> updateData,
    required bool isAdminJournal,
    String? filterUserId,
  }) async {
    emit(WorkLoading());
    try {
      await _repository.updateWork(id, updateData);
      if (isAdminJournal) {
        await loadTeamWorkJournal(userId: filterUserId);
      } else {
        await loadMyWork();
      }
    } catch (e) {
      emit(WorkFailure(e.toString()));
    }
  }

  Future<void> removeWorkUpdate({
    required String id,
    required bool isAdminJournal,
    String? filterUserId,
  }) async {
    emit(WorkLoading());
    try {
      await _repository.deleteWork(id);
      if (isAdminJournal) {
        await loadTeamWorkJournal(userId: filterUserId);
      } else {
        await loadMyWork();
      }
    } catch (e) {
      emit(WorkFailure(e.toString()));
    }
  }
}
