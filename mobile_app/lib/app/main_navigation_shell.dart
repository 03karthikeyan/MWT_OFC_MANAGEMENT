import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import '../../core/theme/app_theme.dart';
import '../features/auth/bloc/auth_bloc.dart';
import '../features/auth/bloc/auth_state.dart';

import '../features/dashboard/presentation/pages/employee_dashboard_page.dart';
import '../features/dashboard/presentation/pages/admin_dashboard_page.dart';
import '../features/attendance/presentation/pages/attendance_page.dart';
import '../features/attendance/presentation/pages/admin_attendance_page.dart';
import '../features/work_updates/presentation/pages/work_updates_page.dart';
import '../features/work_updates/presentation/pages/admin_work_journal_page.dart';
import '../features/leave/presentation/pages/leave_list_page.dart';
import '../features/employee_management/presentation/pages/admin_employees_page.dart';
import '../features/dashboard/presentation/pages/employee_more_page.dart';
import '../features/dashboard/presentation/pages/admin_more_page.dart';

/// InheritedWidget that lets child pages switch the bottom nav tab
/// without triggering GoRouter navigation (which causes Hero conflicts).
class NavigationShellScope extends InheritedWidget {
  final void Function(int index) switchTab;

  const NavigationShellScope({
    super.key,
    required this.switchTab,
    required super.child,
  });

  static NavigationShellScope? of(BuildContext context) {
    return context.dependOnInheritedWidgetOfExactType<NavigationShellScope>();
  }

  @override
  bool updateShouldNotify(NavigationShellScope oldWidget) => false;
}

class MainNavigationShell extends StatefulWidget {
  final bool isAdmin;
  const MainNavigationShell({super.key, required this.isAdmin});

  @override
  State<MainNavigationShell> createState() => _MainNavigationShellState();
}

class _MainNavigationShellState extends State<MainNavigationShell> {
  int _currentIndex = 0;

  @override
  Widget build(BuildContext context) {
    return BlocBuilder<AuthBloc, AuthState>(
      builder: (context, state) {
        if (state is! Authenticated) {
          return const Scaffold(body: Center(child: CircularProgressIndicator()));
        }

        final List<Widget> pages = widget.isAdmin
            ? [
                const AdminDashboardPage(),
                const AdminEmployeesPage(),
                const AdminAttendancePage(),
                const AdminWorkJournalPage(),
                const AdminMorePage(),
              ]
            : [
                const EmployeeDashboardPage(),
                const AttendancePage(),
                const WorkUpdatesPage(),
                const LeaveListPage(),
                const EmployeeMorePage(),
              ];

        final List<BottomNavigationBarItem> navItems = widget.isAdmin
            ? const [
                BottomNavigationBarItem(
                  icon: Icon(Icons.dashboard_outlined),
                  activeIcon: Icon(Icons.dashboard),
                  label: 'Home',
                ),
                BottomNavigationBarItem(
                  icon: Icon(Icons.people_alt_outlined),
                  activeIcon: Icon(Icons.people_alt),
                  label: 'Employees',
                ),
                BottomNavigationBarItem(
                  icon: Icon(Icons.calendar_today_outlined),
                  activeIcon: Icon(Icons.calendar_today),
                  label: 'Attendance',
                ),
                BottomNavigationBarItem(
                  icon: Icon(Icons.assignment_outlined),
                  activeIcon: Icon(Icons.assignment),
                  label: 'Work',
                ),
                BottomNavigationBarItem(
                  icon: Icon(Icons.menu_outlined),
                  activeIcon: Icon(Icons.menu),
                  label: 'More',
                ),
              ]
            : const [
                BottomNavigationBarItem(
                  icon: Icon(Icons.home_outlined),
                  activeIcon: Icon(Icons.home),
                  label: 'Home',
                ),
                BottomNavigationBarItem(
                  icon: Icon(Icons.calendar_month_outlined),
                  activeIcon: Icon(Icons.calendar_month),
                  label: 'Attendance',
                ),
                BottomNavigationBarItem(
                  icon: Icon(Icons.task_alt_outlined),
                  activeIcon: Icon(Icons.task_alt),
                  label: 'Work',
                ),
                BottomNavigationBarItem(
                  icon: Icon(Icons.time_to_leave_outlined),
                  activeIcon: Icon(Icons.time_to_leave),
                  label: 'Leave',
                ),
                BottomNavigationBarItem(
                  icon: Icon(Icons.menu_outlined),
                  activeIcon: Icon(Icons.menu),
                  label: 'More',
                ),
              ];

        return NavigationShellScope(
          switchTab: (index) {
            setState(() {
              _currentIndex = index;
            });
          },
          child: Scaffold(
            body: IndexedStack(
              index: _currentIndex,
              children: pages,
            ),
            bottomNavigationBar: Container(
              decoration: const BoxDecoration(
                border: Border(
                  top: BorderSide(color: Color(0xFFE2E8F0), width: 1),
                ),
              ),
              child: BottomNavigationBar(
                currentIndex: _currentIndex,
                onTap: (index) {
                  setState(() {
                    _currentIndex = index;
                  });
                },
                items: navItems,
                type: BottomNavigationBarType.fixed,
                backgroundColor: Colors.white,
                selectedItemColor: AppTheme.primary,
                unselectedItemColor: AppTheme.textLight,
                selectedLabelStyle: const TextStyle(fontWeight: FontWeight.w600, fontSize: 12),
                unselectedLabelStyle: const TextStyle(fontWeight: FontWeight.w400, fontSize: 12),
                elevation: 0,
              ),
            ),
          ),
        );
      },
    );
  }
}
