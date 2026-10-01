class ApiConstants {
  static const String defaultBaseUrl = 'https://mwt-ofc-management.onrender.com';

  static String _customBaseUrl = '';

  static void setBaseUrl(String url) {
    _customBaseUrl = url;
  }

  static String get baseUrl {
    if (_customBaseUrl.isNotEmpty) {
      return _customBaseUrl;
    }
    const fromEnv = String.fromEnvironment('API_BASE_URL');
    if (fromEnv.isNotEmpty) {
      return fromEnv;
    }
    return defaultBaseUrl;
  }

  // Auth endpoints
  static const String login = '/api/auth/login';
  static const String register = '/api/auth/register';
  static const String me = '/api/auth/me';
  static const String mypayslipsAuth = '/api/auth/mypayslips';
  static const String profile = '/api/auth/profile';

  // Attendance endpoints
  static const String checkIn = '/api/attendance/checkin';
  static const String checkOut = '/api/attendance/checkout';
  static const String myAttendance = '/api/attendance/my';
  static const String allAttendance = '/api/attendance/all';
  static const String todayAttendance = '/api/attendance/today';
  static const String attendanceSummary = '/api/attendance/summary';

  // Work endpoints
  static const String work = '/api/work';
  static const String myWork = '/api/work/my';
  static const String allWork = '/api/work/all';
  static String workDetail(String id) => '/api/work/$id';

  // Leave endpoints
  static const String leave = '/api/leave';
  static const String myLeave = '/api/leave/my';
  static const String allLeave = '/api/leave/all';
  static const String leavePendingCount = '/api/leave/pending-count';
  static String leaveDetail(String id) => '/api/leave/$id';

  // On Duty endpoints
  static const String onDuty = '/api/onduty';
  static const String myOnDuty = '/api/onduty/my';
  static const String allOnDuty = '/api/onduty/all';
  static const String onDutyPendingCount = '/api/onduty/pending-count';
  static String onDutyDetail(String id) => '/api/onduty/$id';

  // Users (Employee) endpoints
  static const String users = '/api/users';
  static const String userLeads = '/api/users/leads';
  static const String team = '/api/users/team';
  static String userDetail(String id) => '/api/users/$id';

  // Payslip endpoints
  static String generatePayslip(String userId) => '/api/payslips/generate/$userId';
  static String userPayslipHistory(String userId) => '/api/payslips/user-history/$userId';
  static const String myPayslips = '/api/payslips/my-payslips';
  static String payslipDetail(String id) => '/api/payslips/$id';

  // Notifications endpoints
  static const String myNotifications = '/api/notifications/my';
  static const String allNotifications = '/api/notifications/all';
  static const String sendNotification = '/api/notifications';
  static String notificationDetail(String id) => '/api/notifications/$id';

  // Projects endpoints
  static const String projects = '/api/projects';
  static String projectDetail(String id) => '/api/projects/$id';

  // Portfolios endpoints
  static const String portfolios = '/api/portfolios';
  static String portfolioDetail(String id) => '/api/portfolios/$id';

  // Requests endpoints
  static const String myRequests = '/api/requests/my-requests';
  static const String incomingRequests = '/api/requests/incoming';
  static const String requestsPendingCount = '/api/requests/pending-count';
  static const String requests = '/api/requests';
  static String requestDetail(String id) => '/api/requests/$id';

  // Dashboard endpoints
  static const String dashboardAdmin = '/api/dashboard/admin';
  static const String dashboardStats = '/api/dashboard/stats';

  // Internships endpoints
  static const String internshipEnquiry = '/api/internships/enquiry';
  static const String internships = '/api/internships';
  static const String internshipStats = '/api/internships/stats/summary';
  static String internshipDetail(String id) => '/api/internships/$id';

  // Enquiries endpoints
  static const String enquiries = '/api/enquiries';
  static String enquiryDetail(String id) => '/api/enquiries/$id';

  // Leads endpoints
  static const String leads = '/api/leads';
  static String leadDetail(String id) => '/api/leads/$id';

  // Holidays endpoints
  static const String holidays = '/api/holidays';
  static String holidayDetail(String id) => '/api/holidays/$id';

  // Chat endpoints
  static const String chatUsers = '/api/chat/users';
  static const String chatMessages = '/api/chat/messages';
  static String chatHistory(String userId) => '/api/chat/messages/$userId';
  static String chatMarkRead(String userId) => '/api/chat/read/$userId';

  // Leave Balances
  static const String leaveBalances = '/api/leave/balances';
  static String userLeaveBalances(String userId) => '/api/leave/balances/$userId';

  // Tasks endpoints
  static const String myTasks = '/api/tasks/my';
  static const String allTasks = '/api/tasks/all';
  static const String tasks = '/api/tasks';
  static String taskStatus(String id) => '/api/tasks/$id/status';
  static String taskComments(String id) => '/api/tasks/$id/comments';
  static String taskDetail(String id) => '/api/tasks/$id';

  // Expenses endpoints
  static const String myExpenses = '/api/expenses/my';
  static const String allExpenses = '/api/expenses/all';
  static const String expenses = '/api/expenses';
  static String expenseStatus(String id) => '/api/expenses/$id/status';
  static String expenseDetail(String id) => '/api/expenses/$id';

  // Assets endpoints
  static const String myAssets = '/api/assets/my';
  static const String allAssets = '/api/assets/all';
  static const String assets = '/api/assets';
  static String assetAllocate(String id) => '/api/assets/$id/allocate';
  static String assetDetail(String id) => '/api/assets/$id';

  // Reports endpoints
  static const String reportsMusterRoll = '/api/reports/muster-roll';
  static const String reportsSummaryOverview = '/api/reports/summary-overview';
}
