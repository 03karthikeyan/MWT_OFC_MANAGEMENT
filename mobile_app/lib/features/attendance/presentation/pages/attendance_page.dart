import 'dart:io';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:intl/intl.dart';
import 'package:open_filex/open_filex.dart';
import '../../../../core/theme/app_theme.dart';
import '../../../../shared/widgets/buttons.dart';
import '../../../../shared/widgets/cards.dart';
import '../../../../shared/widgets/chips.dart';
import '../../../../shared/widgets/feedback.dart';
import '../../../../shared/widgets/layout.dart';
import '../../../../shared/widgets/bottom_sheets.dart';
import '../../bloc/attendance_cubit.dart';
import '../../data/models/attendance_model.dart';

class AttendancePage extends StatefulWidget {
  const AttendancePage({super.key});

  @override
  State<AttendancePage> createState() => _AttendancePageState();
}

class _AttendancePageState extends State<AttendancePage> {
  late int _selectedMonth;
  late int _selectedYear;
  bool _isLocalLoading = false;

  @override
  void initState() {
    super.initState();
    final now = DateTime.now();
    _selectedMonth = now.month;
    _selectedYear = now.year;
    _loadData(showLoading: true);
  }

  void _loadData({bool showLoading = true}) {
    if (!showLoading) {
      setState(() {
        _isLocalLoading = true;
      });
    }
    context.read<AttendanceCubit>().loadAttendance(
      month: (_selectedMonth - 1).toString(),
      year: _selectedYear.toString(),
      showLoading: showLoading,
    ).then((_) {
      if (mounted) {
        setState(() {
          _isLocalLoading = false;
        });
      }
    }).catchError((_) {
      if (mounted) {
        setState(() {
          _isLocalLoading = false;
        });
      }
    });
  }

  void _previousMonth() {
    setState(() {
      _selectedMonth--;
      if (_selectedMonth < 1) {
        _selectedMonth = 12;
        _selectedYear--;
      }
    });
    _loadData(showLoading: false);
  }

  void _nextMonth() {
    setState(() {
      _selectedMonth++;
      if (_selectedMonth > 12) {
        _selectedMonth = 1;
        _selectedYear++;
      }
    });
    _loadData(showLoading: false);
  }

  String _getMonthName(int month) {
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    return months[month - 1];
  }

  String _formatDuration(DateTime? checkIn, DateTime? checkOut) {
    if (checkIn == null) return '00:00';
    final end = checkOut ?? DateTime.now();
    final diff = end.difference(checkIn);
    final hours = diff.inHours.toString().padLeft(2, '0');
    final minutes = (diff.inMinutes % 60).toString().padLeft(2, '0');
    return '$hours:$minutes';
  }

  bool _isDayLeave(DateTime day, List<dynamic>? leaves) {
    if (leaves == null) return false;
    for (final leave in leaves) {
      if (leave is Map<String, dynamic>) {
        final startStr = leave['startDate'] ?? leave['date'];
        final endStr = leave['endDate'] ?? leave['date'];
        if (startStr != null) {
          final start = DateTime.tryParse(startStr.toString());
          final end = DateTime.tryParse((endStr ?? startStr).toString());
          if (start != null && end != null) {
            final d = DateTime(day.year, day.month, day.day);
            final s = DateTime(start.year, start.month, start.day);
            final e = DateTime(end.year, end.month, end.day);
            if ((d.isAtSameMomentAs(s) || d.isAtSameMomentAs(e)) ||
                (d.isAfter(s) && d.isBefore(e))) {
              return true;
            }
          }
        }
      }
    }
    return false;
  }

  String? _getHolidayReason(DateTime day, List<dynamic>? holidays) {
    if (holidays == null) return null;
    for (final holiday in holidays) {
      if (holiday is Map<String, dynamic> && holiday['date'] != null) {
        final date = DateTime.tryParse(holiday['date'].toString());
        if (date != null) {
          if (date.year == day.year && date.month == day.month && date.day == day.day) {
            return holiday['reason']?.toString() ?? 'Holiday';
          }
        }
      }
    }
    return null;
  }

  AttendanceModel? _getAttendanceForDay(DateTime day, List<AttendanceModel> logs) {
    for (final log in logs) {
      if (log.date.year == day.year && log.date.month == day.month && log.date.day == day.day) {
        return log;
      }
    }
    return null;
  }

  Future<void> _exportToCSV(List<AttendanceModel> logs) async {
    try {
      final headers = ['Date', 'Check In', 'Check Out', 'Status', 'Duration'];
      final rows = logs.map((log) {
        final dateStr = DateFormat('yyyy-MM-dd').format(log.date);
        final checkInStr = log.checkIn != null 
            ? DateFormat('hh:mm a').format(log.checkIn!) 
            : '--:--';
        final checkOutStr = log.checkOut != null 
            ? DateFormat('hh:mm a').format(log.checkOut!) 
            : (log.date.year == DateTime.now().year &&
               log.date.month == DateTime.now().month &&
               log.date.day == DateTime.now().day
               ? 'In-Progress'
               : 'Missed');
        final statusStr = log.displayStatus;
        final durationStr = '${_formatDuration(log.checkIn, log.checkOut)} hrs';

        return [
          dateStr,
          checkInStr,
          checkOutStr,
          statusStr,
          durationStr,
        ].map((field) => '"$field"').join(',');
      }).toList();

      final csvContent = [headers.join(','), ...rows].join('\n');

      final monthName = _getMonthName(_selectedMonth);
      final filename = 'time_logs_${monthName}_$_selectedYear.csv';
      final file = File('${Directory.systemTemp.path}/$filename');
      await file.writeAsString(csvContent);

      if (!mounted) return;

      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('CSV exported successfully!!'),
          backgroundColor: Colors.green,
          duration: const Duration(seconds: 5),
          action: SnackBarAction(
            label: 'Open',
            textColor: Colors.white,
            onPressed: () {
              OpenFilex.open(file.path);
            },
          ),
        ),
      );
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Failed to export CSV: $e')),
      );
    }
  }

  bool _isToday(DateTime date) {
    final now = DateTime.now();
    return date.year == now.year && date.month == now.month && date.day == now.day;
  }

  @override
  Widget build(BuildContext context) {
    return AppScaffold(
      title: 'My Attendance',
      showAppBar: true,
      body: BlocBuilder<AttendanceCubit, AttendanceState>(
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
            final today = state.today;
            final isCheckedIn = today != null && today.checkIn != null;
            final isCheckedOut = today != null && today.checkOut != null;

            final summaryAttendance = (state.summary['attendance'] as List?)
                    ?.map((e) => AttendanceModel.fromJson(e as Map<String, dynamic>))
                    .toList() ?? [];
            final summaryLeaves = state.summary['leaves'] as List? ?? [];
            final summaryHolidays = state.summary['holidays'] as List? ?? [];

            // Dynamic Stats:
            final totalDays = summaryAttendance.length;
            final completedShifts = summaryAttendance.where((a) => a.checkIn != null && a.checkOut != null).length;
            final activeNow = summaryAttendance.where((a) => a.checkIn != null && a.checkOut == null && _isToday(a.date)).length;
            final missedCheckouts = summaryAttendance.where((a) => a.checkIn != null && a.checkOut == null && !_isToday(a.date)).length;

            final firstDayOfMonth = DateTime(_selectedYear, _selectedMonth, 1);
            final firstDayOffset = firstDayOfMonth.weekday % 7; // Sunday = 0
            final daysInMonth = DateTime(_selectedYear, _selectedMonth + 1, 0).day;
            final totalCells = firstDayOffset + daysInMonth;

            final sortedLogs = List<AttendanceModel>.from(summaryAttendance);
            sortedLogs.sort((a, b) => b.date.compareTo(a.date));

            return RefreshIndicator(
              onRefresh: () async => _loadData(showLoading: false),
              child: SingleChildScrollView(
                physics: const AlwaysScrollableScrollPhysics(),
                padding: const EdgeInsets.all(20),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    if (_isLocalLoading) ...[
                      const LinearProgressIndicator(
                        backgroundColor: Colors.transparent,
                        valueColor: AlwaysStoppedAnimation<Color>(AppTheme.primary),
                      ),
                      const SizedBox(height: 12),
                    ],
                    // Timer / Clock card
                    AppCard(
                      child: Column(
                        children: [
                          Text(
                            DateFormat('EEEE, d MMMM yyyy').format(DateTime.now()),
                            style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                                  color: AppTheme.textLight,
                                  fontWeight: FontWeight.w500,
                                ),
                          ),
                          const SizedBox(height: 12),
                          StreamBuilder<DateTime>(
                            stream: Stream.periodic(const Duration(seconds: 1), (_) => DateTime.now()),
                            builder: (context, snapshot) {
                              final now = snapshot.data ?? DateTime.now();
                              return Text(
                                DateFormat('hh:mm:ss a').format(now),
                                style: Theme.of(context).textTheme.headlineMedium?.copyWith(
                                      fontWeight: FontWeight.bold,
                                      color: AppTheme.textDark,
                                      fontSize: 32,
                                    ),
                              );
                            },
                          ),
                          const SizedBox(height: 8),
                          if (isCheckedIn) ...[
                            Text(
                              'Working Duration: ${_formatDuration(today.checkIn, today.checkOut)} hrs',
                              style: const TextStyle(
                                color: AppTheme.primary,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                          ],
                          const SizedBox(height: 24),
                          if (!isCheckedIn)
                            PrimaryButton(
                              text: 'Check In',
                              icon: Icons.login_outlined,
                              onPressed: () {
                                context.read<AttendanceCubit>().performCheckIn().then((_) {
                                  SuccessBottomSheet.show(
                                    context,
                                    title: 'Check-In Successful',
                                    message: 'You have successfully checked in for work today.',
                                    onTap: () {},
                                  );
                                });
                              },
                            )
                          else if (!isCheckedOut)
                            PrimaryButton(
                              text: 'Check Out',
                              icon: Icons.logout_outlined,
                              onPressed: () {
                                context.read<AttendanceCubit>().performCheckOut().then((_) {
                                  SuccessBottomSheet.show(
                                    context,
                                    title: 'Check-Out Successful',
                                    message: 'You have successfully checked out. Have a great evening!',
                                    onTap: () {},
                                  );
                                });
                              },
                            )
                          else
                            const Column(
                              children: [
                                Icon(Icons.check_circle, color: AppTheme.success, size: 48),
                                SizedBox(height: 8),
                                Text(
                                  'Work Complete for Today',
                                  style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
                                )
                              ],
                            ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 28),

                    // Title & Actions Row (CSV & Month navigation)
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                'TIME LOGS & LEAVE CALENDAR',
                                style: Theme.of(context).textTheme.titleSmall?.copyWith(
                                      fontWeight: FontWeight.bold,
                                      fontSize: 13,
                                      letterSpacing: 0.5,
                                    ),
                              ),
                              const Text(
                                'Sync your work & life balance',
                                style: TextStyle(
                                  color: AppTheme.textLight,
                                  fontSize: 10,
                                  fontStyle: FontStyle.italic,
                                ),
                              ),
                            ],
                          ),
                        ),
                        Row(
                          children: [
                            IconButton(
                              icon: const Icon(Icons.download, color: AppTheme.primary, size: 20),
                              tooltip: 'Export CSV',
                              onPressed: () => _exportToCSV(summaryAttendance),
                            ),
                          ],
                        ),
                      ],
                    ),
                    const SizedBox(height: 12),

                    // Month Navigation Control Card
                    AppCard(
                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          IconButton(
                            icon: const Icon(Icons.chevron_left, color: AppTheme.textLight),
                            onPressed: _previousMonth,
                          ),
                          Text(
                            '${_getMonthName(_selectedMonth).toUpperCase()} $_selectedYear',
                            style: const TextStyle(
                              fontWeight: FontWeight.bold,
                              fontSize: 15,
                              color: AppTheme.primary,
                              letterSpacing: 0.8,
                            ),
                          ),
                          IconButton(
                            icon: const Icon(Icons.chevron_right, color: AppTheme.textLight),
                            onPressed: _nextMonth,
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 20),

                    // 2x2 Stats Grid
                    Row(
                      children: [
                        Expanded(
                          child: StatCard(
                            title: 'TOTAL DAYS',
                            value: '$totalDays',
                            icon: Icons.calendar_month_outlined,
                            color: AppTheme.primary,
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: StatCard(
                            title: 'COMPLETED SHIFT',
                            value: '$completedShifts',
                            icon: Icons.check_circle_outline,
                            color: AppTheme.success,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 12),
                    Row(
                      children: [
                        Expanded(
                          child: StatCard(
                            title: 'ACTIVE NOW',
                            value: '$activeNow',
                            icon: Icons.bolt,
                            color: AppTheme.warning,
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: StatCard(
                            title: 'MISSED CHECKOUT',
                            value: '$missedCheckouts',
                            icon: Icons.error_outline,
                            color: AppTheme.error,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 28),

                    // Attendance Calendar Card
                    AppCard(
                      padding: const EdgeInsets.all(12),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            children: [
                              const Icon(Icons.calendar_month, color: AppTheme.primary, size: 18),
                              const SizedBox(width: 8),
                              Text(
                                'ATTENDANCE CALENDAR',
                                style: Theme.of(context).textTheme.titleSmall?.copyWith(
                                      fontWeight: FontWeight.bold,
                                      letterSpacing: 0.5,
                                    ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 16),
                          // Weekdays Row
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceAround,
                            children: ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'].map((day) => Expanded(
                              child: Center(
                                child: Text(
                                  day,
                                  style: const TextStyle(
                                    fontWeight: FontWeight.bold,
                                    color: AppTheme.textLight,
                                    fontSize: 10,
                                  ),
                                ),
                              ),
                            )).toList(),
                          ),
                          const SizedBox(height: 8),
                          // Calendar Grid View
                          GridView.builder(
                            shrinkWrap: true,
                            physics: const NeverScrollableScrollPhysics(),
                            gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                              crossAxisCount: 7,
                              crossAxisSpacing: 6,
                              mainAxisSpacing: 6,
                              childAspectRatio: 0.78,
                            ),
                            itemCount: totalCells,
                            itemBuilder: (context, index) {
                              if (index < firstDayOffset) {
                                return const SizedBox.shrink();
                              }
                              final dayNumber = index - firstDayOffset + 1;
                              final dayDate = DateTime(_selectedYear, _selectedMonth, dayNumber);
                              final isWeekend = dayDate.weekday == DateTime.saturday || dayDate.weekday == DateTime.sunday;
                              
                              final att = _getAttendanceForDay(dayDate, summaryAttendance);
                              final isLeave = _isDayLeave(dayDate, summaryLeaves);
                              final holidayReason = _getHolidayReason(dayDate, summaryHolidays);

                              Color bgColor = Colors.white;
                              Color borderColor = AppTheme.textLight.withOpacity(0.15);
                              List<Widget> cellContent = [];

                              if (att != null) {
                                if (att.checkOut != null) {
                                  bgColor = AppTheme.success.withOpacity(0.08);
                                  borderColor = AppTheme.success.withOpacity(0.3);
                                  cellContent = [
                                    FittedBox(
                                      fit: BoxFit.scaleDown,
                                      child: Text(
                                        att.checkIn != null ? DateFormat('hh:mm a').format(att.checkIn!) : '',
                                        style: const TextStyle(fontSize: 8, fontWeight: FontWeight.bold, color: AppTheme.textDark),
                                      ),
                                    ),
                                    FittedBox(
                                      fit: BoxFit.scaleDown,
                                      child: Text(
                                        att.checkOut != null ? DateFormat('hh:mm a').format(att.checkOut!) : '',
                                        style: const TextStyle(fontSize: 8, fontWeight: FontWeight.bold, color: AppTheme.success),
                                      ),
                                    ),
                                  ];
                                } else {
                                  final active = _isToday(dayDate);
                                  bgColor = active ? AppTheme.warning.withOpacity(0.08) : AppTheme.error.withOpacity(0.08);
                                  borderColor = active ? AppTheme.warning.withOpacity(0.3) : AppTheme.error.withOpacity(0.3);
                                  cellContent = [
                                    FittedBox(
                                      fit: BoxFit.scaleDown,
                                      child: Text(
                                        att.checkIn != null ? DateFormat('hh:mm a').format(att.checkIn!) : '',
                                        style: const TextStyle(fontSize: 8, fontWeight: FontWeight.bold, color: AppTheme.textDark),
                                      ),
                                    ),
                                    FittedBox(
                                      fit: BoxFit.scaleDown,
                                      child: Text(
                                        active ? 'Active' : 'Missed',
                                        style: TextStyle(
                                          fontSize: 8,
                                          fontWeight: FontWeight.bold,
                                          color: active ? AppTheme.warning : AppTheme.error,
                                        ),
                                      ),
                                    ),
                                  ];
                                }
                              } else if (isLeave) {
                                bgColor = AppTheme.error.withOpacity(0.08);
                                borderColor = AppTheme.error.withOpacity(0.3);
                                cellContent = [
                                  const FittedBox(
                                    fit: BoxFit.scaleDown,
                                    child: Text(
                                      'LEAVE',
                                      style: TextStyle(fontSize: 8, fontWeight: FontWeight.bold, color: AppTheme.error),
                                    ),
                                  ),
                                ];
                              } else if (holidayReason != null) {
                                bgColor = AppTheme.warning.withOpacity(0.08);
                                borderColor = AppTheme.warning.withOpacity(0.3);
                                cellContent = [
                                  FittedBox(
                                    fit: BoxFit.scaleDown,
                                    child: Text(
                                      holidayReason.toUpperCase(),
                                      style: const TextStyle(fontSize: 7, fontWeight: FontWeight.bold, color: AppTheme.warning),
                                    ),
                                  ),
                                ];
                              } else if (isWeekend) {
                                bgColor = AppTheme.textLight.withOpacity(0.06);
                                borderColor = AppTheme.textLight.withOpacity(0.2);
                                cellContent = [
                                  const FittedBox(
                                    fit: BoxFit.scaleDown,
                                    child: Text(
                                      'OFF',
                                      style: TextStyle(fontSize: 8, color: AppTheme.textLight, fontWeight: FontWeight.bold),
                                    ),
                                  ),
                                ];
                              } else {
                                cellContent = [
                                  const Text(
                                    '-',
                                    style: TextStyle(fontSize: 8, color: AppTheme.textLight),
                                  ),
                                ];
                              }

                              return Container(
                                decoration: BoxDecoration(
                                  color: bgColor,
                                  border: Border.all(color: borderColor, width: 0.8),
                                  borderRadius: BorderRadius.circular(6),
                                  boxShadow: [
                                    BoxShadow(
                                      color: Colors.black.withOpacity(0.02),
                                      blurRadius: 1,
                                      offset: const Offset(0, 1),
                                    ),
                                  ],
                                ),
                                padding: const EdgeInsets.all(4),
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                  children: [
                                    Text(
                                      '$dayNumber',
                                      style: TextStyle(
                                        fontWeight: FontWeight.bold,
                                        fontSize: 10,
                                        color: isWeekend ? AppTheme.textLight : AppTheme.textDark,
                                      ),
                                    ),
                                    const Spacer(),
                                    ...cellContent,
                                    const Spacer(),
                                  ],
                                ),
                              );
                            },
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 28),

                    // Log History
                    Text(
                      'Monthly Time Logs',
                      style: Theme.of(context).textTheme.titleMedium?.copyWith(
                            fontWeight: FontWeight.bold,
                          ),
                    ),
                    const SizedBox(height: 12),
                    if (sortedLogs.isEmpty)
                      const AppCard(
                        child: Center(
                          child: Text('No attendance logs for this month.'),
                        ),
                      )
                    else
                      ListView.builder(
                        shrinkWrap: true,
                        physics: const NeverScrollableScrollPhysics(),
                        itemCount: sortedLogs.length,
                        itemBuilder: (context, index) {
                          final log = sortedLogs[index];
                          return Container(
                            margin: const EdgeInsets.symmetric(vertical: 4),
                            child: AppCard(
                              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                              child: Row(
                                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                children: [
                                  Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      Text(
                                        DateFormat('EEEE, dd MMM').format(log.date),
                                        style: const TextStyle(fontWeight: FontWeight.bold),
                                      ),
                                      const SizedBox(height: 4),
                                      Text(
                                        log.checkIn != null
                                            ? 'In: ${DateFormat('hh:mm a').format(log.checkIn!)}' +
                                                (log.checkOut != null
                                                    ? '  Out: ${DateFormat('hh:mm a').format(log.checkOut!)}'
                                                    : '  - Active')
                                            : 'No punches',
                                        style: const TextStyle(color: AppTheme.textLight, fontSize: 12),
                                      ),
                                    ],
                                  ),
                                  StatusChip(label: log.displayStatus, status: log.displayStatus),
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
          return const EmptyState();
        },
      ),
    );
  }
}
