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
import '../../../../shared/widgets/buttons.dart';
import '../../../../shared/widgets/text_fields.dart';
import '../../bloc/employees_cubit.dart';
import '../../../attendance/bloc/attendance_cubit.dart';
import '../../../attendance/data/models/attendance_model.dart';
import '../../../attendance/data/repository/attendance_repository.dart';
import '../../../leave/data/models/leave_model.dart';
import '../../../on_duty/data/models/on_duty_model.dart';
import '../../../auth/data/models/user_model.dart';

class AdminEmployeeDetailsPage extends StatefulWidget {
  final String employeeId;

  const AdminEmployeeDetailsPage({super.key, required this.employeeId});

  @override
  State<AdminEmployeeDetailsPage> createState() => _AdminEmployeeDetailsPageState();
}

class _AdminEmployeeDetailsPageState extends State<AdminEmployeeDetailsPage> with SingleTickerProviderStateMixin {
  late TabController _tabController;
  late int _selectedMonth;
  late int _selectedYear;

  bool _isLoadingSummary = false;
  Map<String, dynamic>? _summaryData;
  List<AttendanceModel> _attendanceRecords = [];
  List<LeaveModel> _employeeLeaves = [];
  List<OnDutyModel> _employeeOnDuty = [];

  final AttendanceRepository _attendanceRepo = AttendanceRepository();

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 4, vsync: this);
    final now = DateTime.now();
    _selectedMonth = now.month - 1; // 0-indexed
    _selectedYear = now.year;
    _fetchEmployeeData();
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  Future<void> _fetchEmployeeData() async {
    setState(() {
      _isLoadingSummary = true;
    });

    try {
      final res = await _attendanceRepo.getEmployeeSummary(
        userId: widget.employeeId,
        month: _selectedMonth,
        year: _selectedYear,
      );

      final attList = (res['attendance'] as List?)
              ?.map((e) => AttendanceModel.fromJson(e as Map<String, dynamic>))
              .toList() ??
          [];

      final leaves = (res['leaves'] as List?)
              ?.map((e) => LeaveModel.fromJson(e as Map<String, dynamic>))
              .toList() ??
          [];

      final onDuty = (res['onDuty'] as List?)
              ?.map((e) => OnDutyModel.fromJson(e as Map<String, dynamic>))
              .toList() ??
          [];

      if (mounted) {
        setState(() {
          _summaryData = res['summary'] as Map<String, dynamic>?;
          _attendanceRecords = attList;
          _employeeLeaves = leaves;
          _employeeOnDuty = onDuty;
          _isLoadingSummary = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _isLoadingSummary = false;
        });
      }
    }
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
    _fetchEmployeeData();
  }

  void _nextMonth() {
    setState(() {
      _selectedMonth++;
      if (_selectedMonth > 11) {
        _selectedMonth = 0;
        _selectedYear++;
      }
    });
    _fetchEmployeeData();
  }

  void _openManualCheckoutModal(AttendanceModel att) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => _ManualCheckoutBottomSheet(
        attendance: att,
        userId: widget.employeeId,
        onSuccess: _fetchEmployeeData,
      ),
    );
  }

  void _openRegularizeNewDateModal() {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => _RegularizeNewDateBottomSheet(
        userId: widget.employeeId,
        onSuccess: _fetchEmployeeData,
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return AppScaffold(
      title: 'Employee Profile & Log',
      showAppBar: true,
      body: BlocBuilder<EmployeesCubit, EmployeesState>(
        builder: (context, state) {
          if (state is EmployeesLoading) {
            return const LoadingState();
          }
          if (state is EmployeesLoaded) {
            final list = state.employees.where((e) => e.id == widget.employeeId);
            if (list.isEmpty) {
              return const ErrorState(message: 'Employee records not found.');
            }
            final emp = list.first;

            return Column(
              children: [
                // Top Header Card
                Container(
                  color: Colors.white,
                  padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
                  child: Row(
                    children: [
                      Avatar(url: emp.profilePicture, name: emp.name, size: 60),
                      const SizedBox(width: 14),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              emp.name,
                              style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 18),
                            ),
                            const SizedBox(height: 2),
                            Text(
                              '${emp.jobRole} • ${emp.department}',
                              style: const TextStyle(color: AppTheme.textLight, fontSize: 13),
                            ),
                            const SizedBox(height: 2),
                            Text(
                              'ID: ${emp.employeeId ?? 'Pending'}',
                              style: const TextStyle(color: AppTheme.primary, fontWeight: FontWeight.bold, fontSize: 12),
                            ),
                          ],
                        ),
                      ),
                      IconButton(
                        icon: const Icon(Icons.edit_outlined, color: AppTheme.primary),
                        onPressed: () => context.push('/admin/employees/edit/${widget.employeeId}'),
                      ),
                    ],
                  ),
                ),

                // Tabs Bar
                Container(
                  color: Colors.white,
                  child: TabBar(
                    controller: _tabController,
                    isScrollable: true,
                    labelColor: AppTheme.primary,
                    unselectedLabelColor: AppTheme.textLight,
                    indicatorColor: AppTheme.primary,
                    indicatorWeight: 3,
                    labelStyle: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13),
                    tabs: const [
                      Tab(text: 'Attendance Log', icon: Icon(Icons.calendar_month_outlined, size: 18)),
                      Tab(text: 'Leave Status', icon: Icon(Icons.time_to_leave_outlined, size: 18)),
                      Tab(text: 'On Duty Requests', icon: Icon(Icons.directions_bus_outlined, size: 18)),
                      Tab(text: 'Profile & Info', icon: Icon(Icons.person_outline, size: 18)),
                    ],
                  ),
                ),
                const Divider(height: 1, color: Color(0xFFE2E8F0)),

                // Tab Views
                Expanded(
                  child: TabBarView(
                    controller: _tabController,
                    children: [
                      _buildAttendanceTab(),
                      _buildLeavesTab(emp),
                      _buildOnDutyTab(),
                      _buildProfileInfoTab(emp),
                    ],
                  ),
                ),
              ],
            );
          }
          return const SizedBox.shrink();
        },
      ),
    );
  }

  // 1. Attendance Tab
  Widget _buildAttendanceTab() {
    if (_isLoadingSummary) {
      return const LoadingState();
    }

    final summary = _summaryData ?? {};
    final totalDays = summary['totalDaysInMonth'] ?? 30;
    final presentDays = summary['presentDays'] ?? 0.0;
    final halfDays = summary['halfDays'] ?? 0;
    final absentDays = summary['absentDays'] ?? 0;
    final totalHours = summary['totalWorkHours'] ?? 0.0;
    final onDutyDays = summary['onDutyApprovedDays'] ?? 0;

    return RefreshIndicator(
      onRefresh: _fetchEmployeeData,
      child: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Month Picker Bar
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
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
                    '${_getMonthName(_selectedMonth)} $_selectedYear Log',
                    style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 15),
                  ),
                  IconButton(
                    icon: const Icon(Icons.chevron_right),
                    onPressed: _nextMonth,
                  ),
                ],
              ),
            ),
            const SizedBox(height: 14),

            // Summary Calculation Grid
            Row(
              children: [
                _buildMetricItem('Present Days', '$presentDays / $totalDays', AppTheme.primary, Icons.check_circle),
                const SizedBox(width: 8),
                _buildMetricItem('Working Hours', '$totalHours hrs', const Color(0xFF0D9488), Icons.access_time),
              ],
            ),
            const SizedBox(height: 8),
            Row(
              children: [
                _buildMetricItem('Half-Days', '$halfDays (Auto 4h)', const Color(0xFFF59E0B), Icons.hourglass_bottom),
                const SizedBox(width: 8),
                _buildMetricItem('On Duty (Present)', '$onDutyDays days', const Color(0xFF6366F1), Icons.directions_bus),
              ],
            ),
            const SizedBox(height: 16),

            // Regularize / Manual punch action bar
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Text(
                  'Daily Punch Records',
                  style: TextStyle(fontWeight: FontWeight.bold, fontSize: 15, color: AppTheme.textDark),
                ),
                TextButton.icon(
                  icon: const Icon(Icons.add_circle_outline, size: 16),
                  label: const Text('Add Punch', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 12)),
                  onPressed: _openRegularizeNewDateModal,
                ),
              ],
            ),
            const SizedBox(height: 8),

            if (_attendanceRecords.isEmpty)
              const EmptyState(
                title: 'No Punches Recorded',
                message: 'No check-in entries found for this month.',
              )
            else
              ListView.builder(
                shrinkWrap: true,
                physics: const NeverScrollableScrollPhysics(),
                itemCount: _attendanceRecords.length,
                itemBuilder: (context, index) {
                  final att = _attendanceRecords[index];
                  final formattedDate = DateFormat('EEE, dd MMM yyyy').format(att.date);
                  final checkInStr = att.checkIn != null ? DateFormat('hh:mm a').format(att.checkIn!) : '--:--';
                  final checkOutStr = att.checkOut != null ? DateFormat('hh:mm a').format(att.checkOut!) : null;

                  final isMissingCheckout = att.isMissingCheckout;
                  final statusColor = att.isOnDuty
                      ? const Color(0xFF6366F1)
                      : (att.effectiveStatus == 'present'
                          ? AppTheme.success
                          : (att.effectiveStatus == 'half-day' ? const Color(0xFFF59E0B) : AppTheme.error));

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
                              Text(
                                formattedDate,
                                style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14),
                              ),
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                                decoration: BoxDecoration(
                                  color: statusColor.withOpacity(0.12),
                                  borderRadius: BorderRadius.circular(12),
                                  border: Border.all(color: statusColor.withOpacity(0.3)),
                                ),
                                child: Text(
                                  att.isOnDuty ? 'ON DUTY' : att.effectiveStatus.toUpperCase(),
                                  style: TextStyle(
                                    color: statusColor,
                                    fontWeight: FontWeight.bold,
                                    fontSize: 10,
                                  ),
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 8),

                          // Times & Working Hours
                          Row(
                            children: [
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    const Text('Check-In', style: TextStyle(color: AppTheme.textLight, fontSize: 11)),
                                    Text(checkInStr, style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 13)),
                                  ],
                                ),
                              ),
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    const Text('Check-Out', style: TextStyle(color: AppTheme.textLight, fontSize: 11)),
                                    Text(
                                      checkOutStr ?? '⚠️ Missed (Half-Day)',
                                      style: TextStyle(
                                        fontWeight: FontWeight.w600,
                                        fontSize: 13,
                                        color: checkOutStr != null ? AppTheme.textDark : const Color(0xFFE11D48),
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    const Text('Work Hours', style: TextStyle(color: AppTheme.textLight, fontSize: 11)),
                                    Text('${att.effectiveHours} hrs', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13, color: AppTheme.primary)),
                                  ],
                                ),
                              ),
                            ],
                          ),

                          if (att.isManualCheckout && att.manualCheckoutReason.isNotEmpty) ...[
                            const SizedBox(height: 8),
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                              decoration: BoxDecoration(
                                color: const Color(0xFFF1F5F9),
                                borderRadius: BorderRadius.circular(6),
                              ),
                              child: Text(
                                'Regularized: ${att.manualCheckoutReason}',
                                style: const TextStyle(fontSize: 11, color: AppTheme.textLight, fontStyle: FontStyle.italic),
                              ),
                            ),
                          ],

                          if (isMissingCheckout || att.checkOut == null) ...[
                            const Divider(height: 16, color: Color(0xFFF1F5F9)),
                            Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                const Text(
                                  'Calculated as Half-Day (4.0h)',
                                  style: TextStyle(fontSize: 11, color: Color(0xFFF59E0B), fontWeight: FontWeight.bold),
                                ),
                                ElevatedButton.icon(
                                  icon: const Icon(Icons.edit_calendar, size: 14, color: Colors.white),
                                  label: const Text('Manual Check-out', style: TextStyle(fontSize: 11, color: Colors.white)),
                                  style: ElevatedButton.styleFrom(
                                    backgroundColor: AppTheme.primary,
                                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                                    minimumSize: Size.zero,
                                  ),
                                  onPressed: () => _openManualCheckoutModal(att),
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
          ],
        ),
      ),
    );
  }

  // 2. Leaves Tab
  Widget _buildLeavesTab(UserModel emp) {
    final balances = (emp.leaveBalance is Map && emp.leaveBalance!.isNotEmpty)
        ? emp.leaveBalance!
        : (_summaryData != null && _summaryData!['leaveBalance'] is Map)
            ? _summaryData!['leaveBalance'] as Map<String, dynamic>
            : const {'casual': 12, 'sick': 6, 'earned': 15};

    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text('Leave Quota & Balances', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 15)),
          const SizedBox(height: 10),
          Row(
            children: [
              _buildLeaveQuotaCard('Casual', balances['casual'] ?? 12, AppTheme.primary),
              const SizedBox(width: 8),
              _buildLeaveQuotaCard('Sick', balances['sick'] ?? 6, const Color(0xFF0D9488)),
              const SizedBox(width: 8),
              _buildLeaveQuotaCard('Earned', balances['earned'] ?? 15, const Color(0xFF6366F1)),
            ],
          ),
          const SizedBox(height: 20),

          const Text('Applied Leave Records', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 15)),
          const SizedBox(height: 10),
          if (_employeeLeaves.isEmpty)
            const EmptyState(title: 'No Leaves Applied', message: 'No leave applications found for this employee.')
          else
            ListView.builder(
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              itemCount: _employeeLeaves.length,
              itemBuilder: (context, index) {
                final leave = _employeeLeaves[index];
                final start = DateFormat('dd MMM yyyy').format(leave.startDate);
                final end = DateFormat('dd MMM yyyy').format(leave.endDate);

                Color statusColor = AppTheme.primary;
                if (leave.status == 'approved') statusColor = AppTheme.success;
                if (leave.status == 'rejected') statusColor = AppTheme.error;

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
                            Text(
                              '${leave.leaveType.toUpperCase()} (${leave.daysCount} days)',
                              style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14),
                            ),
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                              decoration: BoxDecoration(
                                color: statusColor.withOpacity(0.12),
                                borderRadius: BorderRadius.circular(12),
                              ),
                              child: Text(
                                leave.status.toUpperCase(),
                                style: TextStyle(color: statusColor, fontWeight: FontWeight.bold, fontSize: 10),
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 4),
                        Text('Period: $start to $end', style: const TextStyle(fontSize: 12, color: AppTheme.textLight)),
                        const SizedBox(height: 4),
                        Text('Reason: ${leave.reason}', style: const TextStyle(fontSize: 13, color: AppTheme.textDark)),
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

  // 3. On Duty Tab
  Widget _buildOnDutyTab() {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text('On Duty (OD) Applications', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 15)),
          const SizedBox(height: 10),
          if (_employeeOnDuty.isEmpty)
            const EmptyState(title: 'No On Duty Records', message: 'No on-duty records submitted by this employee.')
          else
            ListView.builder(
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              itemCount: _employeeOnDuty.length,
              itemBuilder: (context, index) {
                final od = _employeeOnDuty[index];
                final dateStr = DateFormat('EEE, dd MMM yyyy').format(od.date);
                final isApproved = od.status == 'approved';

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
                            Text(dateStr, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                              decoration: BoxDecoration(
                                color: (isApproved ? AppTheme.success : const Color(0xFFF59E0B)).withOpacity(0.12),
                                borderRadius: BorderRadius.circular(12),
                              ),
                              child: Text(
                                od.status.toUpperCase(),
                                style: TextStyle(
                                  color: isApproved ? AppTheme.success : const Color(0xFFF59E0B),
                                  fontWeight: FontWeight.bold,
                                  fontSize: 10,
                                ),
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 6),
                        Text('Reason: ${od.reason}', style: const TextStyle(fontSize: 13, color: AppTheme.textDark)),
                        if (isApproved) ...[
                          const SizedBox(height: 6),
                          const Row(
                            children: [
                              Icon(Icons.check_circle, size: 14, color: AppTheme.success),
                              SizedBox(width: 4),
                              Text('Counted as Present in Attendance (8.0h)', style: TextStyle(fontSize: 11, color: AppTheme.success, fontWeight: FontWeight.bold)),
                            ],
                          ),
                        ],
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

  // 4. Profile & Info Tab
  Widget _buildProfileInfoTab(UserModel emp) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text('Personal & Contact Info', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 15)),
          const SizedBox(height: 10),
          AppCard(
            child: Column(
              children: [
                _buildInfoRow('Username', emp.username),
                _buildInfoRow('Email', emp.email ?? 'Not provided'),
                _buildInfoRow('Contact Phone', emp.contact ?? 'Not provided'),
                _buildInfoRow('Date of Joining', emp.dateOfJoining != null ? DateFormat('dd MMM yyyy').format(emp.dateOfJoining!) : 'N/A'),
              ],
            ),
          ),
          const SizedBox(height: 20),

          const Text('Banking Details', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 15)),
          const SizedBox(height: 10),
          AppCard(
            child: Column(
              children: [
                _buildInfoRow('Bank Name', emp.bankName.isEmpty ? 'N/A' : emp.bankName),
                _buildInfoRow('Account Number', emp.bankAccountNo.isEmpty ? 'N/A' : (emp.bankAccountNo.length >= 4 ? '•••• ${emp.bankAccountNo.substring(emp.bankAccountNo.length - 4)}' : emp.bankAccountNo)),
                _buildInfoRow('IFSC Code', emp.ifscCode.isEmpty ? 'N/A' : emp.ifscCode),
              ],
            ),
          ),
          const SizedBox(height: 20),

          const Text('Permissions', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 15)),
          const SizedBox(height: 10),
          AppCard(
            child: Column(
              children: [
                _buildPermissionRow('Manage Internships', emp.canManageInternships),
                _buildPermissionRow('Manage Enquiries', emp.canManageEnquiries),
                _buildPermissionRow('Manage Leads', emp.canManageLeads),
              ],
            ),
          ),
          const SizedBox(height: 32),

          Row(
            children: [
              Expanded(
                child: OutlinedButton.icon(
                  icon: const Icon(Icons.edit_outlined),
                  label: const Text('Edit Profile'),
                  onPressed: () => context.push('/admin/employees/edit/${widget.employeeId}'),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: ElevatedButton.icon(
                  style: ElevatedButton.styleFrom(backgroundColor: AppTheme.error),
                  icon: const Icon(Icons.delete_outline, color: Colors.white),
                  label: const Text('Delete', style: TextStyle(color: Colors.white)),
                  onPressed: () {
                    showDialog(
                      context: context,
                      builder: (ctx) => ConfirmationDialog(
                        title: 'Delete Employee',
                        content: 'Are you sure you want to delete ${emp.name}? This action cannot be undone.',
                        confirmText: 'Delete',
                        confirmColor: AppTheme.error,
                        onConfirm: () {
                          context.read<EmployeesCubit>().removeEmployee(widget.employeeId).then((_) {
                            context.pop();
                          });
                        },
                      ),
                    );
                  },
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildMetricItem(String title, String value, Color color, IconData icon) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: color.withOpacity(0.08),
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: color.withOpacity(0.25)),
        ),
        child: Row(
          children: [
            Icon(icon, color: color, size: 20),
            const SizedBox(width: 8),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(value, style: TextStyle(fontWeight: FontWeight.bold, fontSize: 15, color: color)),
                  Text(title, style: const TextStyle(fontSize: 11, color: AppTheme.textDark)),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildLeaveQuotaCard(String title, dynamic count, Color color) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 12),
        decoration: BoxDecoration(
          color: color.withOpacity(0.08),
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: color.withOpacity(0.3)),
        ),
        child: Column(
          children: [
            Text('$count', style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold, color: color)),
            const SizedBox(height: 2),
            Text(title, style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w600, color: AppTheme.textDark)),
          ],
        ),
      ),
    );
  }

  Widget _buildInfoRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 6),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label, style: const TextStyle(color: AppTheme.textLight, fontSize: 13)),
          Text(value, style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 13)),
        ],
      ),
    );
  }

  Widget _buildPermissionRow(String label, bool isGranted) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 6),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label, style: const TextStyle(color: AppTheme.textLight, fontSize: 13)),
          Icon(isGranted ? Icons.check_circle : Icons.cancel, color: isGranted ? AppTheme.success : AppTheme.error, size: 18),
        ],
      ),
    );
  }
}

class _ManualCheckoutBottomSheet extends StatefulWidget {
  final AttendanceModel attendance;
  final String userId;
  final VoidCallback onSuccess;

  const _ManualCheckoutBottomSheet({
    required this.attendance,
    required this.userId,
    required this.onSuccess,
  });

  @override
  State<_ManualCheckoutBottomSheet> createState() => _ManualCheckoutBottomSheetState();
}

class _ManualCheckoutBottomSheetState extends State<_ManualCheckoutBottomSheet> {
  final _reasonController = TextEditingController(text: 'Admin manual regularized checkout');
  double _workHours = 8.0;
  String _status = 'present';

  @override
  void dispose() {
    _reasonController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final dateStr = DateFormat('dd MMM yyyy').format(widget.attendance.date);

    return Container(
      padding: const EdgeInsets.all(24),
      decoration: const BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text('Manual Check-out ($dateStr)', style: const TextStyle(fontSize: 17, fontWeight: FontWeight.bold)),
              IconButton(icon: const Icon(Icons.close), onPressed: () => Navigator.pop(context)),
            ],
          ),
          const SizedBox(height: 16),
          const Text('Select Working Status', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
          const SizedBox(height: 8),
          Row(
            children: [
              Expanded(
                child: ChoiceChip(
                  label: const Text('Full Day (8.0h)'),
                  selected: _status == 'present',
                  selectedColor: AppTheme.primary,
                  labelStyle: TextStyle(color: _status == 'present' ? Colors.white : AppTheme.textDark, fontWeight: FontWeight.bold),
                  onSelected: (selected) {
                    if (selected) {
                      setState(() {
                        _status = 'present';
                        _workHours = 8.0;
                      });
                    }
                  },
                ),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: ChoiceChip(
                  label: const Text('Half-Day (4.0h)'),
                  selected: _status == 'half-day',
                  selectedColor: const Color(0xFFF59E0B),
                  labelStyle: TextStyle(color: _status == 'half-day' ? Colors.white : AppTheme.textDark, fontWeight: FontWeight.bold),
                  onSelected: (selected) {
                    if (selected) {
                      setState(() {
                        _status = 'half-day';
                        _workHours = 4.0;
                      });
                    }
                  },
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          AppTextField(
            label: 'Working Hours to Credit',
            hint: 'e.g., 8.0',
            controller: TextEditingController(text: _workHours.toString()),
            keyboardType: const TextInputType.numberWithOptions(decimal: true),
            onChanged: (val) {
              _workHours = double.tryParse(val) ?? 8.0;
            },
          ),
          const SizedBox(height: 16),
          AppTextField(
            label: 'Regularization Reason / Note',
            hint: 'e.g., Verified with employee, missed checkout.',
            controller: _reasonController,
          ),
          const SizedBox(height: 24),
          PrimaryButton(
            text: 'Save & Regularize Punch',
            onPressed: () async {
              await context.read<AttendanceCubit>().adminManualCheckout(
                    attendanceId: widget.attendance.id,
                    workHours: _workHours,
                    status: _status,
                    reason: _reasonController.text.trim(),
                  );
              widget.onSuccess();
              if (context.mounted) Navigator.pop(context);
            },
          ),
        ],
      ),
    );
  }
}

class _RegularizeNewDateBottomSheet extends StatefulWidget {
  final String userId;
  final VoidCallback onSuccess;

  const _RegularizeNewDateBottomSheet({required this.userId, required this.onSuccess});

  @override
  State<_RegularizeNewDateBottomSheet> createState() => _RegularizeNewDateBottomSheetState();
}

class _RegularizeNewDateBottomSheetState extends State<_RegularizeNewDateBottomSheet> {
  DateTime _date = DateTime.now();
  String _status = 'present';
  double _workHours = 8.0;
  final _reasonController = TextEditingController(text: 'Admin manual attendance entry');

  @override
  void dispose() {
    _reasonController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(24),
      decoration: const BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text('Add Attendance Punch', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
              IconButton(icon: const Icon(Icons.close), onPressed: () => Navigator.pop(context)),
            ],
          ),
          const SizedBox(height: 16),
          DatePickerField(
            label: 'Attendance Date',
            selectedDate: _date,
            onDateSelected: (date) => setState(() => _date = date),
          ),
          const SizedBox(height: 16),
          const Text('Status', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
          const SizedBox(height: 8),
          Row(
            children: [
              Expanded(
                child: ChoiceChip(
                  label: const Text('Present (8.0h)'),
                  selected: _status == 'present',
                  selectedColor: AppTheme.primary,
                  labelStyle: TextStyle(color: _status == 'present' ? Colors.white : AppTheme.textDark, fontWeight: FontWeight.bold),
                  onSelected: (selected) {
                    if (selected) setState(() { _status = 'present'; _workHours = 8.0; });
                  },
                ),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: ChoiceChip(
                  label: const Text('Half-Day (4.0h)'),
                  selected: _status == 'half-day',
                  selectedColor: const Color(0xFFF59E0B),
                  labelStyle: TextStyle(color: _status == 'half-day' ? Colors.white : AppTheme.textDark, fontWeight: FontWeight.bold),
                  onSelected: (selected) {
                    if (selected) setState(() { _status = 'half-day'; _workHours = 4.0; });
                  },
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          AppTextField(
            label: 'Reason',
            hint: 'e.g., Attendance corrected by Admin',
            controller: _reasonController,
          ),
          const SizedBox(height: 24),
          PrimaryButton(
            text: 'Save Punch Entry',
            onPressed: () async {
              await context.read<AttendanceCubit>().adminRegularize(
                    userId: widget.userId,
                    date: _date,
                    workHours: _workHours,
                    status: _status,
                    reason: _reasonController.text.trim(),
                  );
              widget.onSuccess();
              if (context.mounted) Navigator.pop(context);
            },
          ),
        ],
      ),
    );
  }
}
