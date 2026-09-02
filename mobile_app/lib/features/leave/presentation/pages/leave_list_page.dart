import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';
import '../../../../core/theme/app_theme.dart';
import '../../../../shared/widgets/cards.dart';
import '../../../../shared/widgets/chips.dart';
import '../../../../shared/widgets/feedback.dart';
import '../../../../shared/widgets/layout.dart';
import '../../bloc/leave_cubit.dart';

class LeaveListPage extends StatefulWidget {
  const LeaveListPage({super.key});

  @override
  State<LeaveListPage> createState() => _LeaveListPageState();
}

class _LeaveListPageState extends State<LeaveListPage> {
  @override
  void initState() {
    super.initState();
    _loadData();
  }

  void _loadData() {
    context.read<LeaveCubit>().loadMyLeaves();
  }

  @override
  Widget build(BuildContext context) {
    return AppScaffold(
      title: 'My Leaves',
      showAppBar: true,
      floatingActionButton: FloatingActionButton(
        onPressed: () => context.push('/leave/apply'),
        backgroundColor: AppTheme.primary,
        child: const Icon(Icons.add, color: Colors.white),
      ),
      body: BlocBuilder<LeaveCubit, LeaveState>(
        builder: (context, state) {
          if (state is LeaveLoading) {
            return const LoadingState();
          }
          if (state is LeaveFailure) {
            return ErrorState(
              message: state.message,
              onRetry: _loadData,
            );
          }
          if (state is LeaveLoaded) {
            final list = state.leaves;

            if (list.isEmpty) {
              return const EmptyState(
                title: 'No Leave Requests',
                message: 'You have not submitted any leave applications.',
              );
            }

            return RefreshIndicator(
              onRefresh: () async => _loadData(),
              child: ListView.builder(
                padding: const EdgeInsets.all(16),
                itemCount: list.length,
                itemBuilder: (context, index) {
                  final leave = list[index];
                  return Container(
                    margin: const EdgeInsets.symmetric(vertical: 6),
                    child: AppCard(
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  'Duration: ${leave.durationInDays} day(s)',
                                  style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 15),
                                ),
                                const SizedBox(height: 4),
                                Text(
                                  '${DateFormat('dd MMM').format(leave.startDate)} - ${DateFormat('dd MMM yyyy').format(leave.endDate)}',
                                  style: const TextStyle(color: AppTheme.textLight, fontSize: 13),
                                ),
                                const SizedBox(height: 6),
                                Text(
                                  'Reason: ${leave.reason}',
                                  style: const TextStyle(fontSize: 12, color: AppTheme.textDark),
                                ),
                              ],
                            ),
                          ),
                          Column(
                            crossAxisAlignment: CrossAxisAlignment.end,
                            children: [
                              StatusChip(label: leave.status, status: leave.status),
                              if (leave.status == 'pending') ...[
                                const SizedBox(height: 8),
                                IconButton(
                                  icon: const Icon(Icons.delete_outline, color: AppTheme.error, size: 20),
                                  onPressed: () {
                                    context.read<LeaveCubit>().cancelLeave(leave.id);
                                  },
                                ),
                              ],
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
