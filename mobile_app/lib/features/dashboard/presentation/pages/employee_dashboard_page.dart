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
import '../../bloc/dashboard_cubit.dart';

class EmployeeDashboardPage extends StatefulWidget {
  const EmployeeDashboardPage({super.key});

  @override
  State<EmployeeDashboardPage> createState() => _EmployeeDashboardPageState();
}

class _EmployeeDashboardPageState extends State<EmployeeDashboardPage> {
  @override
  void initState() {
    super.initState();
    _loadData();
  }

  void _loadData() {
    final user = (context.read<AuthBloc>().state as Authenticated).user;
    context.read<DashboardCubit>().loadDashboard(user.role);
  }

  String _getGreeting() {
    final hour = DateTime.now().hour;
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  }

  @override
  Widget build(BuildContext context) {
    final userState = context.read<AuthBloc>().state as Authenticated;
    final user = userState.user;

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
              // Header
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        '${_getGreeting()},',
                        style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                              color: AppTheme.textLight,
                              fontSize: 16,
                            ),
                      ),
                      const SizedBox(height: 2),
                      Text(
                        user.name,
                        style: Theme.of(context).textTheme.titleLarge?.copyWith(
                              fontSize: 24,
                              fontWeight: FontWeight.bold,
                            ),
                      ),
                      Text(
                        user.jobRole,
                        style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                              color: AppTheme.primary,
                              fontWeight: FontWeight.w600,
                            ),
                      ),
                    ],
                  ),
                  Row(
                    children: [
                      Material(
                        color: AppTheme.primary.withValues(alpha: 0.1),
                        borderRadius: BorderRadius.circular(14),
                        child: InkWell(
                          onTap: () => context.push('/chat'),
                          borderRadius: BorderRadius.circular(14),
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
                      GestureDetector(
                        onTap: () => context.push('/profile'),
                        child: Avatar(
                          url: user.profilePicture,
                          name: user.name,
                          size: 50,
                        ),
                      ),
                    ],
                  ),
                ],
              ),
              const SizedBox(height: 24),

              // Quick Actions
              Text(
                'Quick Actions',
                style: Theme.of(context).textTheme.titleMedium?.copyWith(
                      fontWeight: FontWeight.bold,
                    ),
              ),
              const SizedBox(height: 12),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  _buildQuickAction(
                    context,
                    icon: Icons.calendar_month_outlined,
                    label: 'Attendance',
                    color: AppTheme.primary,
                     onTap: () {
                            NavigationShellScope.of(context)?.switchTab(1);
                          },
                  ),
                  _buildQuickAction(
                    context,
                    icon: Icons.edit_note_outlined,
                    label: 'Work Update',
                    color: AppTheme.secondary,
                    onTap: () => context.push('/work/create'),
                  ),
                  _buildQuickAction(
                    context,
                    icon: Icons.time_to_leave_outlined,
                    label: 'Apply Leave',
                    color: AppTheme.warning,
                    onTap: () => context.push('/leave/apply'),
                  ),
                  _buildQuickAction(
                    context,
                    icon: Icons.directions_bus_outlined,
                    label: 'On Duty',
                    color: AppTheme.success,
                    onTap: () => context.push('/onduty'),
                  ),
                ],
              ),
              const SizedBox(height: 28),

              // Bloc Data
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
                        // Today's Summary Shimmer
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
                        // Notifications Shimmer
                        _buildSectionHeader("Notifications & Alerts"),
                        const SizedBox(height: 12),
                        const ShimmerPlaceholder(width: double.infinity, height: 72, borderRadius: 12),
                        const SizedBox(height: 8),
                        const ShimmerPlaceholder(width: double.infinity, height: 72, borderRadius: 12),
                        const SizedBox(height: 28),
                        // Recent Activity Shimmer
                        _buildSectionHeader("Recent Activity"),
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
                  if (state is EmployeeDashboardSuccess) {
                    final todayAttendance = state.todayAttendance;
                    final hasCheckedIn = todayAttendance != null && todayAttendance.checkIn != null;
                    final hasCheckedOut = todayAttendance != null && todayAttendance.checkOut != null;
                    
                    final attendanceList = state.attendanceSummary['attendance'] as List?;
                    final presentDays = attendanceList?.where((e) => e is Map && e['status'] == 'present').length ?? 0;
                    final workingDays = 22;
                    final attendanceRate = workingDays > 0 ? (presentDays / workingDays) * 100 : 0.0;

                    return Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        // Stats Card
                        _buildSectionHeader("Today's Summary"),
                        const SizedBox(height: 12),
                        Row(
                          children: [
                            Expanded(
                              child: StatCard(
                                title: 'Attendance',
                                value: hasCheckedIn
                                    ? (hasCheckedOut ? 'Checked Out' : 'Active')
                                    : 'Not In',
                                icon: Icons.timer_outlined,
                                color: hasCheckedIn ? (hasCheckedOut ? AppTheme.warning : AppTheme.success) : AppTheme.error,
                                subtitle: hasCheckedIn
                                    ? 'In: ${DateFormat('hh:mm a').format(todayAttendance.checkIn!)}'
                                    : 'Check-in pending',
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 16),
                        Row(
                          children: [
                            Expanded(
                              child: StatCard(
                                title: 'Monthly Stats',
                                value: '${attendanceRate.toStringAsFixed(0)}%',
                                icon: Icons.percent_outlined,
                                color: AppTheme.primary,
                                subtitle: '$presentDays / $workingDays days present',
                              ),
                            ),
                            const SizedBox(width: 16),
                            Expanded(
                              child: StatCard(
                                title: 'Open Requests',
                                value: '${state.recentRequests.where((e) => e.status == 'Pending').length}',
                                icon: Icons.question_answer_outlined,
                                color: AppTheme.secondary,
                                subtitle: 'Waiting resolution',
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 28),

                        // Notifications / Announcements
                        _buildSectionHeaderWithAction(
                          title: 'Notifications & Alerts',
                          actionText: 'View All',
                          onTap: () => context.push('/notifications'),
                        ),
                        const SizedBox(height: 8),
                        if (state.notifications.isEmpty)
                          _buildEmptyCard('No notifications or announcements today.')
                        else
                          ListView.builder(
                            shrinkWrap: true,
                            physics: const NeverScrollableScrollPhysics(),
                            itemCount: state.notifications.length,
                            itemBuilder: (context, index) {
                              final notif = state.notifications[index];
                              return Container(
                                margin: const EdgeInsets.symmetric(vertical: 4),
                                child: AppCard(
                                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                                  child: Row(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      Container(
                                        padding: const EdgeInsets.all(8),
                                        decoration: BoxDecoration(
                                          color: AppTheme.secondary.withOpacity(0.1),
                                          shape: BoxShape.circle,
                                        ),
                                        child: const Icon(Icons.campaign, color: AppTheme.secondary, size: 20),
                                      ),
                                      const SizedBox(width: 16),
                                      Expanded(
                                        child: Column(
                                          crossAxisAlignment: CrossAxisAlignment.start,
                                          children: [
                                            Text(
                                              notif.title,
                                              style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14, color: AppTheme.textDark),
                                            ),
                                            const SizedBox(height: 4),
                                            Text(
                                              notif.message,
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

                        // Recent Activity
                        _buildSectionHeaderWithAction(
                          title: 'Recent Activity',
                          actionText: 'View All',
                          onTap: () {
                            NavigationShellScope.of(context)?.switchTab(2);
                          },
                        ),
                        const SizedBox(height: 8),
                        if (state.recentWork.isEmpty)
                          _buildEmptyCard('No recent activities logged today.')
                        else
                          ListView.builder(
                            shrinkWrap: true,
                            physics: const NeverScrollableScrollPhysics(),
                            itemCount: state.recentWork.length,
                            itemBuilder: (context, index) {
                              final work = state.recentWork[index];
                              return Container(
                                margin: const EdgeInsets.symmetric(vertical: 4),
                                child: AppCard(
                                  padding: const EdgeInsets.all(12),
                                  child: ListTile(
                                    contentPadding: EdgeInsets.zero,
                                    title: Text(
                                      work.title,
                                      style: const TextStyle(fontWeight: FontWeight.bold),
                                    ),
                                    subtitle: Text(
                                      '${DateFormat('dd MMM').format(work.date)} • ${work.status}',
                                      style: const TextStyle(fontSize: 12),
                                    ),
                                    trailing: const Icon(Icons.arrow_forward_ios, size: 14),
                                  ),
                                ),
                              );
                            },
                          ),
                        const SizedBox(height: 24),

                        // Recent Leaves
                        _buildSectionHeaderWithAction(
                          title: 'Recent Leaves',
                          actionText: 'View All',
                          onTap: () {
                            NavigationShellScope.of(context)?.switchTab(3);
                          },
                        ),
                        const SizedBox(height: 8),
                        if (state.recentLeaves.isEmpty)
                          _buildEmptyCard('No recent leaves applied.')
                        else
                          ListView.builder(
                            shrinkWrap: true,
                            physics: const NeverScrollableScrollPhysics(),
                            itemCount: state.recentLeaves.length,
                            itemBuilder: (context, index) {
                              final leave = state.recentLeaves[index];
                              final start = DateFormat('dd MMM').format(leave.startDate);
                              final end = DateFormat('dd MMM').format(leave.endDate);
                              return Container(
                                margin: const EdgeInsets.symmetric(vertical: 4),
                                child: AppCard(
                                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                                  child: Row(
                                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                    children: [
                                      Expanded(
                                        child: Column(
                                          crossAxisAlignment: CrossAxisAlignment.start,
                                          children: [
                                            Text(
                                              leave.reason,
                                              style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14, color: AppTheme.textDark),
                                              maxLines: 1,
                                              overflow: TextOverflow.ellipsis,
                                            ),
                                            const SizedBox(height: 4),
                                            Text(
                                              '$start to $end • ${leave.durationInDays} days',
                                              style: const TextStyle(fontSize: 12, color: AppTheme.textLight),
                                            ),
                                          ],
                                        ),
                                      ),
                                      StatusChip(label: leave.status, status: leave.status),
                                    ],
                                  ),
                                ),
                              );
                            },
                          ),
                        const SizedBox(height: 24),

                        // Recent Requests
                        _buildSectionHeaderWithAction(
                          title: 'Recent Requests',
                          actionText: 'View All',
                          onTap: () => context.push('/requests'),
                        ),
                        const SizedBox(height: 8),
                        if (state.recentRequests.isEmpty)
                          _buildEmptyCard('No recent requests made.')
                        else
                          ListView.builder(
                            shrinkWrap: true,
                            physics: const NeverScrollableScrollPhysics(),
                            itemCount: state.recentRequests.length,
                            itemBuilder: (context, index) {
                              final request = state.recentRequests[index];
                              return Container(
                                margin: const EdgeInsets.symmetric(vertical: 4),
                                child: AppCard(
                                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                                  child: Row(
                                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                    children: [
                                      Expanded(
                                        child: Column(
                                          crossAxisAlignment: CrossAxisAlignment.start,
                                          children: [
                                            Text(
                                              request.subject,
                                              style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14, color: AppTheme.textDark),
                                              maxLines: 1,
                                              overflow: TextOverflow.ellipsis,
                                            ),
                                            const SizedBox(height: 4),
                                            Text(
                                              '${request.type} • ${request.description}',
                                              style: const TextStyle(fontSize: 12, color: AppTheme.textLight),
                                              maxLines: 1,
                                              overflow: TextOverflow.ellipsis,
                                            ),
                                          ],
                                        ),
                                      ),
                                      StatusChip(label: request.status, status: request.status),
                                    ],
                                  ),
                                ),
                              );
                            },
                          ),
                        const SizedBox(height: 20),
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

  Widget _buildQuickAction(
    BuildContext context, {
    required IconData icon,
    required String label,
    required Color color,
    required VoidCallback onTap,
  }) {
    return GestureDetector(
      onTap: onTap,
      child: Column(
        children: [
          Container(
            width: 60,
            height: 60,
            decoration: BoxDecoration(
              color: color.withOpacity(0.1),
              borderRadius: BorderRadius.circular(16),
            ),
            child: Icon(
              icon,
              color: color,
              size: 28,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            label,
            style: Theme.of(context).textTheme.bodySmall?.copyWith(
                  color: AppTheme.textDark,
                  fontWeight: FontWeight.w600,
                  fontSize: 12,
                ),
          ),
        ],
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
    );
  }
}
