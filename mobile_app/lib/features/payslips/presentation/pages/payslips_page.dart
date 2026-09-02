import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:intl/intl.dart';
import '../../../../core/theme/app_theme.dart';
import '../../../../shared/widgets/cards.dart';
import '../../../../shared/widgets/feedback.dart';
import '../../../../shared/widgets/layout.dart';
import '../../bloc/payslip_cubit.dart';

class PayslipsPage extends StatefulWidget {
  const PayslipsPage({super.key});

  @override
  State<PayslipsPage> createState() => _PayslipsPageState();
}

class _PayslipsPageState extends State<PayslipsPage> {
  @override
  void initState() {
    super.initState();
    context.read<PayslipCubit>().loadMyPayslips();
  }

  @override
  Widget build(BuildContext context) {
    return AppScaffold(
      title: 'My Payslips',
      showAppBar: true,
      body: BlocBuilder<PayslipCubit, PayslipState>(
        builder: (context, state) {
          if (state is PayslipLoading) {
            return const LoadingState();
          }
          if (state is PayslipFailure) {
            return ErrorState(
              message: state.message,
              onRetry: () => context.read<PayslipCubit>().loadMyPayslips(),
            );
          }
          if (state is PayslipLoaded) {
            final list = state.payslips;

            if (list.isEmpty) {
              return const EmptyState(
                title: 'No Payslips Found',
                message: 'No payslip document reports have been generated for you yet.',
              );
            }

            return RefreshIndicator(
              onRefresh: () async => context.read<PayslipCubit>().loadMyPayslips(),
              child: ListView.builder(
                padding: const EdgeInsets.all(16),
                itemCount: list.length,
                itemBuilder: (context, index) {
                  final slip = list[index];
                  return Container(
                    margin: const EdgeInsets.symmetric(vertical: 6),
                    child: AppCard(
                      onTap: () => _showPayslipDetails(context, slip),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                slip.month,
                                style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
                              ),
                              const SizedBox(height: 4),
                              Text(
                                'Net Salary: ₹${slip.summary.netSalary.toStringAsFixed(0)}',
                                style: const TextStyle(color: AppTheme.primary, fontWeight: FontWeight.w600),
                              ),
                            ],
                          ),
                          const Icon(Icons.arrow_forward_ios, size: 16, color: AppTheme.textLight),
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

  void _showPayslipDetails(BuildContext context, dynamic slip) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (context) {
        return SingleChildScrollView(
          padding: const EdgeInsets.all(24),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Center(
                child: Container(
                  width: 48,
                  height: 4,
                  decoration: BoxDecoration(
                    color: const Color(0xFFE2E8F0),
                    borderRadius: BorderRadius.circular(2),
                  ),
                ),
              ),
              const SizedBox(height: 24),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        slip.month.toUpperCase(),
                        style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 20),
                      ),
                      Text(
                        'Generated: ${DateFormat('dd MMM yyyy').format(slip.generatedDate)}',
                        style: const TextStyle(color: AppTheme.textLight, fontSize: 12),
                      ),
                    ],
                  ),
                  const Icon(Icons.payments_outlined, size: 36, color: AppTheme.primary),
                ],
              ),
              const Divider(height: 32, color: Color(0xFFE2E8F0)),

              // Days Payable
              _buildDetailRow('Days Payable', '${slip.daysPayable.toInt()} days'),
              const SizedBox(height: 16),

              // Earnings
              const Text(
                'EARNINGS',
                style: TextStyle(fontWeight: FontWeight.bold, color: AppTheme.primary, fontSize: 13),
              ),
              const SizedBox(height: 8),
              _buildDetailRow('Basic Salary', '₹${slip.earnings.basicSalary.toStringAsFixed(0)}'),
              _buildDetailRow('House Rent Allowance', '₹${slip.earnings.houseRentAllowance.toStringAsFixed(0)}'),
              _buildDetailRow('Medical Allowance', '₹${slip.earnings.medicalAllowance.toStringAsFixed(0)}'),
              _buildDetailRow('Special Allowance', '₹${slip.earnings.specialAllowance.toStringAsFixed(0)}'),
              const Divider(height: 24, color: Color(0xFFF1F5F9)),

              // Deductions
              const Text(
                'DEDUCTIONS',
                style: TextStyle(fontWeight: FontWeight.bold, color: AppTheme.error, fontSize: 13),
              ),
              const SizedBox(height: 8),
              _buildDetailRow('TDS (Income Tax)', '₹${slip.deductions.tds.toStringAsFixed(0)}'),
              _buildDetailRow('Professional Tax', '₹${slip.deductions.professionalTax.toStringAsFixed(0)}'),
              _buildDetailRow('Provident Fund (Employer)', '₹${slip.deductions.pfEmployerContribution.toStringAsFixed(0)}'),
              _buildDetailRow('Leave Deductions', '₹${slip.deductions.salaryDeduction.toStringAsFixed(0)}'),
              const Divider(height: 24, color: Color(0xFFF1F5F9)),

              // Summary
              const Text(
                'SUMMARY',
                style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13),
              ),
              const SizedBox(height: 8),
              _buildDetailRow('Gross Earnings', '₹${slip.summary.grossPay.toStringAsFixed(0)}'),
              _buildDetailRow('Total Deductions', '₹${slip.summary.totalDeductions.toStringAsFixed(0)}', isDeduction: true),
              const Divider(height: 16, color: Color(0xFFE2E8F0)),
              _buildDetailRow(
                'NET PAYABLE',
                '₹${slip.summary.netSalary.toStringAsFixed(0)}',
                isBold: true,
                color: AppTheme.success,
              ),
              const SizedBox(height: 20),
              Center(
                child: Text(
                  'HR Signatory: ${slip.hrSignatory}',
                  style: const TextStyle(fontStyle: FontStyle.italic, color: AppTheme.textLight, fontSize: 12),
                ),
              ),
            ],
          ),
        );
      },
    );
  }

  Widget _buildDetailRow(
    String label,
    String value, {
    bool isBold = false,
    bool isDeduction = false,
    Color? color,
  }) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(
            label,
            style: TextStyle(
              fontWeight: isBold ? FontWeight.bold : FontWeight.w500,
              color: isBold ? AppTheme.textDark : AppTheme.textLight,
            ),
          ),
          Text(
            value,
            style: TextStyle(
              fontWeight: isBold ? FontWeight.bold : FontWeight.w600,
              color: color ?? (isDeduction ? AppTheme.error : AppTheme.textDark),
            ),
          ),
        ],
      ),
    );
  }
}
