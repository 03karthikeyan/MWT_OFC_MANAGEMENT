class PortfolioModel {
  final String id;
  final String title;
  final String description;
  final String? clientName;
  final String category;
  final String? thumbnail;
  final String? liveLink;
  final DateTime? completionDate;
  final bool isFeatured;
  final DateTime? createdAt;

  PortfolioModel({
    required this.id,
    required this.title,
    required this.description,
    this.clientName,
    required this.category,
    this.thumbnail,
    this.liveLink,
    this.completionDate,
    required this.isFeatured,
    this.createdAt,
  });

  factory PortfolioModel.fromJson(Map<String, dynamic> json) {
    return PortfolioModel(
      id: json['_id'] ?? json['id'] ?? '',
      title: json['title'] ?? '',
      description: json['description'] ?? '',
      clientName: json['clientName'],
      category: json['category'] ?? 'Web Development',
      thumbnail: json['thumbnail'],
      liveLink: json['liveLink'],
      completionDate: json['completionDate'] != null ? DateTime.tryParse(json['completionDate'].toString()) : null,
      isFeatured: json['isFeatured'] ?? false,
      createdAt: json['createdAt'] != null ? DateTime.tryParse(json['createdAt'].toString()) : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      '_id': id,
      'title': title,
      'description': description,
      'clientName': clientName,
      'category': category,
      'thumbnail': thumbnail,
      'liveLink': liveLink,
      'completionDate': completionDate?.toIso8601String(),
      'isFeatured': isFeatured,
    };
  }
}
