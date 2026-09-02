import 'package:equatable/equatable.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import '../data/models/attendance_model.dart';
import '../data/models/holiday_model.dart';
import '../data/repository/attendance_repository.dart';

abstract class AttendanceState extends Equatable {
  const AttendanceState();
  @override
  List<Object?> get props => [];
}

class AttendanceInitial extends AttendanceState {}
class AttendanceLoading extends AttendanceState {}

class AttendanceLoaded extends AttendanceState {
  final List<AttendanceModel> history;
  final AttendanceModel? today;
  final List<HolidayModel> holidays;
  final Map<String, dynamic> summary;

  const AttendanceLoaded({
    required this.history,
    this.today,
    required this.holidays,
    required this.summary,
  });

  @override
  List<Object?> get props => [history, today, holidays, summary];
}

class AttendanceFailure extends AttendanceState {
  final String message;
  const AttendanceFailure(this.message);

  @override
  List<Object?> get props => [message];
}

class AttendanceCubit extends Cubit<AttendanceState> {
  final AttendanceRepository _repository;

  AttendanceCubit({AttendanceRepository? repository})
      : _repository = repository ?? AttendanceRepository(),
        super(AttendanceInitial());

  Future<void> loadAttendance({String? month, String? year, bool showLoading = true}) async {
    if (showLoading) {
      emit(AttendanceLoading());
    }
    try {
      final history = await _repository.getMyAttendance(month: month);
      final today = await _repository.getTodayAttendance();
      final holidays = await _repository.getHolidays();
      final summary = await _repository.getAttendanceSummary(month: month, year: year);

      emit(AttendanceLoaded(
        history: history,
        today: today,
        holidays: holidays,
        summary: summary,
      ));
    } catch (e) {
      emit(AttendanceFailure(e.toString()));
    }
  }

  Future<void> loadTeamAttendance({String? date}) async {
    emit(AttendanceLoading());
    try {
      final history = await _repository.getAllAttendance(date: date);
      emit(AttendanceLoaded(
        history: history,
        holidays: const [],
        summary: const {},
      ));
    } catch (e) {
      emit(AttendanceFailure(e.toString()));
    }
  }

  Future<void> performCheckIn() async {
    final currentState = state;
    emit(AttendanceLoading());
    try {
      await _repository.checkIn();
      await loadAttendance();
    } catch (e) {
      emit(AttendanceFailure(e.toString()));
      if (currentState is AttendanceLoaded) {
        emit(currentState);
      }
    }
  }

  Future<void> performCheckOut() async {
    final currentState = state;
    emit(AttendanceLoading());
    try {
      await _repository.checkOut();
      await loadAttendance();
    } catch (e) {
      emit(AttendanceFailure(e.toString()));
      if (currentState is AttendanceLoaded) {
        emit(currentState);
      }
    }
  }
}
