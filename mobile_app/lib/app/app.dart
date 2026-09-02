import 'dart:async';
import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:go_router/go_router.dart';
import '../core/theme/app_theme.dart';
import '../core/network/api_client.dart';
import '../core/network/api_constants.dart';
import '../core/network/socket_service.dart';
import '../core/services/firebase_messaging_service.dart';
import '../core/services/local_notification_service.dart';
import '../core/storage/secure_storage_service.dart';
import '../features/auth/bloc/auth_bloc.dart';
import '../features/auth/bloc/auth_event.dart';
import '../features/auth/bloc/auth_state.dart';
import '../features/auth/presentation/pages/login_page.dart';
import '../features/auth/presentation/pages/splash_page.dart';
import 'main_navigation_shell.dart';

// Import Feature Pages
import '../features/on_duty/presentation/pages/on_duty_page.dart';
import '../features/on_duty/presentation/pages/admin_on_duty_page.dart';
import '../features/payslips/presentation/pages/payslips_page.dart';
import '../features/payslips/presentation/pages/admin_payslip_management_page.dart';
import '../features/projects/presentation/pages/projects_page.dart';
import '../features/requests/presentation/pages/requests_page.dart';
import '../features/notifications/presentation/pages/notifications_page.dart';
import '../features/profile/presentation/pages/profile_page.dart';
import '../features/profile/presentation/pages/edit_profile_page.dart';
import '../features/internships/presentation/pages/admin_internships_page.dart';
import '../features/enquiries/presentation/pages/admin_enquiries_page.dart';
import '../features/leads/presentation/pages/admin_leads_page.dart';
import '../features/portfolio/presentation/pages/admin_portfolio_page.dart';
import '../features/settings/presentation/pages/settings_page.dart';
import '../features/help/presentation/pages/help_page.dart';
import '../features/work_updates/presentation/pages/work_create_page.dart';
import '../features/leave/presentation/pages/leave_apply_page.dart';
import '../features/employee_management/presentation/pages/admin_employee_details_page.dart';
import '../features/employee_management/presentation/pages/admin_employee_edit_page.dart';

// Import Cubits & Repos
import '../features/dashboard/bloc/dashboard_cubit.dart';
import '../features/attendance/bloc/attendance_cubit.dart';
import '../features/work_updates/bloc/work_cubit.dart';
import '../features/leave/bloc/leave_cubit.dart';
import '../features/on_duty/bloc/on_duty_cubit.dart';
import '../features/employee_management/bloc/employees_cubit.dart';
import '../features/payslips/bloc/payslip_cubit.dart';
import '../features/projects/bloc/project_cubit.dart';
import '../features/requests/bloc/request_cubit.dart';
import '../features/notifications/bloc/notification_cubit.dart';

import '../features/chat/bloc/chat_cubit.dart';
import '../features/chat/data/models/chat_model.dart';
import '../features/chat/presentation/pages/team_chat_list_page.dart';
import '../features/chat/presentation/pages/chat_conversation_page.dart';

import '../shared/widgets/in_app_notification_banner.dart';

// Reusable smooth page transition helper for GoRouter routes
CustomTransitionPage<void> _buildSmoothPageTransition({
  required BuildContext context,
  required GoRouterState state,
  required Widget child,
}) {
  return CustomTransitionPage<void>(
    key: state.pageKey,
    child: child,
    transitionsBuilder: (context, animation, secondaryAnimation, child) {
      const begin = Offset(0.04, 0.0);
      const end = Offset.zero;
      const curve = Curves.easeOutCubic;

      final tween = Tween(begin: begin, end: end).chain(CurveTween(curve: curve));
      final offsetAnimation = animation.drive(tween);
      final fadeAnimation = CurvedAnimation(parent: animation, curve: Curves.easeOut);

      return SlideTransition(
        position: offsetAnimation,
        child: FadeTransition(
          opacity: fadeAnimation,
          child: child,
        ),
      );
    },
    transitionDuration: const Duration(milliseconds: 260),
  );
}

class HrmsApp extends StatefulWidget {
  const HrmsApp({super.key});

  @override
  State<HrmsApp> createState() => _HrmsAppState();
}

class _HrmsAppState extends State<HrmsApp> {
  final GlobalKey<NavigatorState> _navigatorKey = GlobalKey<NavigatorState>();
  late final ApiClient _apiClient;
  late final AuthBloc _authBloc;
  late final GoRouter _router;
  StreamSubscription? _authSub;

  @override
  void initState() {
    super.initState();
    _apiClient = ApiClient();
    _authBloc = AuthBloc(authRepository: null, storage: null);

    _loadCustomServerUrl();

    // Setup Notification Click Deep-Link Navigation
    LocalNotificationService.instance.onNotificationTap = _navigateFromNotification;
    FirebaseMessagingService.onNotificationClick = _navigateFromNotification;

    // Show In-App floating alert banner with Company Logo on foreground push
    FirebaseMessagingService.onForegroundAlert = (title, message, data) {
      final ctx = _navigatorKey.currentContext;
      if (ctx != null) {
        InAppNotificationBanner.show(
          context: ctx,
          title: title,
          message: message,
          onTap: () {
            _navigateFromNotification(jsonEncode(data));
          },
        );
      }
    };

    // Check if app was cold-started from tapping a local notification
    WidgetsBinding.instance.addPostFrameCallback((_) async {
      final coldStartPayload = await LocalNotificationService.instance.getAppLaunchPayload();
      if (coldStartPayload != null && coldStartPayload.isNotEmpty) {
        debugPrint("🚀 App launched from cold-start with notification: $coldStartPayload");
        _navigateFromNotification(coldStartPayload);
      }
    });

    // Listen to Auth State changes for Socket Connection and FCM Sync
    _authSub = _authBloc.stream.listen((state) {
      if (state is Authenticated) {
        SocketService.instance.connect(
          userId: state.user.id,
          role: state.user.role,
        );
        FirebaseMessagingService.syncUserFcmToken(_apiClient);
      } else if (state is Unauthenticated) {
        SocketService.instance.disconnect();
      }
    });

    // Dynamic 401 Session Expiration handler
    _apiClient.onSessionExpired = () {
      _authBloc.add(LogoutEvent());
      _router.go('/login');
    };

    _router = GoRouter(
      navigatorKey: _navigatorKey,
      initialLocation: '/splash',
      refreshListenable: GoRouterRefreshStream(_authBloc.stream),
      redirect: (context, state) {
        final authState = _authBloc.state;
        final goingToSplash = state.matchedLocation == '/splash';
        final goingToLogin = state.matchedLocation == '/login';

        if (goingToSplash) return null;

        if (authState is Unauthenticated) {
          return goingToLogin ? null : '/login';
        }

        if (authState is Authenticated) {
          if (goingToLogin) {
            return authState.user.isAdmin ? '/admin/dashboard' : '/dashboard';
          }
        }
        return null;
      },
      routes: [
        GoRoute(
          path: '/splash',
          pageBuilder: (context, state) => _buildSmoothPageTransition(
            context: context,
            state: state,
            child: const SplashPage(),
          ),
        ),
        GoRoute(
          path: '/login',
          pageBuilder: (context, state) => _buildSmoothPageTransition(
            context: context,
            state: state,
            child: const LoginPage(),
          ),
        ),
        
        // Employee Routes
        GoRoute(
          path: '/dashboard',
          pageBuilder: (context, state) => _buildSmoothPageTransition(
            context: context,
            state: state,
            child: const MainNavigationShell(isAdmin: false),
          ),
        ),
        GoRoute(
          path: '/attendance',
          pageBuilder: (context, state) => _buildSmoothPageTransition(
            context: context,
            state: state,
            child: const MainNavigationShell(isAdmin: false),
          ),
        ),
        GoRoute(
          path: '/work',
          pageBuilder: (context, state) => _buildSmoothPageTransition(
            context: context,
            state: state,
            child: const MainNavigationShell(isAdmin: false),
          ),
        ),
        GoRoute(
          path: '/work/create',
          pageBuilder: (context, state) => _buildSmoothPageTransition(
            context: context,
            state: state,
            child: const WorkCreatePage(isAdminJournal: false),
          ),
        ),
        GoRoute(
          path: '/leave',
          pageBuilder: (context, state) => _buildSmoothPageTransition(
            context: context,
            state: state,
            child: const MainNavigationShell(isAdmin: false),
          ),
        ),
        GoRoute(
          path: '/leave/apply',
          pageBuilder: (context, state) => _buildSmoothPageTransition(
            context: context,
            state: state,
            child: const LeaveApplyPage(),
          ),
        ),
        GoRoute(
          path: '/onduty',
          pageBuilder: (context, state) => _buildSmoothPageTransition(
            context: context,
            state: state,
            child: const OnDutyPage(),
          ),
        ),
        GoRoute(
          path: '/payslips',
          pageBuilder: (context, state) => _buildSmoothPageTransition(
            context: context,
            state: state,
            child: const PayslipsPage(),
          ),
        ),
        GoRoute(
          path: '/projects',
          pageBuilder: (context, state) => _buildSmoothPageTransition(
            context: context,
            state: state,
            child: const ProjectsPage(),
          ),
        ),
        GoRoute(
          path: '/requests',
          pageBuilder: (context, state) => _buildSmoothPageTransition(
            context: context,
            state: state,
            child: const RequestsPage(),
          ),
        ),
        GoRoute(
          path: '/notifications',
          pageBuilder: (context, state) => _buildSmoothPageTransition(
            context: context,
            state: state,
            child: const NotificationsPage(),
          ),
        ),
        GoRoute(
          path: '/profile',
          pageBuilder: (context, state) => _buildSmoothPageTransition(
            context: context,
            state: state,
            child: const ProfilePage(),
          ),
        ),
        GoRoute(
          path: '/profile/edit',
          pageBuilder: (context, state) => _buildSmoothPageTransition(
            context: context,
            state: state,
            child: const EditProfilePage(),
          ),
        ),
        GoRoute(
          path: '/chat',
          pageBuilder: (context, state) => _buildSmoothPageTransition(
            context: context,
            state: state,
            child: const TeamChatListPage(),
          ),
        ),
        GoRoute(
          path: '/chat/:userId',
          pageBuilder: (context, state) {
            final userId = state.pathParameters['userId']!;
            final targetUser = state.extra is ChatUserModel ? state.extra as ChatUserModel : null;
            return _buildSmoothPageTransition(
              context: context,
              state: state,
              child: ChatConversationPage(otherUserId: userId, targetUser: targetUser),
            );
          },
        ),
        GoRoute(
          path: '/help',
          pageBuilder: (context, state) => _buildSmoothPageTransition(
            context: context,
            state: state,
            child: const HelpPage(),
          ),
        ),

        // Admin Routes
        GoRoute(
          path: '/admin/dashboard',
          pageBuilder: (context, state) => _buildSmoothPageTransition(
            context: context,
            state: state,
            child: const MainNavigationShell(isAdmin: true),
          ),
        ),
        GoRoute(
          path: '/admin/employees',
          pageBuilder: (context, state) => _buildSmoothPageTransition(
            context: context,
            state: state,
            child: const MainNavigationShell(isAdmin: true),
          ),
        ),
        GoRoute(
          path: '/admin/employees/add',
          pageBuilder: (context, state) => _buildSmoothPageTransition(
            context: context,
            state: state,
            child: const AdminEmployeeEditPage(),
          ),
        ),
        GoRoute(
          path: '/admin/employees/:id',
          pageBuilder: (context, state) {
            final id = state.pathParameters['id']!;
            return _buildSmoothPageTransition(
              context: context,
              state: state,
              child: AdminEmployeeDetailsPage(employeeId: id),
            );
          },
        ),
        GoRoute(
          path: '/admin/employees/edit/:id',
          pageBuilder: (context, state) {
            final id = state.pathParameters['id']!;
            return _buildSmoothPageTransition(
              context: context,
              state: state,
              child: AdminEmployeeEditPage(employeeId: id),
            );
          },
        ),
        GoRoute(
          path: '/admin/attendance',
          pageBuilder: (context, state) => _buildSmoothPageTransition(
            context: context,
            state: state,
            child: const MainNavigationShell(isAdmin: true),
          ),
        ),
        GoRoute(
          path: '/admin/work',
          pageBuilder: (context, state) => _buildSmoothPageTransition(
            context: context,
            state: state,
            child: const MainNavigationShell(isAdmin: true),
          ),
        ),
        GoRoute(
          path: '/admin/leaves',
          pageBuilder: (context, state) => _buildSmoothPageTransition(
            context: context,
            state: state,
            child: const AdminOnDutyPage(isLeavesOnly: true),
          ),
        ),
        GoRoute(
          path: '/admin/onduty',
          pageBuilder: (context, state) => _buildSmoothPageTransition(
            context: context,
            state: state,
            child: const AdminOnDutyPage(),
          ),
        ),
        GoRoute(
          path: '/admin/payslips',
          pageBuilder: (context, state) => _buildSmoothPageTransition(
            context: context,
            state: state,
            child: const AdminPayslipManagementPage(),
          ),
        ),
        GoRoute(
          path: '/admin/projects',
          pageBuilder: (context, state) => _buildSmoothPageTransition(
            context: context,
            state: state,
            child: const ProjectsPage(isAdmin: true),
          ),
        ),
        GoRoute(
          path: '/admin/requests',
          pageBuilder: (context, state) => _buildSmoothPageTransition(
            context: context,
            state: state,
            child: const RequestsPage(isAdmin: true),
          ),
        ),
        GoRoute(
          path: '/admin/notifications',
          pageBuilder: (context, state) => _buildSmoothPageTransition(
            context: context,
            state: state,
            child: const NotificationsPage(isAdmin: true),
          ),
        ),
        GoRoute(
          path: '/admin/internships',
          pageBuilder: (context, state) => _buildSmoothPageTransition(
            context: context,
            state: state,
            child: const AdminInternshipsPage(),
          ),
        ),
        GoRoute(
          path: '/admin/enquiries',
          pageBuilder: (context, state) => _buildSmoothPageTransition(
            context: context,
            state: state,
            child: const AdminEnquiriesPage(),
          ),
        ),
        GoRoute(
          path: '/admin/leads',
          pageBuilder: (context, state) => _buildSmoothPageTransition(
            context: context,
            state: state,
            child: const AdminLeadsPage(),
          ),
        ),
        GoRoute(
          path: '/admin/portfolio',
          pageBuilder: (context, state) => _buildSmoothPageTransition(
            context: context,
            state: state,
            child: const AdminPortfolioPage(),
          ),
        ),
        GoRoute(
          path: '/admin/settings',
          pageBuilder: (context, state) => _buildSmoothPageTransition(
            context: context,
            state: state,
            child: const SettingsPage(),
          ),
        ),
      ],
    );
  }

  Future<void> _loadCustomServerUrl() async {
    final storage = SecureStorageService();
    final savedUrl = await storage.getServerUrl();
    if (savedUrl != null && savedUrl.isNotEmpty) {
      ApiConstants.setBaseUrl(savedUrl);
      _apiClient.updateBaseUrl(savedUrl);
    }
  }

  void _navigateFromNotification(String? payload) {
    if (payload == null || payload.isEmpty) {
      _router.push('/notifications');
      return;
    }

    try {
      Map<String, dynamic> data = {};
      if (payload.trim().startsWith('{')) {
        data = Map<String, dynamic>.from(jsonDecode(payload));
      } else {
        data = {'type': payload};
      }

      final type = (data['type'] ?? data['screen'] ?? 'general').toString().toLowerCase();
      final authState = _authBloc.state;
      final isAdmin = authState is Authenticated ? authState.user.isAdmin : false;

      debugPrint("🧭 Navigating from notification payload: $data (type: $type, isAdmin: $isAdmin)");

      switch (type) {
        case 'chat':
        case 'message':
          final targetUserId = data['userId'] ?? data['senderId'];
          if (targetUserId != null && targetUserId.toString().isNotEmpty) {
            _router.push('/chat/${targetUserId.toString()}');
          } else {
            _router.push('/chat');
          }
          break;

        case 'leave':
        case 'leave_status':
        case 'leaves':
          if (isAdmin) {
            _router.push('/admin/leaves');
          } else {
            _router.push('/leave');
          }
          break;

        case 'onduty':
        case 'on_duty':
          if (isAdmin) {
            _router.push('/admin/onduty');
          } else {
            _router.push('/onduty');
          }
          break;

        case 'attendance':
        case 'checkin':
        case 'checkout':
          if (isAdmin) {
            _router.push('/admin/attendance');
          } else {
            _router.push('/attendance');
          }
          break;

        case 'payslip':
        case 'payslips':
          if (isAdmin) {
            _router.push('/admin/payslips');
          } else {
            _router.push('/payslips');
          }
          break;

        case 'request':
        case 'requests':
          if (isAdmin) {
            _router.push('/admin/requests');
          } else {
            _router.push('/requests');
          }
          break;

        case 'project':
        case 'projects':
          if (isAdmin) {
            _router.push('/admin/projects');
          } else {
            _router.push('/projects');
          }
          break;

        case 'work':
        case 'work_update':
        case 'workupdates':
          if (isAdmin) {
            _router.push('/admin/work');
          } else {
            _router.push('/work');
          }
          break;

        case 'internship':
        case 'internships':
          if (isAdmin) {
            _router.push('/admin/internships');
          }
          break;

        case 'enquiry':
        case 'enquiries':
          if (isAdmin) {
            _router.push('/admin/enquiries');
          }
          break;

        case 'lead':
        case 'leads':
          if (isAdmin) {
            _router.push('/admin/leads');
          }
          break;

        case 'notification':
        case 'announcement':
        default:
          if (isAdmin) {
            _router.push('/admin/notifications');
          } else {
            _router.push('/notifications');
          }
          break;
      }
    } catch (e) {
      debugPrint("⚠️ Error navigating from notification: $e");
      _router.push('/notifications');
    }
  }

  @override
  void dispose() {
    _authSub?.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return MultiBlocProvider(
      providers: [
        BlocProvider<AuthBloc>.value(value: _authBloc),
        BlocProvider<DashboardCubit>(create: (context) => DashboardCubit()),
        BlocProvider<AttendanceCubit>(create: (context) => AttendanceCubit()),
        BlocProvider<WorkCubit>(create: (context) => WorkCubit()),
        BlocProvider<LeaveCubit>(create: (context) => LeaveCubit()),
        BlocProvider<OnDutyCubit>(create: (context) => OnDutyCubit()),
        BlocProvider<EmployeesCubit>(create: (context) => EmployeesCubit()),
        BlocProvider<PayslipCubit>(create: (context) => PayslipCubit()),
        BlocProvider<ProjectCubit>(create: (context) => ProjectCubit()),
        BlocProvider<RequestCubit>(create: (context) => RequestCubit()),
        BlocProvider<NotificationCubit>(create: (context) => NotificationCubit()),
        BlocProvider<ChatCubit>(create: (context) => ChatCubit()),
      ],
      child: MaterialApp.router(
        title: 'Media Wave HRMS',
        theme: AppTheme.lightTheme,
        debugShowCheckedModeBanner: false,
        routerConfig: _router,
      ),
    );
  }
}

class GoRouterRefreshStream extends ChangeNotifier {
  late final StreamSubscription<dynamic> _subscription;

  GoRouterRefreshStream(Stream<dynamic> stream) {
    notifyListeners();
    _subscription = stream.asBroadcastStream().listen(
          (dynamic _) => notifyListeners(),
        );
  }

  @override
  void dispose() {
    _subscription.cancel();
    super.dispose();
  }
}
