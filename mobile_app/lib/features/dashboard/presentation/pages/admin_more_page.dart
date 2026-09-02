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

class AdminMorePage extends StatelessWidget {
  const AdminMorePage({super.key});

  @override
  Widget build(BuildContext context) {
    final user = (context.read<AuthBloc>().state as Authenticated).user;

    return AppScaffold(
      title: 'Admin Operations',
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
                          'System Admin',
                          style: TextStyle(color: AppTheme.secondary, fontSize: 13, fontWeight: FontWeight.w600),
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
              icon: Icons.time_to_leave_outlined,
              label: 'Leaves Management',
              onTap: () => context.push('/admin/leaves'),
            ),
            _buildLinkItem(
              context,
              icon: Icons.directions_bus_outlined,
              label: 'On Duty Management',
              onTap: () => context.push('/admin/onduty'),
            ),
            _buildLinkItem(
              context,
              icon: Icons.payments_outlined,
              label: 'Payslip Management',
              onTap: () => context.push('/admin/payslips'),
            ),
            _buildLinkItem(
              context,
              icon: Icons.assignment_outlined,
              label: 'Projects Catalog',
              onTap: () => context.push('/admin/projects'),
            ),
            _buildLinkItem(
              context,
              icon: Icons.question_answer_outlined,
              label: 'Support Tickets (Requests)',
              onTap: () => context.push('/admin/requests'),
            ),
            _buildLinkItem(
              context,
              icon: Icons.notifications_none_outlined,
              label: 'Broadcast Notifications',
              onTap: () => context.push('/admin/notifications'),
            ),
            _buildLinkItem(
              context,
              icon: Icons.school_outlined,
              label: 'Internships Registry',
              onTap: () => context.push('/admin/internships'),
            ),
            _buildLinkItem(
              context,
              icon: Icons.feedback_outlined,
              label: 'Web Enquiries',
              onTap: () => context.push('/admin/enquiries'),
            ),
            _buildLinkItem(
              context,
              icon: Icons.monetization_on_outlined,
              label: 'Business Leads',
              onTap: () => context.push('/admin/leads'),
            ),
            _buildLinkItem(
              context,
              icon: Icons.collections_outlined,
              label: 'Portfolio Showcase',
              onTap: () => context.push('/admin/portfolio'),
            ),
            _buildLinkItem(
              context,
              icon: Icons.settings_outlined,
              label: 'System Settings',
              onTap: () => context.push('/admin/settings'),
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
                    content: 'Are you sure you want to sign out?',
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
          leading: Icon(icon, color: color == AppTheme.textDark ? AppTheme.secondary : color),
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
