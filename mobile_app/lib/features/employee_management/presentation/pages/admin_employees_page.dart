import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:go_router/go_router.dart';
import '../../../../core/theme/app_theme.dart';
import '../../../../shared/widgets/avatar.dart';
import '../../../../shared/widgets/cards.dart';
import '../../../../shared/widgets/chips.dart';
import '../../../../shared/widgets/feedback.dart';
import '../../../../shared/widgets/layout.dart';
import '../../../../shared/widgets/text_fields.dart';
import '../../bloc/employees_cubit.dart';

class AdminEmployeesPage extends StatefulWidget {
  const AdminEmployeesPage({super.key});

  @override
  State<AdminEmployeesPage> createState() => _AdminEmployeesPageState();
}

class _AdminEmployeesPageState extends State<AdminEmployeesPage> {
  String? _searchQuery;

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  void _loadData() {
    context.read<EmployeesCubit>().loadEmployees();
  }

  @override
  Widget build(BuildContext context) {
    return AppScaffold(
      title: 'Employees Directory',
      showAppBar: true,
      floatingActionButton: FloatingActionButton(
        onPressed: () => context.push('/admin/employees/add'),
        backgroundColor: AppTheme.primary,
        child: const Icon(Icons.person_add_alt_1_outlined, color: Colors.white),
      ),
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.all(16),
            child: SearchField(
              hint: 'Search by name or email...',
              onChanged: (val) {
                setState(() {
                  _searchQuery = val.trim().isEmpty ? null : val.trim().toLowerCase();
                });
              },
            ),
          ),
          Expanded(
            child: BlocBuilder<EmployeesCubit, EmployeesState>(
              builder: (context, state) {
                if (state is EmployeesLoading) {
                  return const LoadingState();
                }
                if (state is EmployeesFailure) {
                  return ErrorState(message: state.message, onRetry: _loadData);
                }
                if (state is EmployeesLoaded) {
                  var filteredList = state.employees;
                  if (_searchQuery != null) {
                    filteredList = filteredList.where((emp) {
                      return emp.name.toLowerCase().contains(_searchQuery!) ||
                          (emp.email?.toLowerCase().contains(_searchQuery!) ?? false);
                    }).toList();
                  }

                  if (filteredList.isEmpty) {
                    return const EmptyState(
                      title: 'No Employee Records',
                      message: 'No employees matched the query search filters.',
                    );
                  }

                  return RefreshIndicator(
                    onRefresh: () async => _loadData(),
                    child: ListView.builder(
                      padding: const EdgeInsets.symmetric(horizontal: 16),
                      itemCount: filteredList.length,
                      itemBuilder: (context, index) {
                        final emp = filteredList[index];
                        return Container(
                          margin: const EdgeInsets.symmetric(vertical: 4),
                          child: AppCard(
                            onTap: () => context.push('/admin/employees/${emp.id}'),
                            child: Row(
                              children: [
                                Avatar(url: emp.profilePicture, name: emp.name, size: 48),
                                const SizedBox(width: 12),
                                Expanded(
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      Text(emp.name, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 15)),
                                      Text(
                                        '${emp.jobRole} • ${emp.department}',
                                        style: const TextStyle(color: AppTheme.textLight, fontSize: 12),
                                      ),
                                      const SizedBox(height: 2),
                                      Text(
                                        'ID: ${emp.employeeId ?? 'Pending'}',
                                        style: const TextStyle(color: AppTheme.primary, fontSize: 11, fontWeight: FontWeight.bold),
                                      ),
                                    ],
                                  ),
                                ),
                                StatusChip(label: emp.status, status: emp.status),
                              ],
                            ),
                          ),
                        );
                      },
                    ),
                  );
                }
                return const EmptyState();
              },
            ),
          ),
        ],
      ),
    );
  }
}
