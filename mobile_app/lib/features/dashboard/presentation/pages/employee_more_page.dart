import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:go_router/go_router.dart';
import '../../../../core/theme/app_theme.dart';
import '../../../../shared/widgets/avatar.dart';
import '../../../../shared/widgets/layout.dart';
import '../../../../shared/widgets/dialogs.dart';
import '../../../auth/bloc/auth_bloc.dart';
import '../../../auth/bloc/auth_event.dart';
import '../../../auth/bloc/auth_state.dart';

class EmployeeMorePage extends StatelessWidget {
  const EmployeeMorePage({super.key});

  @override
  Widget build(BuildContext context) {
    final user = (context.read<AuthBloc>().state as Authenticated).user;

    return AppScaffold(
      title: 'More',
      body: SingleChildScrollView(
        padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
        child: Column(
          children: [
            // User Brief
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: const Color(0xFFE2E8F0)),
              ),
              child: Row(
                children: [
                  Avatar(
                    url: user.profilePicture,
                    name: user.name,
                    size: 64,
                  ),
                  const SizedBox(width: 16),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          user.name,
                          style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 18),
                        ),
                        Text(
                          '${user.jobRole} • ${user.department}',
                          style: const TextStyle(color: AppTheme.textLight, fontSize: 13),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          'ID: ${user.employeeId ?? 'N/A'}',
                          style: const TextStyle(color: AppTheme.primary, fontSize: 12, fontWeight: FontWeight.bold),
                        ),
                      ],
                    ),
                  ),
                  IconButton(
                    icon: const Icon(Icons.arrow_forward_ios, size: 16),
                    onPressed: () => context.push('/profile'),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 24),

            // Links List
            _buildLinkItem(
              context,
              icon: Icons.chat_bubble_outline_rounded,
              label: 'Team Messages (Chat)',
              onTap: () => context.push('/chat'),
            ),
            _buildLinkItem(
              context,
              icon: Icons.directions_bus_outlined,
              label: 'On Duty',
              onTap: () => context.push('/onduty'),
            ),
            _buildLinkItem(
              context,
              icon: Icons.payments_outlined,
              label: 'Payslips',
              onTap: () => context.push('/payslips'),
            ),
            _buildLinkItem(
              context,
              icon: Icons.assignment_outlined,
              label: 'Projects',
              onTap: () => context.push('/projects'),
            ),
            _buildLinkItem(
              context,
              icon: Icons.question_answer_outlined,
              label: 'Requests & Enquiries',
              onTap: () => context.push('/requests'),
            ),
            _buildLinkItem(
              context,
              icon: Icons.notifications_none_outlined,
              label: 'Notifications',
              onTap: () => context.push('/notifications'),
            ),
            _buildLinkItem(
              context,
              icon: Icons.help_outline_outlined,
              label: 'Help & Support',
              onTap: () => context.push('/help'),
            ),
            const Divider(color: Color(0xFFE2E8F0), height: 32),
            _buildLinkItem(
              context,
              icon: Icons.logout_outlined,
              label: 'Sign Out',
              color: AppTheme.error,
              onTap: () {
                showDialog(
                  context: context,
                  builder: (context) => ConfirmationDialog(
                    title: 'Sign Out',
                    content: 'Are you sure you want to sign out of the application?',
                    confirmText: 'Sign Out',
                    confirmColor: AppTheme.error,
                    onConfirm: () {
                      context.read<AuthBloc>().add(LogoutEvent());
                      context.go('/login');
                    },
                  ),
                );
              },
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildLinkItem(
    BuildContext context, {
    required IconData icon,
    required String label,
    required VoidCallback onTap,
    Color color = AppTheme.textDark,
  }) {
    return Container(
      margin: const EdgeInsets.symmetric(vertical: 4),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: const Color(0xFFF1F5F9)),
      ),
      child: Material(
        color: Colors.transparent,
        child: ListTile(
          leading: Icon(icon, color: color == AppTheme.textDark ? AppTheme.primary : color),
          title: Text(
            label,
            style: TextStyle(fontWeight: FontWeight.w600, color: color, fontSize: 15),
          ),
          trailing: const Icon(Icons.arrow_forward_ios, size: 14, color: AppTheme.textLight),
          onTap: onTap,
        ),
      ),
    );
  }
}
