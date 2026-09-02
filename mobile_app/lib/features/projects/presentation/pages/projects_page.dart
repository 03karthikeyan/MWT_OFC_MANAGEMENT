import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:intl/intl.dart';
import '../../../../core/theme/app_theme.dart';
import '../../../../shared/widgets/cards.dart';
import '../../../../shared/widgets/chips.dart';
import '../../../../shared/widgets/feedback.dart';
import '../../../../shared/widgets/layout.dart';
import '../../../../shared/widgets/text_fields.dart';
import '../../bloc/project_cubit.dart';

class ProjectsPage extends StatefulWidget {
  final bool isAdmin;

  const ProjectsPage({super.key, this.isAdmin = false});

  @override
  State<ProjectsPage> createState() => _ProjectsPageState();
}

class _ProjectsPageState extends State<ProjectsPage> {
  @override
  void initState() {
    super.initState();
    _loadData();
  }

  void _loadData() {
    context.read<ProjectCubit>().loadProjects();
  }

  void _showAddProjectDialog() {
    final formKey = GlobalKey<FormState>();
    final nameController = TextEditingController();
    final clientController = TextEditingController();
    final descController = TextEditingController();
    final budgetController = TextEditingController();
    DateTime deadline = DateTime.now().add(const Duration(days: 30));

    showDialog(
      context: context,
      builder: (context) {
        return StatefulBuilder(
          builder: (context, setDialogState) {
            return AlertDialog(
              title: const Text('Add Project', style: TextStyle(fontWeight: FontWeight.bold)),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
              content: SingleChildScrollView(
                child: Form(
                  key: formKey,
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      AppTextField(
                        label: 'Project Name',
                        controller: nameController,
                        validator: (val) => val == null || val.trim().isEmpty ? 'Required' : null,
                      ),
                      const SizedBox(height: 12),
                      AppTextField(
                        label: 'Client Name',
                        controller: clientController,
                        validator: (val) => val == null || val.trim().isEmpty ? 'Required' : null,
                      ),
                      const SizedBox(height: 12),
                      AppTextField(
                        label: 'Description',
                        controller: descController,
                      ),
                      const SizedBox(height: 12),
                      AppTextField(
                        label: 'Budget (₹)',
                        controller: budgetController,
                        keyboardType: TextInputType.number,
                      ),
                      const SizedBox(height: 12),
                      DatePickerField(
                        label: 'Deadline',
                        selectedDate: deadline,
                        onDateSelected: (date) {
                          setDialogState(() {
                            deadline = date;
                          });
                        },
                      ),
                    ],
                  ),
                ),
              ),
              actions: [
                TextButton(
                  onPressed: () => Navigator.of(context).pop(),
                  child: const Text('Cancel', style: TextStyle(color: AppTheme.textLight)),
                ),
                TextButton(
                  onPressed: () {
                    if (formKey.currentState!.validate()) {
                      context.read<ProjectCubit>().createProject({
                        'name': nameController.text.trim(),
                        'clientName': clientController.text.trim(),
                        'description': descController.text.trim(),
                        'budget': budgetController.text.trim(),
                        'deadline': deadline.toIso8601String(),
                        'status': 'In Progress',
                        'priority': 'Medium',
                      });
                      Navigator.of(context).pop();
                    }
                  },
                  child: const Text('Submit', style: TextStyle(color: AppTheme.primary, fontWeight: FontWeight.bold)),
                ),
              ],
            );
          },
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    return AppScaffold(
      title: 'Projects Catalog',
      showAppBar: true,
      floatingActionButton: widget.isAdmin
          ? FloatingActionButton(
              onPressed: _showAddProjectDialog,
              backgroundColor: AppTheme.secondary,
              child: const Icon(Icons.add, color: Colors.white),
            )
          : null,
      body: BlocBuilder<ProjectCubit, ProjectState>(
        builder: (context, state) {
          if (state is ProjectLoading) {
            return const LoadingState();
          }
          if (state is ProjectFailure) {
            return ErrorState(message: state.message, onRetry: _loadData);
          }
          if (state is ProjectLoaded) {
            final list = state.projects;

            if (list.isEmpty) {
              return const EmptyState(
                title: 'No Projects Registered',
                message: 'No client project briefs are currently logged in the catalog.',
              );
            }

            return RefreshIndicator(
              onRefresh: () async => _loadData(),
              child: ListView.builder(
                padding: const EdgeInsets.all(16),
                itemCount: list.length,
                itemBuilder: (context, index) {
                  final proj = list[index];
                  return Container(
                    margin: const EdgeInsets.symmetric(vertical: 6),
                    child: AppCard(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Expanded(
                                child: Text(
                                  proj.name,
                                  style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
                                ),
                              ),
                              StatusChip(label: proj.status, status: proj.status),
                            ],
                          ),
                          const SizedBox(height: 6),
                          Text(
                            'Client: ${proj.clientName}',
                            style: const TextStyle(color: AppTheme.textLight, fontSize: 13, fontWeight: FontWeight.bold),
                          ),
                          if (proj.description != null && proj.description!.isNotEmpty) ...[
                            const SizedBox(height: 6),
                            Text(
                              proj.description!,
                              style: const TextStyle(color: AppTheme.textLight, fontSize: 13),
                            ),
                          ],
                          const Divider(height: 20, color: Color(0xFFF1F5F9)),
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Text(
                                proj.deadline != null ? 'Due: ${DateFormat('dd MMM yyyy').format(proj.deadline!)}' : 'No deadline',
                                style: const TextStyle(fontSize: 12, color: AppTheme.error, fontWeight: FontWeight.bold),
                              ),
                              if (widget.isAdmin)
                                IconButton(
                                  icon: const Icon(Icons.delete_outline, color: AppTheme.error, size: 20),
                                  onPressed: () {
                                    context.read<ProjectCubit>().removeProject(proj.id);
                                  },
                                ),
                            ],
                          ),
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
    );
  }
}
