import 'package:equatable/equatable.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import '../data/models/notification_model.dart';
import '../data/repository/notification_repository.dart';

abstract class NotificationState extends Equatable {
  const NotificationState();
  @override
  List<Object?> get props => [];
}

class NotificationInitial extends NotificationState {}
class NotificationLoading extends NotificationState {}

class NotificationLoaded extends NotificationState {
  final List<NotificationModel> notifications;
  const NotificationLoaded(this.notifications);

  @override
  List<Object?> get props => [notifications];
}

class NotificationFailure extends NotificationState {
  final String message;
  const NotificationFailure(this.message);

  @override
  List<Object?> get props => [message];
}

class NotificationCubit extends Cubit<NotificationState> {
  final NotificationRepository _repository;

  NotificationCubit({NotificationRepository? repository})
      : _repository = repository ?? NotificationRepository(),
        super(NotificationInitial());

  Future<void> loadMyNotifications() async {
    emit(NotificationLoading());
    try {
      final list = await _repository.getMyNotifications();
      emit(NotificationLoaded(list));
    } catch (e) {
      emit(NotificationFailure(e.toString()));
    }
  }

  Future<void> loadAllNotifications() async {
    emit(NotificationLoading());
    try {
      final list = await _repository.getAllNotifications();
      emit(NotificationLoaded(list));
    } catch (e) {
      emit(NotificationFailure(e.toString()));
    }
  }

  Future<void> publishNotification(Map<String, dynamic> data) async {
    emit(NotificationLoading());
    try {
      await _repository.sendNotification(data);
      await loadAllNotifications();
    } catch (e) {
      emit(NotificationFailure(e.toString()));
    }
  }

  Future<void> removeNotification(String id, bool isAdmin) async {
    emit(NotificationLoading());
    try {
      await _repository.deleteNotification(id);
      if (isAdmin) {
        await loadAllNotifications();
      } else {
        await loadMyNotifications();
      }
    } catch (e) {
      emit(NotificationFailure(e.toString()));
    }
  }

  // Socket callback integration
  void onNewNotificationReceived(NotificationModel newNotification) {
    final currentState = state;
    if (currentState is NotificationLoaded) {
      final updatedList = List<NotificationModel>.from(currentState.notifications)
        ..insert(0, newNotification);
      emit(NotificationLoaded(updatedList));
    }
  }
}
