import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:intl/intl.dart';
import '../../../../core/theme/app_theme.dart';
import '../../../../shared/widgets/avatar.dart';
import '../../../../shared/widgets/cards.dart';
import '../../../../shared/widgets/feedback.dart';
import '../../../../shared/widgets/layout.dart';
import '../../../../shared/widgets/buttons.dart';
import '../../../../shared/widgets/text_fields.dart';
import '../../bloc/task_cubit.dart';
import '../../data/models/task_model.dart';
import '../../../employee_management/bloc/employees_cubit.dart';
import '../../../projects/bloc/project_cubit.dart';

class TasksPage extends StatefulWidget {
  final bool isAdmin;
  const TasksPage({super.key, this.isAdmin = false});

  @override
  State<TasksPage> createState() => _TasksPageState();
}

class _TasksPageState extends State<TasksPage> {
  String _selectedFilter = 'all';

  @override
  void initState() {
    super.initState();
    _load();
  }

  void _load() {
    context.read<TaskCubit>().loadTasks(
      isAdmin: widget.isAdmin,
      status: _selectedFilter == 'all' ? null : _selectedFilter,
    );
  }

  void _openCreateTaskDialog() {
    context.read<EmployeesCubit>().loadEmployees();
    context.read<ProjectCubit>().loadProjects();

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => _CreateTaskBottomSheet(onTaskCreated: _load),
    );
  }

  void _updateTaskStatusDialog(TaskModel task) {
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      builder: (ctx) => _UpdateStatusBottomSheet(
        task: task,
        isAdmin: widget.isAdmin,
        onUpdated: _load,
      ),
    );
  }

  Color _getPriorityColor(String priority) {
    switch (priority.toLowerCase()) {
      case 'urgent':
        return const Color(0xFFEF4444);
      case 'high':
        return const Color(0xFFF97316);
      case 'medium':
        return const Color(0xFF3B82F6);
      case 'low':
      default:
        return const Color(0xFF10B981);
    }
  }

  Color _getStatusColor(String status) {
    switch (status.toLowerCase()) {
      case 'completed':
        return AppTheme.success;
      case 'in_progress':
        return AppTheme.primary;
      case 'review':
        return const Color(0xFF8B5CF6);
      case 'todo':
      default:
        return AppTheme.textLight;
    }
  }

  String _formatStatus(String status) {
    switch (status.toLowerCase()) {
      case 'todo':
        return 'To Do';
      case 'in_progress':
        return 'In Progress';
      case 'review':
        return 'In Review';
      case 'completed':
        return 'Completed';
      default:
        return status;
    }
  }

  @override
  Widget build(BuildContext context) {
    return AppScaffold(
      title: widget.isAdmin ? 'Task Delegation' : 'My Assigned Tasks',
      showAppBar: true,
      floatingActionButton: widget.isAdmin
          ? FloatingActionButton.extended(
              onPressed: _openCreateTaskDialog,
              backgroundColor: AppTheme.primary,
              icon: const Icon(Icons.add_task, color: Colors.white),
              label: const Text('Assign Task', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
            )
          : null,
      body: Column(
        children: [
          // Filter Tabs
          SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
            child: Row(
              children: [
                _buildFilterChip('all', 'All Tasks'),
                const SizedBox(width: 8),
                _buildFilterChip('todo', 'To Do'),
                const SizedBox(width: 8),
                _buildFilterChip('in_progress', 'In Progress'),
                const SizedBox(width: 8),
                _buildFilterChip('review', 'In Review'),
                const SizedBox(width: 8),
                _buildFilterChip('completed', 'Completed'),
              ],
            ),
          ),

          // Tasks List
          Expanded(
            child: BlocBuilder<TaskCubit, TaskState>(
              builder: (context, state) {
                if (state is TaskLoading) {
                  return const LoadingState();
                }
                if (state is TaskFailure) {
                  return ErrorState(message: state.message, onRetry: _load);
                }
                if (state is TaskLoaded) {
                  if (state.tasks.isEmpty) {
                    return const EmptyState(
                      title: 'No Tasks Found',
                      message: 'No tasks match the selected filter.',
                    );
                  }

                  return RefreshIndicator(
                    onRefresh: () async => _load(),
                    child: ListView.builder(
                      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                      itemCount: state.tasks.length,
                      itemBuilder: (context, index) {
                        final task = state.tasks[index];
                        final priorityColor = _getPriorityColor(task.priority);
                        final statusColor = _getStatusColor(task.status);

                        return Container(
                          margin: const EdgeInsets.only(bottom: 12),
                          child: AppCard(
                            padding: const EdgeInsets.all(16),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Row(
                                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                  children: [
                                    // Priority badge
                                    Container(
                                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                                      decoration: BoxDecoration(
                                        color: priorityColor.withOpacity(0.12),
                                        borderRadius: BorderRadius.circular(6),
                                      ),
                                      child: Text(
                                        task.priority.toUpperCase(),
                                        style: TextStyle(
                                          color: priorityColor,
                                          fontWeight: FontWeight.bold,
                                          fontSize: 10,
                                        ),
                                      ),
                                    ),
                                    // Status Badge button
                                    GestureDetector(
                                      onTap: () => _updateTaskStatusDialog(task),
                                      child: Container(
                                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                                        decoration: BoxDecoration(
                                          color: statusColor.withOpacity(0.12),
                                          borderRadius: BorderRadius.circular(20),
                                          border: Border.all(color: statusColor.withOpacity(0.4)),
                                        ),
                                        child: Row(
                                          mainAxisSize: MainAxisSize.min,
                                          children: [
                                            Text(
                                              _formatStatus(task.status),
                                              style: TextStyle(
                                                color: statusColor,
                                                fontWeight: FontWeight.bold,
                                                fontSize: 11,
                                              ),
                                            ),
                                            const SizedBox(width: 4),
                                            Icon(Icons.edit, size: 12, color: statusColor),
                                          ],
                                        ),
                                      ),
                                    ),
                                  ],
                                ),
                                const SizedBox(height: 10),
                                Text(
                                  task.title,
                                  style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
                                ),
                                if (task.description.isNotEmpty) ...[
                                  const SizedBox(height: 4),
                                  Text(
                                    task.description,
                                    maxLines: 2,
                                    overflow: TextOverflow.ellipsis,
                                    style: const TextStyle(color: AppTheme.textLight, fontSize: 13),
                                  ),
                                ],
                                const SizedBox(height: 12),

                                // Progress bar
                                Row(
                                  children: [
                                    Expanded(
                                      child: ClipRRect(
                                        borderRadius: BorderRadius.circular(4),
                                        child: LinearProgressIndicator(
                                          value: (task.progress) / 100,
                                          backgroundColor: const Color(0xFFE2E8F0),
                                          valueColor: AlwaysStoppedAnimation<Color>(statusColor),
                                          minHeight: 6,
                                        ),
                                      ),
                                    ),
                                    const SizedBox(width: 8),
                                    Text(
                                      '${task.progress}%',
                                      style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 12, color: AppTheme.textDark),
                                    ),
                                  ],
                                ),
                                const SizedBox(height: 12),
                                const Divider(color: Color(0xFFF1F5F9), height: 1),
                                const SizedBox(height: 10),

                                // Footer: Assignee & Due Date
                                Row(
                                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                  children: [
                                    if (task.assignedTo != null)
                                      Row(
                                        children: [
                                          Avatar(
                                            url: task.assignedTo?.profilePicture,
                                            name: task.assignedTo?.name ?? 'Employee',
                                            size: 24,
                                          ),
                                          const SizedBox(width: 6),
                                          Text(
                                            task.assignedTo?.name ?? 'Assigned',
                                            style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w500),
                                          ),
                                        ],
                                      )
                                    else
                                      const SizedBox.shrink(),
                                    if (task.dueDate != null)
                                      Row(
                                        children: [
                                          const Icon(Icons.event_outlined, size: 14, color: AppTheme.textLight),
                                          const SizedBox(width: 4),
                                          Text(
                                            'Due: ${DateFormat('dd MMM').format(task.dueDate!)}',
                                            style: const TextStyle(fontSize: 12, color: AppTheme.textLight),
                                          ),
                                        ],
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
                return const SizedBox.shrink();
              },
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildFilterChip(String value, String label) {
    final isSelected = _selectedFilter == value;
    return ChoiceChip(
      label: Text(
        label,
        style: TextStyle(
          color: isSelected ? Colors.white : AppTheme.textDark,
          fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
          fontSize: 12,
        ),
      ),
      selected: isSelected,
      selectedColor: AppTheme.primary,
      backgroundColor: Colors.white,
      side: BorderSide(
        color: isSelected ? AppTheme.primary : const Color(0xFFCBD5E1),
      ),
      onSelected: (selected) {
        if (selected) {
          setState(() {
            _selectedFilter = value;
          });
          _load();
        }
      },
    );
  }
}

class _UpdateStatusBottomSheet extends StatefulWidget {
  final TaskModel task;
  final bool isAdmin;
  final VoidCallback onUpdated;

  const _UpdateStatusBottomSheet({
    required this.task,
    required this.isAdmin,
    required this.onUpdated,
  });

  @override
  State<_UpdateStatusBottomSheet> createState() => _UpdateStatusBottomSheetState();
}

class _UpdateStatusBottomSheetState extends State<_UpdateStatusBottomSheet> {
  late String _status;
  late double _progress;

  @override
  void initState() {
    super.initState();
    _status = widget.task.status;
    _progress = widget.task.progress.toDouble();
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(24),
      decoration: const BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text(
                'Update Task Progress',
                style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
              ),
              IconButton(icon: const Icon(Icons.close), onPressed: () => Navigator.pop(context)),
            ],
          ),
          const SizedBox(height: 16),
          const Text('Task Status', style: TextStyle(fontWeight: FontWeight.w600, fontSize: 13)),
          const SizedBox(height: 8),
          DropdownButtonFormField<String>(
            value: _status,
            decoration: InputDecoration(
              border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
              contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
            ),
            items: const [
              DropdownMenuItem(value: 'todo', child: Text('To Do')),
              DropdownMenuItem(value: 'in_progress', child: Text('In Progress')),
              DropdownMenuItem(value: 'review', child: Text('In Review')),
              DropdownMenuItem(value: 'completed', child: Text('Completed')),
            ],
            onChanged: (val) {
              if (val != null) {
                setState(() {
                  _status = val;
                  if (val == 'completed') _progress = 100;
                });
              }
            },
          ),
          const SizedBox(height: 20),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text('Progress', style: TextStyle(fontWeight: FontWeight.w600, fontSize: 13)),
              Text('${_progress.toInt()}%', style: const TextStyle(fontWeight: FontWeight.bold, color: AppTheme.primary)),
            ],
          ),
          Slider(
            value: _progress,
            min: 0,
            max: 100,
            divisions: 20,
            activeColor: AppTheme.primary,
            onChanged: (val) {
              setState(() {
                _progress = val;
                if (val == 100) _status = 'completed';
              });
            },
          ),
          const SizedBox(height: 24),
          PrimaryButton(
            text: 'Save Changes',
            onPressed: () {
              context.read<TaskCubit>().updateStatus(
                    widget.task.id,
                    status: _status,
                    progress: _progress.toInt(),
                    isAdmin: widget.isAdmin,
                  ).then((_) {
                widget.onUpdated();
                Navigator.pop(context);
              });
            },
          ),
        ],
      ),
    );
  }
}

class _CreateTaskBottomSheet extends StatefulWidget {
  final VoidCallback onTaskCreated;
  const _CreateTaskBottomSheet({required this.onTaskCreated});

  @override
  State<_CreateTaskBottomSheet> createState() => _CreateTaskBottomSheetState();
}

class _CreateTaskBottomSheetState extends State<_CreateTaskBottomSheet> {
  final _formKey = GlobalKey<FormState>();
  final _titleController = TextEditingController();
  final _descController = TextEditingController();
  String? _selectedEmployeeId;
  String? _selectedProjectId;
  String _priority = 'medium';
  DateTime _dueDate = DateTime.now().add(const Duration(days: 3));

  @override
  void dispose() {
    _titleController.dispose();
    _descController.dispose();
    super.dispose();
  }

  void _submit() {
    if (_formKey.currentState!.validate()) {
      if (_selectedEmployeeId == null) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Please select an employee to assign'), backgroundColor: AppTheme.error),
        );
        return;
      }

      context.read<TaskCubit>().createTask(
            title: _titleController.text.trim(),
            description: _descController.text.trim(),
            assignedTo: _selectedEmployeeId!,
            projectId: _selectedProjectId,
            priority: _priority,
            dueDate: _dueDate,
          ).then((_) {
        widget.onTaskCreated();
        Navigator.pop(context);
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      height: MediaQuery.of(context).size.height * 0.85,
      padding: const EdgeInsets.all(24),
      decoration: const BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      child: Form(
        key: _formKey,
        child: SingleChildScrollView(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Text('Assign New Task', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
                  IconButton(icon: const Icon(Icons.close), onPressed: () => Navigator.pop(context)),
                ],
              ),
              const SizedBox(height: 16),
              AppTextField(
                label: 'Task Title',
                hint: 'e.g., Build Flutter Dashboard',
                controller: _titleController,
                validator: (val) => (val == null || val.trim().isEmpty) ? 'Title is required' : null,
              ),
              const SizedBox(height: 16),
              AppTextField(
                label: 'Description',
                hint: 'Provide task details and instructions...',
                controller: _descController,
                keyboardType: TextInputType.multiline,
              ),
              const SizedBox(height: 16),

              // Employee Dropdown
              const Text('Assign To Employee', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
              const SizedBox(height: 6),
              BlocBuilder<EmployeesCubit, EmployeesState>(
                builder: (context, state) {
                  final employees = (state is EmployeesLoaded) ? state.employees : [];
                  return DropdownButtonFormField<String>(
                    value: _selectedEmployeeId,
                    hint: const Text('Select Employee'),
                    decoration: InputDecoration(
                      border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
                      contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                    ),
                    items: employees.map((emp) {
                      return DropdownMenuItem<String>(
                        value: emp.id,
                        child: Text('${emp.name} (${emp.jobRole})'),
                      );
                    }).toList(),
                    onChanged: (val) => setState(() => _selectedEmployeeId = val),
                  );
                },
              ),
              const SizedBox(height: 16),

              // Priority
              const Text('Priority Level', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
              const SizedBox(height: 6),
              DropdownButtonFormField<String>(
                value: _priority,
                decoration: InputDecoration(
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
                  contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                ),
                items: const [
                  DropdownMenuItem(value: 'low', child: Text('🟢 Low')),
                  DropdownMenuItem(value: 'medium', child: Text('🔵 Medium')),
                  DropdownMenuItem(value: 'high', child: Text('🟠 High')),
                  DropdownMenuItem(value: 'urgent', child: Text('🔴 Urgent')),
                ],
                onChanged: (val) => setState(() => _priority = val ?? 'medium'),
              ),
              const SizedBox(height: 16),

              // Due Date
              DatePickerField(
                label: 'Due Date',
                selectedDate: _dueDate,
                onDateSelected: (date) => setState(() => _dueDate = date),
              ),
              const SizedBox(height: 32),
              PrimaryButton(text: 'Assign Task Now', onPressed: _submit),
            ],
          ),
        ),
      ),
    );
  }
}
