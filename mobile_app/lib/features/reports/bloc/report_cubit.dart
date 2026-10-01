import 'package:equatable/equatable.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import '../data/models/report_model.dart';
import '../data/repository/report_repository.dart';

abstract class ReportState extends Equatable {
  const ReportState();
  @override
  List<Object?> get props => [];
}

class ReportInitial extends ReportState {}
class ReportLoading extends ReportState {}

class ReportLoaded extends ReportState {
  final MusterRollReport? musterRoll;
  final HRSummaryOverview? overview;
  const ReportLoaded({this.musterRoll, this.overview});

  @override
  List<Object?> get props => [musterRoll, overview];
}

class ReportFailure extends ReportState {
  final String message;
  const ReportFailure(this.message);

  @override
  List<Object?> get props => [message];
}

class ReportCubit extends Cubit<ReportState> {
  final ReportRepository _repository;

  ReportCubit({ReportRepository? repository})
      : _repository = repository ?? ReportRepository(),
        super(ReportInitial());

  Future<void> loadReportData({required int month, required int year}) async {
    emit(ReportLoading());
    try {
      final overview = await _repository.getSummaryOverview();
      final musterRoll = await _repository.getMusterRoll(month: month, year: year);
      emit(ReportLoaded(musterRoll: musterRoll, overview: overview));
    } catch (e) {
      emit(ReportFailure(e.toString()));
    }
  }
}
