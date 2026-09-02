import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';
import '../../../../app/main_navigation_shell.dart';
import '../../../../core/theme/app_theme.dart';
import '../../../../shared/widgets/avatar.dart';
import '../../../../shared/widgets/cards.dart';
import '../../../../shared/widgets/chips.dart';
import '../../../../shared/widgets/feedback.dart';
import '../../../../shared/widgets/layout.dart';
import '../../../auth/bloc/auth_bloc.dart';
import '../../../auth/bloc/auth_state.dart';
import '../../../leave/bloc/leave_cubit.dart';
import '../../../requests/bloc/request_cubit.dart';
import '../../bloc/dashboard_cubit.dart';

class AdminDashboardPage extends StatefulWidget {
  const AdminDashboardPage({super.key});

  @override
  State<AdminDashboardPage> createState() => _AdminDashboardPageState();
}

class _AdminDashboardPageState extends State<AdminDashboardPage> {
  @override
  void initState() {
    super.initState();
    _loadData();
  }

  void _loadData() {
    final user = (context.read<AuthBloc>().state as Authenticated).user;
    context.read<DashboardCubit>().loadDashboard(user.role);
  }

  @override
  Widget build(BuildContext context) {
    return AppScaffold(
      showAppBar: false,
      body: RefreshIndicator(
        onRefresh: () async => _loadData(),
        child: SingleChildScrollView(
          physics: const AlwaysScrollableScrollPhysics(),
          padding: const EdgeInsets.all(20),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Greeting Section
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Control Panel,',
                        style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                              color: AppTheme.textLight,
                              fontSize: 16,
                            ),
                      ),
                      const SizedBox(height: 2),
                      Text(
                        'Admin Dashboard',
                        style: Theme.of(context).textTheme.titleLarge?.copyWith(
                              fontSize: 24,
                              fontWeight: FontWeight.bold,
                            ),
                      ),
                    ],
                  ),
                  Row(
                    children: [
                      Material(
                        color: AppTheme.primary.withValues(alpha: 0.1),
                        borderRadius: BorderRadius.circular(12),
                        child: InkWell(
                          onTap: () => context.push('/chat'),
                          borderRadius: BorderRadius.circular(12),
                          child: Container(
                            padding: const EdgeInsets.all(10),
                            child: const Icon(
                              Icons.chat_bubble_outline_rounded,
                              color: AppTheme.primary,
                              size: 22,
                            ),
                          ),
                        ),
                      ),
                      const SizedBox(width: 10),
                      Container(
                        padding: const EdgeInsets.all(8),
                        decoration: BoxDecoration(
                          color: AppTheme.primary.withValues(alpha: 0.1),
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: const Icon(
                          Icons.admin_panel_settings,
                          color: AppTheme.primary,
                          size: 28,
                        ),
                      ),
                    ],
                  ),
                ],
              ),
              const SizedBox(height: 28),

              BlocBuilder<DashboardCubit, DashboardState>(
                builder: (context, state) {
                  if (state is DashboardLoading) {
                    return Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const LinearProgressIndicator(
                          backgroundColor: Colors.transparent,
                          valueColor: AlwaysStoppedAnimation<Color>(AppTheme.primary),
                        ),
                        const SizedBox(height: 16),
                        _buildSectionHeader("Today's Summary"),
                        const SizedBox(height: 12),
                        const ShimmerPlaceholder(width: double.infinity, height: 96, borderRadius: 16),
                        const SizedBox(height: 16),
                        const Row(
                          children: [
                            Expanded(child: ShimmerPlaceholder(width: double.infinity, height: 96, borderRadius: 16)),
                            SizedBox(width: 16),
                            Expanded(child: ShimmerPlaceholder(width: double.infinity, height: 96, borderRadius: 16)),
                          ],
                        ),
                        const SizedBox(height: 28),
                        _buildSectionHeader("Pending Leaves Queue"),
                        const SizedBox(height: 12),
                        const ShimmerPlaceholder(width: double.infinity, height: 80, borderRadius: 16),
                        const SizedBox(height: 28),
                        _buildSectionHeader("Pending Requests Queue"),
                        const SizedBox(height: 12),
                        const ShimmerPlaceholder(width: double.infinity, height: 80, borderRadius: 16),
                      ],
                    );
                  }
                  if (state is DashboardFailure) {
                    return ErrorState(
                      message: state.message,
                      onRetry: _loadData,
                    );
                  }
                  if (state is AdminDashboardSuccess) {
                    final stats = state.stats;
                    final details = state.details;

                    final attendanceRate = stats.totalUsers > 0
                        ? (stats.presentToday / stats.totalUsers) * 100
                        : 0.0;

                    final pendingLeaves = details.allLeaves.where((e) => e.status == 'pending').toList();
                    final pendingRequests = details.incomingRequests.where((e) => e.status == 'Pending').toList();
                    final recentWork = details.allWork.take(5).toList();

                    return Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        // Stats Grid
                        Row(
                          children: [
                            Expanded(
                              child: StatCard(
                                title: 'Employees',
                                value: '${stats.totalUsers}',
                                icon: Icons.group_outlined,
                                color: AppTheme.primary,
                              ),
                            ),
                            const SizedBox(width: 16),
                            Expanded(
                              child: StatCard(
                                title: 'Present Today',
                                value: '${stats.presentToday}',
                                icon: Icons.check_circle_outline,
                                color: AppTheme.success,
                                subtitle: '${attendanceRate.toStringAsFixed(0)}% attendance rate',
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 16),
                        Row(
                          children: [
                            Expanded(
                              child: GestureDetector(
                                onTap: () => context.push('/admin/onduty'),
                                child: StatCard(
                                  title: 'Pending OnDuty',
                                  value: '${stats.pendingOnDuty}',
                                  icon: Icons.map_outlined,
                                  color: AppTheme.warning,
                                ),
                              ),
                            ),
                            const SizedBox(width: 16),
                            Expanded(
                              child: GestureDetector(
                                onTap: () => context.push('/admin/internships'),
                                child: StatCard(
                                  title: 'Active Interns',
                                  value: '${stats.activeInterns}',
                                  icon: Icons.school_outlined,
                                  color: AppTheme.secondary,
                                ),
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 16),
                        Row(
                          children: [
                            Expanded(
                              child: GestureDetector(
                                onTap: () => context.push('/admin/payslips'),
                                child: StatCard(
                                  title: 'Internship Invoices',
                                  value: '₹${stats.totalCollected.toStringAsFixed(0)}',
                                  icon: Icons.payments_outlined,
                                  color: AppTheme.success,
                                  subtitle: 'Total Invoiced: ₹${stats.totalInvoiced.toStringAsFixed(0)}',
                                ),
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 28),

                        // Pending Leaves Card
                        _buildSectionHeaderWithAction(
                          title: 'Pending Leaves Queue',
                          actionText: 'View All',
                          onTap: () => context.push('/admin/leaves'),
                        ),
                        const SizedBox(height: 12),
                        if (pendingLeaves.isEmpty)
                          _buildEmptyCard('No pending leave requests.')
                        else
                          ListView.builder(
                            shrinkWrap: true,
                            physics: const NeverScrollableScrollPhysics(),
                            itemCount: pendingLeaves.length.clamp(0, 3),
                            itemBuilder: (context, index) {
                              final leave = pendingLeaves[index];
                              final empName = leave.user?.name ?? 'Employee';
                              final start = DateFormat('dd MMM').format(leave.startDate);
                              final end = DateFormat('dd MMM').format(leave.endDate);
                              return Container(
                                margin: const EdgeInsets.symmetric(vertical: 4),
                                child: AppCard(
                                  padding: const EdgeInsets.all(12),
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      Row(
                                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                        children: [
                                          Text(
                                            empName,
                                            style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14),
                                          ),
                                          StatusChip(label: leave.status, status: leave.status),
                                        ],
                                      ),
                                      const SizedBox(height: 4),
                                      Text(
                                        'Reason: ${leave.reason}\nDates: $start to $end (${leave.durationInDays} days)',
                                        style: const TextStyle(fontSize: 12, color: AppTheme.textLight),
                                      ),
                                      const Divider(height: 16, color: Color(0xFFF1F5F9)),
                                      Row(
                                        mainAxisAlignment: MainAxisAlignment.end,
                                        children: [
                                          TextButton(
                                            onPressed: () async {
                                              await context.read<LeaveCubit>().reviewLeave(leave.id, 'rejected');
                                              _loadData();
                                            },
                                            child: const Text('Reject', style: TextStyle(color: AppTheme.error)),
                                          ),
                                          const SizedBox(width: 8),
                                          ElevatedButton(
                                            style: ElevatedButton.styleFrom(
                                              backgroundColor: AppTheme.success,
                                              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                                              minimumSize: Size.zero,
                                            ),
                                            onPressed: () async {
                                              await context.read<LeaveCubit>().reviewLeave(leave.id, 'approved');
                                              _loadData();
                                            },
                                            child: const Text('Approve', style: TextStyle(color: Colors.white, fontSize: 12)),
                                          ),
                                        ],
                                      )
                                    ],
                                  ),
                                ),
                              );
                            },
                          ),
                        const SizedBox(height: 28),

                        // Pending Help Requests Card
                        _buildSectionHeaderWithAction(
                          title: 'Pending Requests Queue',
                          actionText: 'View All',
                          onTap: () => context.push('/admin/requests'),
                        ),
                        const SizedBox(height: 12),
                        if (pendingRequests.isEmpty)
                          _buildEmptyCard('No pending administrative requests.')
                        else
                          ListView.builder(
                            shrinkWrap: true,
                            physics: const NeverScrollableScrollPhysics(),
                            itemCount: pendingRequests.length.clamp(0, 3),
                            itemBuilder: (context, index) {
                              final request = pendingRequests[index];
                              final empName = request.user?.name ?? 'Employee';
                              return Container(
                                margin: const EdgeInsets.symmetric(vertical: 4),
                                child: AppCard(
                                  padding: const EdgeInsets.all(12),
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      Row(
                                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                        children: [
                                          Text(
                                            empName,
                                            style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14),
                                          ),
                                          StatusChip(label: request.status, status: request.status),
                                        ],
                                      ),
                                      const SizedBox(height: 4),
                                      Text(
                                        'Type: ${request.type}\nSubject: ${request.subject}\nDescription: ${request.description}',
                                        style: const TextStyle(fontSize: 12, color: AppTheme.textLight),
                                      ),
                                      const Divider(height: 16, color: Color(0xFFF1F5F9)),
                                      Row(
                                        mainAxisAlignment: MainAxisAlignment.end,
                                        children: [
                                          TextButton(
                                            onPressed: () async {
                                              await context.read<RequestCubit>().reviewRequest(request.id, {'status': 'Rejected'});
                                              _loadData();
                                            },
                                            child: const Text('Reject', style: TextStyle(color: AppTheme.error)),
                                          ),
                                          const SizedBox(width: 8),
                                          ElevatedButton(
                                            style: ElevatedButton.styleFrom(
                                              backgroundColor: AppTheme.success,
                                              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                                              minimumSize: Size.zero,
                                            ),
                                            onPressed: () async {
                                              await context.read<RequestCubit>().reviewRequest(request.id, {'status': 'Approved'});
                                              _loadData();
                                            },
                                            child: const Text('Approve', style: TextStyle(color: Colors.white, fontSize: 12)),
                                          ),
                                        ],
                                      )
                                    ],
                                  ),
                                ),
                              );
                            },
                          ),
                        const SizedBox(height: 28),

                        // Recent Team Activity Feed
                        _buildSectionHeaderWithAction(
                          title: 'Team Activity updates',
                          actionText: 'View All',
                          onTap: () => NavigationShellScope.of(context)?.switchTab(3),
                        ),
                        const SizedBox(height: 12),
                        if (recentWork.isEmpty)
                          _buildEmptyCard('No recent activities logged by employees.')
                        else
                          ListView.builder(
                            shrinkWrap: true,
                            physics: const NeverScrollableScrollPhysics(),
                            itemCount: recentWork.length,
                            itemBuilder: (context, index) {
                              final work = recentWork[index];
                              final empName = work.user?.name ?? 'Employee';
                              return Container(
                                margin: const EdgeInsets.symmetric(vertical: 4),
                                child: AppCard(
                                  padding: const EdgeInsets.all(12),
                                  child: Row(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      Avatar(
                                        url: work.user?.profilePicture,
                                        name: empName,
                                        size: 36,
                                      ),
                                      const SizedBox(width: 12),
                                      Expanded(
                                        child: Column(
                                          crossAxisAlignment: CrossAxisAlignment.start,
                                          children: [
                                            Row(
                                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                              children: [
                                                Text(
                                                  empName,
                                                  style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13),
                                                ),
                                                StatusChip(label: work.status, status: work.status),
                                              ],
                                            ),
                                            const SizedBox(height: 2),
                                            Text(
                                              work.title,
                                              style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 13),
                                            ),
                                            const SizedBox(height: 2),
                                            Text(
                                              work.description,
                                              style: const TextStyle(fontSize: 12, color: AppTheme.textLight),
                                              maxLines: 2,
                                              overflow: TextOverflow.ellipsis,
                                            ),
                                          ],
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                              );
                            },
                          ),
                        const SizedBox(height: 24),
                      ],
                    );
                  }
                  return const EmptyState();
                },
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildSectionHeader(String title) {
    return Row(
      children: [
        Container(
          width: 4,
          height: 16,
          decoration: BoxDecoration(
            color: AppTheme.primary,
            borderRadius: BorderRadius.circular(2),
          ),
        ),
        const SizedBox(width: 8),
        Text(
          title,
          style: Theme.of(context).textTheme.titleMedium?.copyWith(
                fontWeight: FontWeight.bold,
                letterSpacing: 0.5,
              ),
        ),
      ],
    );
  }

  Widget _buildSectionHeaderWithAction({
    required String title,
    required String actionText,
    required VoidCallback onTap,
  }) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Row(
          children: [
            Container(
              width: 4,
              height: 16,
              decoration: BoxDecoration(
                color: AppTheme.primary,
                borderRadius: BorderRadius.circular(2),
              ),
            ),
            const SizedBox(width: 8),
            Text(
              title,
              style: Theme.of(context).textTheme.titleMedium?.copyWith(
                    fontWeight: FontWeight.bold,
                    letterSpacing: 0.5,
                  ),
            ),
          ],
        ),
        TextButton(
          onPressed: onTap,
          child: Text(
            actionText,
            style: const TextStyle(
              fontSize: 13,
              fontWeight: FontWeight.bold,
              color: AppTheme.primary,
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildEmptyCard(String message) {
    return AppCard(
      child: Center(
        child: Padding(
          padding: const EdgeInsets.symmetric(vertical: 8),
          child: Text(
            message,
            style: const TextStyle(color: AppTheme.textLight, fontSize: 13),
          ),
        ),
      ),
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
    ); }
}
