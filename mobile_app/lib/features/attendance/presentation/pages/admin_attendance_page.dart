import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:intl/intl.dart';
import '../../../../core/theme/app_theme.dart';
import '../../../../shared/widgets/avatar.dart';
import '../../../../shared/widgets/cards.dart';
import '../../../../shared/widgets/chips.dart';
import '../../../../shared/widgets/feedback.dart';
import '../../../../shared/widgets/layout.dart';
import '../../bloc/attendance_cubit.dart';

class AdminAttendancePage extends StatefulWidget {
  const AdminAttendancePage({super.key});

  @override
  State<AdminAttendancePage> createState() => _AdminAttendancePageState();
}

class _AdminAttendancePageState extends State<AdminAttendancePage> {
  DateTime _selectedDate = DateTime.now();

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  void _loadData() {
    final formattedDate = DateFormat('yyyy-MM-dd').format(_selectedDate);
    context.read<AttendanceCubit>().loadTeamAttendance(date: formattedDate);
  }

  @override
  Widget build(BuildContext context) {
    return AppScaffold(
      title: 'Team Attendance',
      showAppBar: true,
      body: Column(
        children: [
          // Date Selector Header
          Padding(
            padding: const EdgeInsets.all(16),
            child: AppCard(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    'Viewing: ${DateFormat('dd MMMM yyyy').format(_selectedDate)}',
                    style: const TextStyle(fontWeight: FontWeight.bold),
                  ),
                  IconButton(
                    icon: const Icon(Icons.date_range_outlined, color: AppTheme.secondary),
                    onPressed: () async {
                      final picked = await showDatePicker(
                        context: context,
                        initialDate: _selectedDate,
                        firstDate: DateTime(2020),
                        lastDate: DateTime(2030),
                      );
                      if (picked != null) {
                        setState(() {
                          _selectedDate = picked;
                        });
                        _loadData();
                      }
                    },
                  ),
                ],
              ),
            ),
          ),

          // Log List
          Expanded(
            child: BlocBuilder<AttendanceCubit, AttendanceState>(
              builder: (context, state) {
                if (state is AttendanceLoading) {
                  return const LoadingState();
                }
                if (state is AttendanceFailure) {
                  return ErrorState(
                    message: state.message,
                    onRetry: _loadData,
                  );
                }
                if (state is AttendanceLoaded) {
                  // Standard mock list logic or team lookup where supported by API
                  // Filter by chosen date if backend matches
                  final list = state.history;

                  if (list.isEmpty) {
                    return const EmptyState(
                      title: 'No Logs Logged',
                      message: 'No employees have punched attendance for this date yet.',
                    );
                  }

                  return RefreshIndicator(
                    onRefresh: () async => _loadData(),
                    child: ListView.builder(
                      padding: const EdgeInsets.symmetric(horizontal: 16),
                      itemCount: list.length,
                      itemBuilder: (context, index) {
                        final log = list[index];
                        final employeeName = log.user?.name ?? 'Employee ${index + 1}';
                        final jobRole = log.user?.jobRole ?? 'Staff';

                        return Container(
                          margin: const EdgeInsets.symmetric(vertical: 4),
                          child: AppCard(
                            child: Row(
                              children: [
                                Avatar(
                                  url: log.user?.profilePicture,
                                  name: employeeName,
                                  size: 44,
                                ),
                                const SizedBox(width: 12),
                                Expanded(
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      Text(
                                        employeeName,
                                        style: const TextStyle(fontWeight: FontWeight.bold),
                                      ),
                                      Text(
                                        jobRole,
                                        style: const TextStyle(color: AppTheme.textLight, fontSize: 12),
                                      ),
                                      const SizedBox(height: 2),
                                      Text(
                                        log.checkIn != null
                                            ? 'In: ${DateFormat('hh:mm a').format(log.checkIn!)}' +
                                                (log.checkOut != null
                                                    ? '  Out: ${DateFormat('hh:mm a').format(log.checkOut!)}'
                                                    : '  - Active')
                                            : 'Absent',
                                        style: const TextStyle(color: AppTheme.textLight, fontSize: 11),
                                      ),
                                    ],
                                  ),
                                ),
                                StatusChip(label: log.displayStatus, status: log.displayStatus),
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
          ),
        ],
      ),
    );
  }
}
