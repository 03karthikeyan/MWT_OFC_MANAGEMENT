import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:go_router/go_router.dart';
import '../../../../core/theme/app_theme.dart';
import '../../../../shared/widgets/buttons.dart';
import '../../../../shared/widgets/layout.dart';
import '../../../../shared/widgets/text_fields.dart';
import '../../../projects/bloc/project_cubit.dart';
import '../../bloc/work_cubit.dart';

class WorkCreatePage extends StatefulWidget {
  final bool isAdminJournal;
  final String? filterUserId;

  const WorkCreatePage({
    super.key,
    required this.isAdminJournal,
    this.filterUserId,
  });

  @override
  State<WorkCreatePage> createState() => _WorkCreatePageState();
}

class _WorkCreatePageState extends State<WorkCreatePage> {
  final _formKey = GlobalKey<FormState>();
  final _titleController = TextEditingController();
  final _descController = TextEditingController();
  
  DateTime _selectedDate = DateTime.now();
  String _selectedStatus = 'pending';
  String? _selectedProjectId;

  @override
  void initState() {
    super.initState();
    // Load projects catalog
    context.read<ProjectCubit>().loadProjects();
  }

  @override
  void dispose() {
    _titleController.dispose();
    _descController.dispose();
    super.dispose();
  }

  void _submit() {
    if (_formKey.currentState!.validate()) {
      context.read<WorkCubit>().createWorkUpdate(
            title: _titleController.text.trim(),
            description: _descController.text.trim(),
            status: _selectedStatus,
            projectId: _selectedProjectId,
            date: _selectedDate,
            isAdminJournal: widget.isAdminJournal,
            filterUserId: widget.filterUserId,
          ).then((_) {
            ScaffoldMessenger.of(context).showSnackBar(
              const SnackBar(
                content: Text('Work update logged successfully!'),
                backgroundColor: AppTheme.success,
              ),
            );
            context.pop();
          });
    }
  }

  @override
  Widget build(BuildContext context) {
    return AppScaffold(
      title: 'Log Work Update',
      showAppBar: true,
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(24),
        child: Form(
          key: _formKey,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              AppTextField(
                label: 'Task Title',
                hint: 'e.g. Completed profile screen integration',
                controller: _titleController,
                validator: (val) {
                  if (val == null || val.trim().isEmpty) {
                    return 'Title is required';
                  }
                  return null;
                },
              ),
              const SizedBox(height: 20),
              AppTextField(
                label: 'Description',
                hint: 'Detail what was accomplished or obstacles encountered...',
                controller: _descController,
                keyboardType: TextInputType.multiline,
                validator: (val) {
                  if (val == null || val.trim().isEmpty) {
                    return 'Description is required';
                  }
                  return null;
                },
              ),
              const SizedBox(height: 20),
              
              // Project Dropdown
              Text(
                'Associated Project',
                style: Theme.of(context).textTheme.titleSmall?.copyWith(
                      fontWeight: FontWeight.w500,
                      color: AppTheme.textDark,
                    ),
              ),
              const SizedBox(height: 6),
              BlocBuilder<ProjectCubit, ProjectState>(
                builder: (context, state) {
                  List<DropdownMenuItem<String>> items = [];
                  if (state is ProjectLoaded) {
                    items = state.projects.map((proj) {
                      return DropdownMenuItem<String>(
                        value: proj.id,
                        child: Text(proj.name),
                      );
                    }).toList();
                  }

                  return DropdownButtonFormField<String>(
                    value: _selectedProjectId,
                    hint: const Text('Select Associated Project'),
                    onChanged: (val) {
                      setState(() {
                        _selectedProjectId = val;
                      });
                    },
                    items: items,
                  );
                },
              ),
              const SizedBox(height: 20),

              // Date Selector
              DatePickerField(
                label: 'Work Date',
                selectedDate: _selectedDate,
                onDateSelected: (date) {
                  setState(() {
                    _selectedDate = date;
                  });
                },
              ),
              const SizedBox(height: 20),

              // Status Dropdown
              Text(
                'Status',
                style: Theme.of(context).textTheme.titleSmall?.copyWith(
                      fontWeight: FontWeight.w500,
                      color: AppTheme.textDark,
                    ),
              ),
              const SizedBox(height: 6),
              DropdownButtonFormField<String>(
                value: _selectedStatus,
                items: const [
                  DropdownMenuItem(value: 'pending', child: Text('PENDING')),
                  DropdownMenuItem(value: 'in-progress', child: Text('IN PROGRESS')),
                  DropdownMenuItem(value: 'completed', child: Text('COMPLETED')),
                  DropdownMenuItem(value: 'blocked', child: Text('BLOCKED')),
                ],
                onChanged: (val) {
                  if (val != null) {
                    setState(() {
                      _selectedStatus = val;
                    });
                  }
                },
              ),
              const SizedBox(height: 40),
              PrimaryButton(
                text: 'Save Update',
                onPressed: _submit,
              ),
            ],
          ),
        ),
      ),
    );
  }
}
