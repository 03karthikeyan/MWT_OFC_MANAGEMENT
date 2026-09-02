class DashboardStatsModel {
  final int totalUsers;
  final int presentToday;
  final int pendingOnDuty;
  final int activeInterns;
  final double totalInvoiced;
  final double totalCollected;

  DashboardStatsModel({
    required this.totalUsers,
    required this.presentToday,
    required this.pendingOnDuty,
    required this.activeInterns,
    required this.totalInvoiced,
    required this.totalCollected,
  });

  factory DashboardStatsModel.fromJson(Map<String, dynamic> json) {
    return DashboardStatsModel(
      totalUsers: json['totalUsers'] ?? 0,
      presentToday: json['presentToday'] ?? 0,
      pendingOnDuty: json['pendingOnDuty'] ?? 0,
      activeInterns: json['activeInterns'] ?? 0,
      totalInvoiced: (json['totalInvoiced'] ?? 0).toDouble(),
      totalCollected: (json['totalCollected'] ?? 0).toDouble(),
    );
  }
}
