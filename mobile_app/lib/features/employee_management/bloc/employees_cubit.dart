import 'package:equatable/equatable.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import '../../../features/auth/data/models/user_model.dart';
import '../data/repository/employee_repository.dart';

abstract class EmployeesState extends Equatable {
  const EmployeesState();
  @override
  List<Object?> get props => [];
}

class EmployeesInitial extends EmployeesState {}
class EmployeesLoading extends EmployeesState {}

class EmployeesLoaded extends EmployeesState {
  final List<UserModel> employees;
  final List<UserModel> leads;
  const EmployeesLoaded({required this.employees, required this.leads});

  @override
  List<Object?> get props => [employees, leads];
}

class EmployeesFailure extends EmployeesState {
  final String message;
  const EmployeesFailure(this.message);

  @override
  List<Object?> get props => [message];
}

class EmployeesCubit extends Cubit<EmployeesState> {
  final EmployeeRepository _repository;

  EmployeesCubit({EmployeeRepository? repository})
      : _repository = repository ?? EmployeeRepository(),
        super(EmployeesInitial());

  Future<void> loadEmployees() async {
    emit(EmployeesLoading());
    try {
      final employees = await _repository.getUsers();
      final leads = await _repository.getLeads();
      emit(EmployeesLoaded(employees: employees, leads: leads));
    } catch (e) {
      emit(EmployeesFailure(e.toString()));
    }
  }

  Future<void> createEmployee(Map<String, dynamic> data) async {
    emit(EmployeesLoading());
    try {
      await _repository.addUser(data);
      await loadEmployees();
    } catch (e) {
      emit(EmployeesFailure(e.toString()));
    }
  }

  Future<void> editEmployee(String id, Map<String, dynamic> data) async {
    emit(EmployeesLoading());
    try {
      await _repository.updateUser(id, data);
      await loadEmployees();
    } catch (e) {
      emit(EmployeesFailure(e.toString()));
    }
  }

  Future<void> removeEmployee(String id) async {
    emit(EmployeesLoading());
    try {
      await _repository.deleteUser(id);
      await loadEmployees();
    } catch (e) {
      emit(EmployeesFailure(e.toString()));
    }
  }
}
