import 'package:equatable/equatable.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import '../data/models/request_model.dart';
import '../data/repository/request_repository.dart';

abstract class RequestState extends Equatable {
  const RequestState();
  @override
  List<Object?> get props => [];
}

class RequestInitial extends RequestState {}
class RequestLoading extends RequestState {}

class RequestLoaded extends RequestState {
  final List<RequestModel> requests;
  final int pendingCount;
  const RequestLoaded({required this.requests, this.pendingCount = 0});

  @override
  List<Object?> get props => [requests, pendingCount];
}

class RequestFailure extends RequestState {
  final String message;
  const RequestFailure(this.message);

  @override
  List<Object?> get props => [message];
}

class RequestCubit extends Cubit<RequestState> {
  final RequestRepository _repository;

  RequestCubit({RequestRepository? repository})
      : _repository = repository ?? RequestRepository(),
        super(RequestInitial());

  Future<void> loadMyRequests() async {
    emit(RequestLoading());
    try {
      final list = await _repository.getMyRequests();
      emit(RequestLoaded(requests: list));
    } catch (e) {
      emit(RequestFailure(e.toString()));
    }
  }

  Future<void> loadIncomingRequests() async {
    emit(RequestLoading());
    try {
      final list = await _repository.getIncomingRequests();
      final count = await _repository.getPendingRequestsCount();
      emit(RequestLoaded(requests: list, pendingCount: count));
    } catch (e) {
      emit(RequestFailure(e.toString()));
    }
  }

  Future<void> createRequest(String subject, String description, String type, String? websiteLink, String? recipientId) async {
    emit(RequestLoading());
    try {
      await _repository.addRequest(subject, description, type, websiteLink, recipientId);
      await loadMyRequests();
    } catch (e) {
      emit(RequestFailure(e.toString()));
    }
  }

  Future<void> reviewRequest(String id, Map<String, dynamic> requestData) async {
    emit(RequestLoading());
    try {
      await _repository.updateRequest(id, requestData);
      await loadIncomingRequests();
    } catch (e) {
      emit(RequestFailure(e.toString()));
    }
  }

  Future<void> removeRequest(String id) async {
    emit(RequestLoading());
    try {
      await _repository.deleteRequest(id);
      await loadMyRequests();
    } catch (e) {
      emit(RequestFailure(e.toString()));
    }
  }
}
