import 'package:equatable/equatable.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import '../data/models/project_model.dart';
import '../data/repository/project_repository.dart';

abstract class ProjectState extends Equatable {
  const ProjectState();
  @override
  List<Object?> get props => [];
}

class ProjectInitial extends ProjectState {}
class ProjectLoading extends ProjectState {}

class ProjectLoaded extends ProjectState {
  final List<ProjectModel> projects;
  const ProjectLoaded(this.projects);

  @override
  List<Object?> get props => [projects];
}

class ProjectFailure extends ProjectState {
  final String message;
  const ProjectFailure(this.message);

  @override
  List<Object?> get props => [message];
}

class ProjectCubit extends Cubit<ProjectState> {
  final ProjectRepository _repository;

  ProjectCubit({ProjectRepository? repository})
      : _repository = repository ?? ProjectRepository(),
        super(ProjectInitial());

  Future<void> loadProjects() async {
    emit(ProjectLoading());
    try {
      final list = await _repository.getProjects();
      emit(ProjectLoaded(list));
    } catch (e) {
      emit(ProjectFailure(e.toString()));
    }
  }

  Future<void> createProject(Map<String, dynamic> data) async {
    emit(ProjectLoading());
    try {
      await _repository.addProject(data);
      await loadProjects();
    } catch (e) {
      emit(ProjectFailure(e.toString()));
    }
  }

  Future<void> editProject(String id, Map<String, dynamic> data) async {
    emit(ProjectLoading());
    try {
      await _repository.updateProject(id, data);
      await loadProjects();
    } catch (e) {
      emit(ProjectFailure(e.toString()));
    }
  }

  Future<void> removeProject(String id) async {
    emit(ProjectLoading());
    try {
      await _repository.deleteProject(id);
      await loadProjects();
    } catch (e) {
      emit(ProjectFailure(e.toString()));
    }
  }
}
