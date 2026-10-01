import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:intl/intl.dart';
import '../../../../core/theme/app_theme.dart';
import '../../../../shared/widgets/cards.dart';
import '../../../../shared/widgets/feedback.dart';
import '../../../../shared/widgets/layout.dart';
import '../../bloc/report_cubit.dart';
import '../../data/models/report_model.dart';

class AdminReportsPage extends StatefulWidget {
  const AdminReportsPage({super.key});

  @override
  State<AdminReportsPage> createState() => _AdminReportsPageState();
}

class _AdminReportsPageState extends State<AdminReportsPage> {
  late int _selectedMonth;
  late int _selectedYear;

  @override
  void initState() {
    super.initState();
    final now = DateTime.now();
    _selectedMonth = now.month - 1; // 0-indexed
    _selectedYear = now.year;
    _load();
  }

  void _load() {
    context.read<ReportCubit>().loadReportData(
      month: _selectedMonth,
      year: _selectedYear,
    );
  }

  String _getMonthName(int month) {
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    return months[month];
  }

  void _previousMonth() {
    setState(() {
      _selectedMonth--;
      if (_selectedMonth < 0) {
        _selectedMonth = 11;
        _selectedYear--;
      }
    });
    _load();
  }

  void _nextMonth() {
    setState(() {
      _selectedMonth++;
      if (_selectedMonth > 11) {
        _selectedMonth = 0;
        _selectedYear++;
      }
    });
    _load();
  }

  Widget _buildMetricCard(String title, String value, IconData icon, Color color) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: const Color(0xFFE2E8F0)),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(0.02),
              blurRadius: 4,
              offset: const Offset(0, 2),
            ),
          ],
        ),
        child: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: color.withOpacity(0.12),
                borderRadius: BorderRadius.circular(8),
              ),
              child: Icon(icon, color: color, size: 20),
            ),
            const SizedBox(width: 8),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    value,
                    style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16, color: color),
                  ),
                  Text(
                    title,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(color: AppTheme.textLight, fontSize: 11),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return AppScaffold(
      title: 'HR Reports & Muster Roll',
      showAppBar: true,
      body: BlocBuilder<ReportCubit, ReportState>(
        builder: (context, state) {
          if (state is ReportLoading) {
            return const LoadingState();
          }
          if (state is ReportFailure) {
            return ErrorState(message: state.message, onRetry: _load);
          }
          if (state is ReportLoaded) {
            final overview = state.overview;
            final musterRoll = state.musterRoll;

            return SingleChildScrollView(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // High Level HR Metrics
                  if (overview != null) ...[
                    Row(
                      children: [
                        _buildMetricCard('Total Staff', '${overview.totalEmployees}', Icons.people_alt, AppTheme.primary),
                        const SizedBox(width: 8),
                        _buildMetricCard('Present Today', '${overview.presentToday}', Icons.check_circle, AppTheme.success),
                      ],
                    ),
                    const SizedBox(height: 8),
                    Row(
                      children: [
                        _buildMetricCard('Pending Leaves', '${overview.pendingLeaves}', Icons.time_to_leave, const Color(0xFFF59E0B)),
                        const SizedBox(width: 8),
                        _buildMetricCard('Pending Claims', '${overview.pendingExpenses}', Icons.receipt_long, const Color(0xFF8B5CF6)),
                      ],
                    ),
                    const SizedBox(height: 8),
                    Row(
                      children: [
                        _buildMetricCard('Active Tasks', '${overview.activeTasks}', Icons.task_alt, const Color(0xFF0D9488)),
                        const SizedBox(width: 8),
                        _buildMetricCard('Reimbursements', '₹${overview.totalReimbursementMonth.toInt()}', Icons.payments, const Color(0xFFE11D48)),
                      ],
                    ),
                    const SizedBox(height: 20),
                  ],

                  // Month Selector Bar
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: const Color(0xFFE2E8F0)),
                    ),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        IconButton(
                          icon: const Icon(Icons.chevron_left),
                          onPressed: _previousMonth,
                        ),
                        Text(
                          '${_getMonthName(_selectedMonth)} $_selectedYear Muster Roll',
                          style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 15),
                        ),
                        IconButton(
                          icon: const Icon(Icons.chevron_right),
                          onPressed: _nextMonth,
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 16),

                  // Muster Roll Employee List
                  const Text(
                    'Employee Monthly Attendance Breakdown',
                    style: TextStyle(fontWeight: FontWeight.bold, fontSize: 15, color: AppTheme.textDark),
                  ),
                  const SizedBox(height: 8),

                  if (musterRoll == null || musterRoll.employees.isEmpty)
                    const EmptyState(
                      title: 'No Data',
                      message: 'No employee records found for this period.',
                    )
                  else
                    ListView.builder(
                      shrinkWrap: true,
                      physics: const NeverScrollableScrollPhysics(),
                      itemCount: musterRoll.employees.length,
                      itemBuilder: (context, index) {
                        final emp = musterRoll.employees[index];
                        final presentRatio = emp.totalDaysInMonth > 0
                            ? (emp.presentDays / emp.totalDaysInMonth)
                            : 0.0;

                        return Container(
                          margin: const EdgeInsets.only(bottom: 10),
                          child: AppCard(
                            padding: const EdgeInsets.all(14),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Row(
                                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                  children: [
                                    Column(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      children: [
                                        Text(
                                          emp.name,
                                          style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 15),
                                        ),
                                        Text(
                                          '${emp.employeeId} • ${emp.jobRole}',
                                          style: const TextStyle(color: AppTheme.textLight, fontSize: 12),
                                        ),
                                      ],
                                    ),
                                    Container(
                                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                                      decoration: BoxDecoration(
                                        color: AppTheme.primary.withOpacity(0.1),
                                        borderRadius: BorderRadius.circular(20),
                                      ),
                                      child: Text(
                                        '${emp.presentDays} / ${emp.totalDaysInMonth} Days',
                                        style: const TextStyle(
                                          color: AppTheme.primary,
                                          fontWeight: FontWeight.bold,
                                          fontSize: 12,
                                        ),
                                      ),
                                    ),
                                  ],
                                ),
                                const SizedBox(height: 10),
                                ClipRRect(
                                  borderRadius: BorderRadius.circular(4),
                                  child: LinearProgressIndicator(
                                    value: presentRatio.clamp(0.0, 1.0),
                                    backgroundColor: const Color(0xFFE2E8F0),
                                    valueColor: AlwaysStoppedAnimation<Color>(
                                      presentRatio > 0.75 ? AppTheme.success : (presentRatio > 0.5 ? const Color(0xFFF59E0B) : AppTheme.error),
                                    ),
                                    minHeight: 6,
                                  ),
                                ),
                                const SizedBox(height: 10),
                                Row(
                                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                  children: [
                                    Text(
                                      'Hours Logged: ${emp.totalWorkHours} hrs',
                                      style: const TextStyle(fontSize: 12, color: AppTheme.textLight),
                                    ),
                                    if (emp.halfDays > 0)
                                      Text(
                                        'Half-Days: ${emp.halfDays}',
                                        style: const TextStyle(fontSize: 12, color: Color(0xFFF59E0B), fontWeight: FontWeight.w600),
                                      ),
                                  ],
                                ),
                              ],
                            ),
                          ),
                        );
                      },
                    ),
                ],
              ),
            );
          }
          return const SizedBox.shrink();
        },
      ),
    );
  }
}
