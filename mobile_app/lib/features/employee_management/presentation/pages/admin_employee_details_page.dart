import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';
import '../../../../core/theme/app_theme.dart';
import '../../../../shared/widgets/avatar.dart';
import '../../../../shared/widgets/cards.dart';
import '../../../../shared/widgets/feedback.dart';
import '../../../../shared/widgets/layout.dart';
import '../../../../shared/widgets/dialogs.dart';
import '../../bloc/employees_cubit.dart';

class AdminEmployeeDetailsPage extends StatelessWidget {
  final String employeeId;

  const AdminEmployeeDetailsPage({super.key, required this.employeeId});

  @override
  Widget build(BuildContext context) {
    return AppScaffold(
      title: 'Employee Details',
      showAppBar: true,
      body: BlocBuilder<EmployeesCubit, EmployeesState>(
        builder: (context, state) {
          if (state is EmployeesLoading) {
            return const LoadingState();
          }
          if (state is EmployeesLoaded) {
            final list = state.employees.where((e) => e.id == employeeId);
            if (list.isEmpty) {
              return const ErrorState(message: 'Employee records not found.');
            }
            final emp = list.first;

            return SingleChildScrollView(
              padding: const EdgeInsets.all(24),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Avatar Header
                  Center(
                    child: Column(
                      children: [
                        Avatar(url: emp.profilePicture, name: emp.name, size: 90),
                        const SizedBox(height: 12),
                        Text(
                          emp.name,
                          style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 20),
                        ),
                        Text(
                          '${emp.jobRole} • ${emp.department}',
                          style: const TextStyle(color: AppTheme.textLight, fontSize: 14),
                        ),
                        Text(
                          'ID: ${emp.employeeId ?? 'Pending'}',
                          style: const TextStyle(color: AppTheme.primary, fontWeight: FontWeight.bold, fontSize: 13),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 32),

                  // Personal info Card
                  Text(
                    'Personal & Contact Details',
                    style: Theme.of(context).textTheme.titleSmall?.copyWith(fontWeight: FontWeight.bold),
                  ),
                  const SizedBox(height: 10),
                  AppCard(
                    child: Column(
                      children: [
                        _buildInfoItem('Username', emp.username),
                        _buildInfoItem('Email', emp.email ?? 'Not provided'),
                        _buildInfoItem('Contact Phone', emp.contact ?? 'Not provided'),
                        _buildInfoItem('Date of Joining', emp.dateOfJoining != null ? DateFormat('dd MMM yyyy').format(emp.dateOfJoining!) : 'N/A'),
                      ],
                    ),
                  ),
                  const SizedBox(height: 24),

                  // Permissions Card
                  Text(
                    'Management Permissions',
                    style: Theme.of(context).textTheme.titleSmall?.copyWith(fontWeight: FontWeight.bold),
                  ),
                  const SizedBox(height: 10),
                  AppCard(
                    child: Column(
                      children: [
                        _buildPermissionItem('Manage Internships', emp.canManageInternships),
                        _buildPermissionItem('Manage Enquiries', emp.canManageEnquiries),
                        _buildPermissionItem('Manage Business Leads', emp.canManageLeads),
                      ],
                    ),
                  ),
                  const SizedBox(height: 24),

                  // Bank details (SaaS Style)
                  Text(
                    'Protected Bank Details',
                    style: Theme.of(context).textTheme.titleSmall?.copyWith(fontWeight: FontWeight.bold),
                  ),
                  const SizedBox(height: 10),
                  AppCard(
                    child: Column(
                      children: [
                        _buildInfoItem('Bank Name', emp.bankName.isEmpty ? 'N/A' : emp.bankName),
                        _buildInfoItem('Account Number', emp.bankAccountNo.isEmpty ? 'N/A' : '•••• •••• ${emp.bankAccountNo.substring(emp.bankAccountNo.length.clamp(4, 15) - 4)}'),
                        _buildInfoItem('IFSC Routing Code', emp.ifscCode.isEmpty ? 'N/A' : emp.ifscCode),
                      ],
                    ),
                  ),
                  const SizedBox(height: 40),

                  // Edit & Delete row
                  Row(
                    children: [
                      Expanded(
                        child: OutlinedButton(
                          onPressed: () => context.push('/admin/employees/edit/$employeeId'),
                          style: OutlinedButton.styleFrom(
                            minimumSize: const Size(double.infinity, 48),
                            side: const BorderSide(color: AppTheme.primary, width: 1.5),
                          ),
                          child: const Text('Edit Account', style: TextStyle(color: AppTheme.primary, fontWeight: FontWeight.bold)),
                        ),
                      ),
                      const SizedBox(width: 16),
                      Expanded(
                        child: ElevatedButton(
                          onPressed: () {
                            showDialog(
                              context: context,
                              builder: (context) => ConfirmationDialog(
                                title: 'Delete Account',
                                content: 'Are you sure you want to remove ${emp.name}? This will permanently delete their account and database logs.',
                                confirmText: 'Delete',
                                confirmColor: AppTheme.error,
                                onConfirm: () {
                                  context.read<EmployeesCubit>().removeEmployee(employeeId).then((_) {
                                    context.pop();
                                  });
                                },
                              ),
                            );
                          },
                          style: ElevatedButton.styleFrom(
                            backgroundColor: AppTheme.error,
                            minimumSize: const Size(double.infinity, 48),
                          ),
                          child: const Text('Delete Account'),
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            );
          }
          return const EmptyState();
        },
      ),
    );
  }

  Widget _buildInfoItem(String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 6),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label, style: const TextStyle(color: AppTheme.textLight, fontSize: 13)),
          Text(value, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13, color: AppTheme.textDark)),
        ],
      ),
    );
  }

  Widget _buildPermissionItem(String label, bool value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label, style: const TextStyle(fontSize: 13)),
          Icon(
            value ? Icons.check_circle : Icons.cancel_outlined,
            color: value ? AppTheme.success : AppTheme.textLight.withOpacity(0.5),
            size: 20,
          ),
        ],
      ),
    );
  }
}

extension on OutlinedButtonThemeData {
  Widget primaryElevatedButton({required VoidCallback onPressed, required Widget child}) {
    return OutlinedButton(
      onPressed: onPressed,
      style: OutlinedButton.styleFrom(
        minimumSize: const Size(double.infinity, 48),
        side: const BorderSide(color: AppTheme.primary, width: 1.5),
      ),
      child: child,
    );
  }
}
