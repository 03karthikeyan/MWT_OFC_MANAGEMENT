import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:intl/intl.dart';
import '../../../../core/theme/app_theme.dart';
import '../../../../shared/widgets/avatar.dart';
import '../../../../shared/widgets/cards.dart';
import '../../../../shared/widgets/chips.dart';
import '../../../../shared/widgets/feedback.dart';
import '../../../../shared/widgets/layout.dart';
import '../../../leave/bloc/leave_cubit.dart';
import '../../bloc/on_duty_cubit.dart';

class AdminOnDutyPage extends StatefulWidget {
  final bool isLeavesOnly;

  const AdminOnDutyPage({
    super.key,
    this.isLeavesOnly = false,
  });

  @override
  State<AdminOnDutyPage> createState() => _AdminOnDutyPageState();
}

class _AdminOnDutyPageState extends State<AdminOnDutyPage> {
  final Map<String, String> _localStatuses = {};

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  void _loadData() {
    if (widget.isLeavesOnly) {
      context.read<LeaveCubit>().loadAllLeaves();
    } else {
      context.read<OnDutyCubit>().loadAllOnDuty();
    }
  }

  @override
  Widget build(BuildContext context) {
    final title = widget.isLeavesOnly ? 'Leave Approvals' : 'On-Duty Approvals';

    return AppScaffold(
      title: title,
      showAppBar: true,
      body: widget.isLeavesOnly ? _buildLeavesQueue() : _buildOnDutyQueue(),
    );
  }

  Widget _buildLeavesQueue() {
    return BlocBuilder<LeaveCubit, LeaveState>(
      builder: (context, state) {
        if (state is LeaveLoading) {
          return _buildShimmerLoader();
        }
        if (state is LeaveFailure) {
          return ErrorState(message: state.message, onRetry: _loadData);
        }
        if (state is LeaveLoaded) {
          final list = state.leaves;
          if (list.isEmpty) {
            return const EmptyState(
              title: 'Clean Queue',
              message: 'There are no leave applications submitted.',
            );
          }

          return RefreshIndicator(
            onRefresh: () async => _loadData(),
            child: ListView.builder(
              padding: const EdgeInsets.all(16),
              itemCount: list.length,
              itemBuilder: (context, index) {
                final leave = list[index];
                final currentStatus = _localStatuses[leave.id] ?? leave.status;
                final isPending = currentStatus == 'pending';
                final empName = leave.user?.name ?? 'Employee';

                return Container(
                  margin: const EdgeInsets.symmetric(vertical: 6),
                  child: AppCard(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            Avatar(url: leave.user?.profilePicture, name: empName, size: 36),
                            const SizedBox(width: 10),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(empName, style: const TextStyle(fontWeight: FontWeight.bold)),
                                  Text(
                                    '${DateFormat('dd MMM').format(leave.startDate)} to ${DateFormat('dd MMM yyyy').format(leave.endDate)} (${leave.durationInDays} days)',
                                    style: const TextStyle(color: AppTheme.textLight, fontSize: 12),
                                  ),
                                ],
                              ),
                            ),
                            StatusChip(label: currentStatus, status: currentStatus),
                          ],
                        ),
                        const SizedBox(height: 12),
                        Text(
                          'Reason: ${leave.reason}',
                          style: const TextStyle(fontSize: 13, color: AppTheme.textDark),
                        ),
                        if (isPending) ...[
                          const SizedBox(height: 16),
                          Row(
                            mainAxisAlignment: MainAxisAlignment.end,
                            children: [
                              TextButton(
                                onPressed: () {
                                  setState(() {
                                    _localStatuses[leave.id] = 'rejected';
                                  });
                                  context.read<LeaveCubit>().reviewLeave(leave.id, 'rejected', showLoading: false);
                                },
                                child: const Text('Reject', style: TextStyle(color: AppTheme.error)),
                              ),
                              const SizedBox(width: 12),
                              ElevatedButton(
                                onPressed: () {
                                  setState(() {
                                    _localStatuses[leave.id] = 'approved';
                                  });
                                  context.read<LeaveCubit>().reviewLeave(leave.id, 'approved', showLoading: false);
                                },
                                style: ElevatedButton.styleFrom(
                                  backgroundColor: AppTheme.success,
                                  minimumSize: const Size(100, 36),
                                ),
                                child: const Text('Approve', style: TextStyle(fontSize: 13)),
                              ),
                            ],
                          ),
                        ],
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
    );
  }

  Widget _buildOnDutyQueue() {
    return BlocBuilder<OnDutyCubit, OnDutyState>(
      builder: (context, state) {
        if (state is OnDutyLoading) {
          return _buildShimmerLoader();
        }
        if (state is OnDutyFailure) {
          return ErrorState(message: state.message, onRetry: _loadData);
        }
        if (state is OnDutyLoaded) {
          final list = state.requests;
          if (list.isEmpty) {
            return const EmptyState(
              title: 'Clean Queue',
              message: 'There are no on-duty travel logs submitted.',
            );
          }

          return RefreshIndicator(
            onRefresh: () async => _loadData(),
            child: ListView.builder(
              padding: const EdgeInsets.all(16),
              itemCount: list.length,
              itemBuilder: (context, index) {
                final req = list[index];
                final currentStatus = _localStatuses[req.id] ?? req.status;
                final isPending = currentStatus == 'pending';
                final empName = req.user?.name ?? 'Employee';
                final hasExpense = req.expenses != null && req.expenses!.price > 0;

                return Container(
                  margin: const EdgeInsets.symmetric(vertical: 6),
                  child: AppCard(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            Avatar(url: req.user?.profilePicture, name: empName, size: 36),
                            const SizedBox(width: 10),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(empName, style: const TextStyle(fontWeight: FontWeight.bold)),
                                  Text(
                                    'Log Date: ${DateFormat('dd MMMM yyyy').format(req.date)}',
                                    style: const TextStyle(color: AppTheme.textLight, fontSize: 12),
                                  ),
                                ],
                              ),
                            ),
                            StatusChip(label: currentStatus, status: currentStatus),
                          ],
                        ),
                        const SizedBox(height: 12),
                        Text(
                          'Reason: ${req.reason}',
                          style: const TextStyle(fontSize: 13, color: AppTheme.textDark),
                        ),
                        if (hasExpense) ...[
                          const SizedBox(height: 6),
                          Text(
                            'Claim: ${req.expenses!.title} (₹${req.expenses!.price.toStringAsFixed(0)})',
                            style: const TextStyle(
                              fontSize: 12,
                              color: AppTheme.primary,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ],
                        if (isPending) ...[
                          const SizedBox(height: 16),
                          Row(
                            mainAxisAlignment: MainAxisAlignment.end,
                            children: [
                              TextButton(
                                onPressed: () {
                                  setState(() {
                                    _localStatuses[req.id] = 'rejected';
                                  });
                                  context.read<OnDutyCubit>().reviewOnDuty(req.id, 'rejected', showLoading: false);
                                },
                                child: const Text('Reject', style: TextStyle(color: AppTheme.error)),
                              ),
                              const SizedBox(width: 12),
                              ElevatedButton(
                                onPressed: () {
                                  setState(() {
                                    _localStatuses[req.id] = 'approved';
                                  });
                                  context.read<OnDutyCubit>().reviewOnDuty(req.id, 'approved', showLoading: false);
                                },
                                style: ElevatedButton.styleFrom(
                                  backgroundColor: AppTheme.success,
                                  minimumSize: const Size(100, 36),
                                ),
                                child: const Text('Approve', style: TextStyle(fontSize: 13)),
                              ),
                            ],
                          ),
                        ],
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
    );
  }

  Widget _buildShimmerLoader() {
    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: 3,
      itemBuilder: (context, index) {
        return Container(
          margin: const EdgeInsets.symmetric(vertical: 6),
          child: AppCard(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    const ShimmerPlaceholder(width: 36, height: 36, borderRadius: 18),
                    const SizedBox(width: 10),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const ShimmerPlaceholder(width: 120, height: 14),
                          const SizedBox(height: 6),
                          const ShimmerPlaceholder(width: 180, height: 12),
                        ],
                      ),
                    ),
                    const ShimmerPlaceholder(width: 60, height: 24, borderRadius: 12),
                  ],
                ),
                const SizedBox(height: 12),
                const ShimmerPlaceholder(width: double.infinity, height: 13),
                const SizedBox(height: 16),
                Row(
                  mainAxisAlignment: MainAxisAlignment.end,
                  children: [
                    const ShimmerPlaceholder(width: 60, height: 24, borderRadius: 6),
                    const SizedBox(width: 12),
                    const ShimmerPlaceholder(width: 100, height: 36, borderRadius: 8),
                  ],
                ),
              ],
            ),
          ),
        );
      },
    );
  }
}

class ShimmerPlaceholder extends StatefulWidget {
  final double width;
  final double height;
  final double borderRadius;

  const ShimmerPlaceholder({
    super.key,
    required this.width,
    required this.height,
    this.borderRadius = 8,
  });

  @override
  State<ShimmerPlaceholder> createState() => _ShimmerPlaceholderState();
}

class _ShimmerPlaceholderState extends State<ShimmerPlaceholder>
    with SingleTickerProviderStateMixin {
  late AnimationController _controller;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1500),
    )..repeat();
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: _controller,
      builder: (context, child) {
        return Container(
          width: widget.width,
          height: widget.height,
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(widget.borderRadius),
            gradient: LinearGradient(
              begin: Alignment(widget.width > 0 ? (_controller.value * 2 - 1.5) : -1.0, -1.0),
              end: Alignment(widget.width > 0 ? (_controller.value * 2 - 0.5) : 1.0, 1.0),
              colors: [
                Colors.grey[200]!,
                Colors.grey[100]!,
                Colors.grey[200]!,
              ],
            ),
          ),
        );
      },
    );
  }
}
