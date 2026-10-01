class MusterRollEmployee {
  final String userId;
  final String name;
  final String employeeId;
  final String jobRole;
  final String department;
  final int totalDaysInMonth;
  final double presentDays;
  final int halfDays;
  final double totalWorkHours;
  final Map<String, String> dailyMatrix;

  MusterRollEmployee({
    required this.userId,
    required this.name,
    required this.employeeId,
    required this.jobRole,
    required this.department,
    required this.totalDaysInMonth,
    required this.presentDays,
    required this.halfDays,
    required this.totalWorkHours,
    required this.dailyMatrix,
  });

  factory MusterRollEmployee.fromJson(Map<String, dynamic> json) {
    Map<String, String> matrix = {};
    if (json['dailyMatrix'] is Map) {
      (json['dailyMatrix'] as Map).forEach((key, value) {
        matrix[key.toString()] = value.toString();
      });
    }

    return MusterRollEmployee(
      userId: json['userId'] ?? '',
      name: json['name'] ?? '',
      employeeId: json['employeeId'] ?? 'N/A',
      jobRole: json['jobRole'] ?? 'Staff',
      department: json['department'] ?? 'General',
      totalDaysInMonth: json['totalDaysInMonth'] ?? 30,
      presentDays: (json['presentDays'] is num) ? (json['presentDays'] as num).toDouble() : 0.0,
      halfDays: json['halfDays'] ?? 0,
      totalWorkHours: (json['totalWorkHours'] is num) ? (json['totalWorkHours'] as num).toDouble() : 0.0,
      dailyMatrix: matrix,
    );
  }
}

class MusterRollReport {
  final int month;
  final int year;
  final int totalDaysInMonth;
  final int totalEmployees;
  final List<MusterRollEmployee> employees;

  MusterRollReport({
    required this.month,
    required this.year,
    required this.totalDaysInMonth,
    required this.totalEmployees,
    required this.employees,
  });

  factory MusterRollReport.fromJson(Map<String, dynamic> json) {
    List<MusterRollEmployee> list = [];
    if (json['report'] is List) {
      list = (json['report'] as List)
          .map((e) => MusterRollEmployee.fromJson(e as Map<String, dynamic>))
          .toList();
    }

    return MusterRollReport(
      month: json['month'] ?? 0,
      year: json['year'] ?? 2026,
      totalDaysInMonth: json['totalDaysInMonth'] ?? 30,
      totalEmployees: json['totalEmployees'] ?? 0,
      employees: list,
    );
  }
}

class HRSummaryOverview {
  final int totalEmployees;
  final int presentToday;
  final int absentToday;
  final int pendingLeaves;
  final int pendingExpenses;
  final int activeTasks;
  final double totalReimbursementMonth;

  HRSummaryOverview({
    required this.totalEmployees,
    required this.presentToday,
    required this.absentToday,
    required this.pendingLeaves,
    required this.pendingExpenses,
    required this.activeTasks,
    required this.totalReimbursementMonth,
  });

  factory HRSummaryOverview.fromJson(Map<String, dynamic> json) {
    return HRSummaryOverview(
      totalEmployees: json['totalEmployees'] ?? 0,
      presentToday: json['presentToday'] ?? 0,
      absentToday: json['absentToday'] ?? 0,
      pendingLeaves: json['pendingLeaves'] ?? 0,
      pendingExpenses: json['pendingExpenses'] ?? 0,
      activeTasks: json['activeTasks'] ?? 0,
      totalReimbursementMonth: (json['totalReimbursementMonth'] is num)
          ? (json['totalReimbursementMonth'] as num).toDouble()
          : 0.0,
    );
  }
}
