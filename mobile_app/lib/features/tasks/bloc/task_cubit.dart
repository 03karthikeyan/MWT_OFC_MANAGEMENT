import 'package:equatable/equatable.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import '../data/models/task_model.dart';
import '../data/repository/task_repository.dart';

abstract class TaskState extends Equatable {
  const TaskState();
  @override
  List<Object?> get props => [];
}

class TaskInitial extends TaskState {}
class TaskLoading extends TaskState {}

class TaskLoaded extends TaskState {
  final List<TaskModel> tasks;
  const TaskLoaded({required this.tasks});

  @override
  List<Object?> get props => [tasks];
}

class TaskFailure extends TaskState {
  final String message;
  const TaskFailure(this.message);

  @override
  List<Object?> get props => [message];
}

class TaskCubit extends Cubit<TaskState> {
  final TaskRepository _repository;

  TaskCubit({TaskRepository? repository})
      : _repository = repository ?? TaskRepository(),
        super(TaskInitial());

  Future<void> loadTasks({required bool isAdmin, String? status, String? priority}) async {
    emit(TaskLoading());
    try {
      final list = isAdmin
          ? await _repository.getAllTasks(status: status, priority: priority)
          : await _repository.getMyTasks(status: status, priority: priority);
      emit(TaskLoaded(tasks: list));
    } catch (e) {
      emit(TaskFailure(e.toString()));
    }
  }

  Future<void> createTask({
    required String title,
    String? description,
    required String assignedTo,
    String? projectId,
    String priority = 'medium',
    DateTime? dueDate,
  }) async {
    try {
      await _repository.createTask(
        title: title,
        description: description,
        assignedTo: assignedTo,
        projectId: projectId,
        priority: priority,
        dueDate: dueDate,
      );
      await loadTasks(isAdmin: true);
    } catch (e) {
      emit(TaskFailure(e.toString()));
    }
  }

  Future<void> updateStatus(String id, {String? status, int? progress, required bool isAdmin}) async {
    try {
      await _repository.updateTaskStatus(id, status: status, progress: progress);
      await loadTasks(isAdmin: isAdmin);
    } catch (e) {
      emit(TaskFailure(e.toString()));
    }
  }

  Future<void> addComment(String id, String message, {required bool isAdmin}) async {
    try {
      await _repository.addComment(id, message);
      await loadTasks(isAdmin: isAdmin);
    } catch (e) {
      emit(TaskFailure(e.toString()));
    }
  }

  Future<void> deleteTask(String id) async {
    try {
      await _repository.deleteTask(id);
      await loadTasks(isAdmin: true);
    } catch (e) {
      emit(TaskFailure(e.toString()));
    }
  }
}
