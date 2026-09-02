import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';
import '../../../../core/theme/app_theme.dart';
import '../../../../shared/widgets/avatar.dart';
import '../../../../shared/widgets/cards.dart';
import '../../../../shared/widgets/layout.dart';
import '../../../auth/bloc/auth_bloc.dart';
import '../../../auth/bloc/auth_state.dart';

class ProfilePage extends StatelessWidget {
  const ProfilePage({super.key});

  @override
  Widget build(BuildContext context) {
    return AppScaffold(
      title: 'Profile Details',
      showAppBar: true,
      actions: [
        IconButton(
          icon: const Icon(Icons.edit_outlined, color: AppTheme.primary),
          onPressed: () => context.push('/profile/edit'),
        ),
      ],
      body: BlocBuilder<AuthBloc, AuthState>(
        builder: (context, state) {
          if (state is! Authenticated) {
            return const Scaffold(body: Center(child: CircularProgressIndicator()));
          }
          final user = state.user;

          return SingleChildScrollView(
            padding: const EdgeInsets.all(24),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Center(
                  child: Column(
                    children: [
                      Avatar(url: user.profilePicture, name: user.name, size: 90),
                      const SizedBox(height: 12),
                      Text(
                        user.name,
                        style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 20),
                      ),
                      Text(
                        user.department,
                        style: const TextStyle(color: AppTheme.textLight, fontSize: 14),
                      ),
                      const SizedBox(height: 8),
                      Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                            decoration: BoxDecoration(
                              color: AppTheme.primary.withOpacity(0.08),
                              borderRadius: BorderRadius.circular(8),
                            ),
                            child: Text(
                              user.jobRole.toUpperCase(),
                              style: const TextStyle(color: AppTheme.primary, fontSize: 10, fontWeight: FontWeight.bold, letterSpacing: 0.5),
                            ),
                          ),
                          const SizedBox(width: 8),
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                            decoration: BoxDecoration(
                              color: user.isAdmin ? Colors.purple.withOpacity(0.08) : Colors.grey.withOpacity(0.08),
                              borderRadius: BorderRadius.circular(8),
                            ),
                            child: Text(
                              user.role.toUpperCase(),
                              style: TextStyle(
                                color: user.isAdmin ? Colors.purple : AppTheme.textDark,
                                fontSize: 10,
                                fontWeight: FontWeight.bold,
                                letterSpacing: 0.5,
                              ),
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 32),

                // General Details Card
                Text(
                  'General Info',
                  style: Theme.of(context).textTheme.titleSmall?.copyWith(fontWeight: FontWeight.bold),
                ),
                const SizedBox(height: 8),
                AppCard(
                  child: Column(
                    children: [
                      _buildInfoRow('Employee ID', user.employeeId ?? 'Pending'),
                      _buildInfoRow('Username', '@${user.username}'),
                      _buildInfoRow('Email Address', user.email ?? 'Not provided'),
                      _buildInfoRow('Phone Contact', user.contact ?? 'Not provided'),
                      _buildInfoRow('Date of Joining', user.dateOfJoining != null ? DateFormat('dd MMM yyyy').format(user.dateOfJoining!) : 'N/A'),
                    ],
                  ),
                ),
                const SizedBox(height: 24),

                // Bank account details card
                Text(
                  'Bank Account Info',
                  style: Theme.of(context).textTheme.titleSmall?.copyWith(fontWeight: FontWeight.bold),
                ),
                const SizedBox(height: 8),
                AppCard(
                  child: Column(
                    children: [
                      _buildInfoRow('Bank Name', user.bankName.isNotEmpty ? user.bankName : 'Not updated'),
                      _buildInfoRow('Account Number', user.bankAccountNo.isNotEmpty ? user.bankAccountNo : 'Not updated'),
                      _buildInfoRow('IFSC Code', user.ifscCode.isNotEmpty ? user.ifscCode : 'Not updated'),
                    ],
                  ),
                ),
              ],
            ),
          );
        },
      ),
    );
  }

  Widget _buildInfoRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label, style: const TextStyle(color: AppTheme.textLight, fontSize: 13)),
          Text(value, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13, color: AppTheme.textDark)),
        ],
      ),
    );
  }
}
