import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:intl/intl.dart';
import '../../../../core/theme/app_theme.dart';
import '../../../../shared/widgets/avatar.dart';
import '../../../../shared/widgets/cards.dart';
import '../../../../shared/widgets/chips.dart';
import '../../../../shared/widgets/feedback.dart';
import '../../../../shared/widgets/layout.dart';
import '../../../../shared/widgets/text_fields.dart';
import '../../bloc/work_cubit.dart';

class AdminWorkJournalPage extends StatefulWidget {
  const AdminWorkJournalPage({super.key});

  @override
  State<AdminWorkJournalPage> createState() => _AdminWorkJournalPageState();
}

class _AdminWorkJournalPageState extends State<AdminWorkJournalPage> {
  String? _selectedStatus;
  String? _searchQuery;

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  void _loadData() {
    context.read<WorkCubit>().loadTeamWorkJournal();
  }

  @override
  Widget build(BuildContext context) {
    return AppScaffold(
      title: 'Team Work Journal',
      showAppBar: true,
      body: Column(
        children: [
          // Filter section
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
            child: SearchField(
              hint: 'Search by employee or title...',
              onChanged: (val) {
                setState(() {
                  _searchQuery = val.trim().isEmpty ? null : val.trim();
                });
              },
            ),
          ),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16),
            child: SingleChildScrollView(
              scrollDirection: Axis.horizontal,
              child: Row(
                children: [
                  _buildStatusFilterChip('All', null),
                  _buildStatusFilterChip('Pending', 'pending'),
                  _buildStatusFilterChip('In Progress', 'in-progress'),
                  _buildStatusFilterChip('Completed', 'completed'),
                  _buildStatusFilterChip('Blocked', 'blocked'),
                ],
              ),
            ),
          ),
          const SizedBox(height: 12),

          // Updates list
          Expanded(
            child: BlocBuilder<WorkCubit, WorkState>(
              builder: (context, state) {
                if (state is WorkLoading) {
                  return const LoadingState();
                }
                if (state is WorkFailure) {
                  return ErrorState(
                    message: state.message,
                    onRetry: _loadData,
                  );
                }
                if (state is WorkLoaded) {
                  final list = state.workUpdates;

                  var filteredList = list;
                  if (_selectedStatus != null) {
                    filteredList = filteredList
                        .where((w) => w.status.toLowerCase() == _selectedStatus!.toLowerCase())
                        .toList();
                  }
                  if (_searchQuery != null) {
                    final query = _searchQuery!.toLowerCase();
                    filteredList = filteredList.where((w) {
                      final empName = w.user?.name.toLowerCase() ?? '';
                      final title = w.title.toLowerCase();
                      final desc = w.description.toLowerCase();
                      return empName.contains(query) || title.contains(query) || desc.contains(query);
                    }).toList();
                  }

                  if (filteredList.isEmpty) {
                    return const EmptyState(
                      title: 'No Work Updates Found',
                      message: 'No team updates matched the query.',
                    );
                  }

                  return RefreshIndicator(
                    onRefresh: () async => _loadData(),
                    child: ListView.builder(
                      padding: const EdgeInsets.symmetric(horizontal: 16),
                      itemCount: filteredList.length,
                      itemBuilder: (context, index) {
                        final work = filteredList[index];
                        final employeeName = work.user?.name ?? 'Employee';
                        return Container(
                          margin: const EdgeInsets.symmetric(vertical: 6),
                          child: AppCard(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Row(
                                  children: [
                                    Avatar(
                                      url: work.user?.profilePicture,
                                      name: employeeName,
                                      size: 32,
                                    ),
                                    const SizedBox(width: 8),
                                    Expanded(
                                      child: Column(
                                        crossAxisAlignment: CrossAxisAlignment.start,
                                        children: [
                                          Text(
                                            employeeName,
                                            style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13),
                                          ),
                                          Text(
                                            DateFormat('dd MMM yyyy').format(work.date),
                                            style: const TextStyle(color: AppTheme.textLight, fontSize: 11),
                                          ),
                                        ],
                                      ),
                                    ),
                                    StatusChip(label: work.status, status: work.status),
                                    const SizedBox(width: 8),
                                    IconButton(
                                      icon: const Icon(Icons.edit_outlined, size: 18, color: AppTheme.primary),
                                      padding: EdgeInsets.zero,
                                      constraints: const BoxConstraints(),
                                      onPressed: () {
                                        _showEditStatusSheet(context, work.id, work.status);
                                      },
                                    ),
                                    const SizedBox(width: 8),
                                    IconButton(
                                      icon: const Icon(Icons.delete_outline, size: 18, color: AppTheme.error),
                                      padding: EdgeInsets.zero,
                                      constraints: const BoxConstraints(),
                                      onPressed: () {
                                        context.read<WorkCubit>().removeWorkUpdate(
                                              id: work.id,
                                              isAdminJournal: true,
                                            );
                                      },
                                    ),
                                  ],
                                ),
                                const Divider(height: 16, color: Color(0xFFF1F5F9)),
                                Text(
                                  work.title,
                                  style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 15),
                                ),
                                const SizedBox(height: 4),
                                Text(
                                  work.description,
                                  style: const TextStyle(color: AppTheme.textLight, fontSize: 13),
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
          ),
        ],
      ),
    );
  }

  Widget _buildStatusFilterChip(String label, String? status) {
    final isSelected = _selectedStatus == status;
    return Container(
      margin: const EdgeInsets.only(right: 8),
      child: FilterChip(
        selected: isSelected,
        label: Text(label),
        onSelected: (_) {
          setState(() {
            _selectedStatus = status;
          });
        },
        selectedColor: AppTheme.primary.withValues(alpha: 0.15),
        labelStyle: TextStyle(
          color: isSelected ? AppTheme.primary : AppTheme.textDark,
          fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
        ),
      ),
    );
  }

  void _showEditStatusSheet(BuildContext context, String workId, String currentStatus) {
    showModalBottomSheet(
      context: context,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (context) {
        return Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text(
                'Update Task Status',
                style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18),
              ),
              const SizedBox(height: 16),
              ...['pending', 'in-progress', 'completed', 'blocked'].map((status) {
                return ListTile(
                  title: Text(status.toUpperCase()),
                  trailing: currentStatus == status ? const Icon(Icons.check, color: AppTheme.success) : null,
                  onTap: () {
                    context.read<WorkCubit>().editWorkUpdate(
                          id: workId,
                          updateData: {'status': status},
                          isAdminJournal: true,
                        );
                    Navigator.of(context).pop();
                  },
                );
              }),
            ],
          ),
        );
      },
    );
  }
}
