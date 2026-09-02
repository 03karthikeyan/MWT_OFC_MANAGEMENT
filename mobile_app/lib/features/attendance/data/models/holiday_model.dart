class HolidayModel {
  final String id;
  final DateTime date;
  final String reason;
  final String type;

  HolidayModel({
    required this.id,
    required this.date,
    required this.reason,
    required this.type,
  });

  factory HolidayModel.fromJson(Map<String, dynamic> json) {
    return HolidayModel(
      id: json['_id'] ?? json['id'] ?? '',
      date: DateTime.parse(json['date'].toString()),
      reason: json['reason'] ?? '',
      type: json['type'] ?? 'holiday',
    );
  }

  Map<String, dynamic> toJson() {
    return {
      '_id': id,
      'date': date.toIso8601String(),
      'reason': reason,
      'type': type,
    };
  }
}
