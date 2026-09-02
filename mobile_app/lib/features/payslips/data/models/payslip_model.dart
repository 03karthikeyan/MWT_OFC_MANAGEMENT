import '../../../../features/auth/data/models/user_model.dart';

class EarningsModel {
  final double basicSalary;
  final double houseRentAllowance;
  final double specialAllowance;
  final double leaveTravelAllowance;
  final double medicalAllowance;

  EarningsModel({
    required this.basicSalary,
    required this.houseRentAllowance,
    required this.specialAllowance,
    required this.leaveTravelAllowance,
    required this.medicalAllowance,
  });

  factory EarningsModel.fromJson(Map<String, dynamic> json) {
    return EarningsModel(
      basicSalary: (json['basicSalary'] ?? 0).toDouble(),
      houseRentAllowance: (json['houseRentAllowance'] ?? 0).toDouble(),
      specialAllowance: (json['specialAllowance'] ?? 0).toDouble(),
      leaveTravelAllowance: (json['leaveTravelAllowance'] ?? 0).toDouble(),
      medicalAllowance: (json['medicalAllowance'] ?? 0).toDouble(),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'basicSalary': basicSalary,
      'houseRentAllowance': houseRentAllowance,
      'specialAllowance': specialAllowance,
      'leaveTravelAllowance': leaveTravelAllowance,
      'medicalAllowance': medicalAllowance,
    };
  }
}

class DeductionsModel {
  final double tds;
  final double professionalTax;
  final double pfEmployerContribution;
  final double esicEmployerContribution;
  final double salaryDeduction;

  DeductionsModel({
    required this.tds,
    required this.professionalTax,
    required this.pfEmployerContribution,
    required this.esicEmployerContribution,
    required this.salaryDeduction,
  });

  factory DeductionsModel.fromJson(Map<String, dynamic> json) {
    return DeductionsModel(
      tds: (json['tds'] ?? 0).toDouble(),
      professionalTax: (json['professionalTax'] ?? 0).toDouble(),
      pfEmployerContribution: (json['pfEmployerContribution'] ?? 0).toDouble(),
      esicEmployerContribution: (json['esicEmployerContribution'] ?? 0).toDouble(),
      salaryDeduction: (json['salaryDeduction'] ?? 0).toDouble(),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'tds': tds,
      'professionalTax': professionalTax,
      'pfEmployerContribution': pfEmployerContribution,
      'esicEmployerContribution': esicEmployerContribution,
      'salaryDeduction': salaryDeduction,
    };
  }
}

class PayslipSummaryModel {
  final double grossPay;
  final double totalDeductions;
  final double netSalary;

  PayslipSummaryModel({
    required this.grossPay,
    required this.totalDeductions,
    required this.netSalary,
  });

  factory PayslipSummaryModel.fromJson(Map<String, dynamic> json) {
    return PayslipSummaryModel(
      grossPay: (json['grossPay'] ?? 0).toDouble(),
      totalDeductions: (json['totalDeductions'] ?? 0).toDouble(),
      netSalary: (json['netSalary'] ?? 0).toDouble(),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'grossPay': grossPay,
      'totalDeductions': totalDeductions,
      'netSalary': netSalary,
    };
  }
}

class PayslipModel {
  final String id;
  final String userId;
  final UserModel? user;
  final String month;
  final double daysPayable;
  final EarningsModel earnings;
  final DeductionsModel deductions;
  final PayslipSummaryModel summary;
  final DateTime? commencementDate;
  final String hrSignatory;
  final DateTime generatedDate;

  PayslipModel({
    required this.id,
    required this.userId,
    this.user,
    required this.month,
    required this.daysPayable,
    required this.earnings,
    required this.deductions,
    required this.summary,
    this.commencementDate,
    required this.hrSignatory,
    required this.generatedDate,
  });

  factory PayslipModel.fromJson(Map<String, dynamic> json) {
    String userId = '';
    UserModel? user;
    final rawUser = json['userId'];
    if (rawUser is Map<String, dynamic>) {
      user = UserModel.fromJson(rawUser);
      userId = user.id;
    } else if (rawUser is String) {
      userId = rawUser;
    }

    return PayslipModel(
      id: json['_id'] ?? json['id'] ?? '',
      userId: userId,
      user: user,
      month: json['month'] ?? '',
      daysPayable: (json['daysPayable'] ?? 30).toDouble(),
      earnings: json['earnings'] != null
          ? EarningsModel.fromJson(json['earnings'] as Map<String, dynamic>)
          : EarningsModel(basicSalary: 0, houseRentAllowance: 0, specialAllowance: 0, leaveTravelAllowance: 0, medicalAllowance: 0),
      deductions: json['deductions'] != null
          ? DeductionsModel.fromJson(json['deductions'] as Map<String, dynamic>)
          : DeductionsModel(tds: 0, professionalTax: 0, pfEmployerContribution: 0, esicEmployerContribution: 0, salaryDeduction: 0),
      summary: json['summary'] != null
          ? PayslipSummaryModel.fromJson(json['summary'] as Map<String, dynamic>)
          : PayslipSummaryModel(grossPay: 0, totalDeductions: 0, netSalary: 0),
      commencementDate: json['commencementDate'] != null ? DateTime.tryParse(json['commencementDate'].toString()) : null,
      hrSignatory: json['hrSignatory'] ?? 'Gopinath P',
      generatedDate: json['generatedDate'] != null ? DateTime.parse(json['generatedDate'].toString()) : DateTime.now(),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      '_id': id,
      'userId': user != null ? user!.toJson() : userId,
      'month': month,
      'daysPayable': daysPayable,
      'earnings': earnings.toJson(),
      'deductions': deductions.toJson(),
      'summary': summary.toJson(),
      'commencementDate': commencementDate?.toIso8601String(),
      'hrSignatory': hrSignatory,
      'generatedDate': generatedDate.toIso8601String(),
    };
  }
}
