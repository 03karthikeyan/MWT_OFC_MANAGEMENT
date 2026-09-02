import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:hrms_app/features/auth/bloc/auth_bloc.dart';
import 'package:hrms_app/features/auth/bloc/auth_state.dart';
import 'package:hrms_app/shared/widgets/text_fields.dart';
import '../../../../core/theme/app_theme.dart';
import '../../../../shared/widgets/feedback.dart';
import '../../../../shared/widgets/layout.dart';
import '../../data/repository/portfolio_repository.dart';
import '../../data/models/portfolio_model.dart';

class AdminPortfolioPage extends StatefulWidget {
  const AdminPortfolioPage({super.key});

  @override
  State<AdminPortfolioPage> createState() => _AdminPortfolioPageState();
}

class _AdminPortfolioPageState extends State<AdminPortfolioPage> with TickerProviderStateMixin {
  final _repository = PortfolioRepository();
  List<PortfolioModel> _list = [];
  bool _isLoading = true;
  String? _errorMessage;

  String _searchQuery = '';
  String _selectedCategory = 'All';

  final List<String> _categories = [
    'All',
    'Web Development',
    'Mobile App',
    'Logo Design',
    'Branding',
    'Photography',
    'UI/UX Design'
  ];

  final Map<String, IconData> _categoryIcons = {
    'All': Icons.apps_rounded,
    'Web Development': Icons.language_rounded,
    'Mobile App': Icons.phone_iphone_rounded,
    'Logo Design': Icons.brush_rounded,
    'Branding': Icons.palette_rounded,
    'Photography': Icons.camera_alt_rounded,
    'UI/UX Design': Icons.design_services_rounded,
  };

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  void _loadData() async {
    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });
    try {
      final res = await _repository.getPortfolios();
      setState(() {
        _list = res;
        _isLoading = false;
      });
    } catch (e) {
      setState(() {
        _isLoading = false;
        _errorMessage = e.toString();
      });
    }
  }

  List<PortfolioModel> get _filteredList {
    return _list.where((item) {
      final matchesCategory = _selectedCategory == 'All' || item.category == _selectedCategory;
      final matchesSearch = item.title.toLowerCase().contains(_searchQuery.toLowerCase()) ||
          (item.clientName?.toLowerCase().contains(_searchQuery.toLowerCase()) ?? false) ||
          item.description.toLowerCase().contains(_searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    }).toList();
  }

  int _getCategoryCount(String cat) {
    if (cat == 'All') return _list.length;
    return _list.where((item) => item.category == cat).length;
  }

  void _showAddEditSheet([PortfolioModel? item]) {
    final isEditing = item != null;
    final formKey = GlobalKey<FormState>();
    final titleController = TextEditingController(text: item?.title);
    final clientController = TextEditingController(text: item?.clientName);
    final descController = TextEditingController(text: item?.description);
    final thumbController = TextEditingController(text: item?.thumbnail);
    final linkController = TextEditingController(text: item?.liveLink);
    String selectedCat = item?.category ?? 'Web Development';
    bool isFeatured = item?.isFeatured ?? false;

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) {
        return StatefulBuilder(
          builder: (context, setSheetState) {
            return Container(
              constraints: BoxConstraints(
                maxHeight: MediaQuery.of(context).size.height * 0.92,
              ),
              decoration: const BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.vertical(top: Radius.circular(28)),
              ),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  // Drag Handle
                  Container(
                    margin: const EdgeInsets.only(top: 12),
                    width: 40,
                    height: 4,
                    decoration: BoxDecoration(
                      color: Colors.grey.shade300,
                      borderRadius: BorderRadius.circular(2),
                    ),
                  ),
                  // Header
                  Padding(
                    padding: const EdgeInsets.fromLTRB(24, 20, 16, 0),
                    child: Row(
                      children: [
                        Container(
                          padding: const EdgeInsets.all(10),
                          decoration: BoxDecoration(
                            gradient: const LinearGradient(
                              colors: [AppTheme.primary, AppTheme.secondary],
                            ),
                            borderRadius: BorderRadius.circular(14),
                          ),
                          child: Icon(
                            isEditing ? Icons.edit_rounded : Icons.add_rounded,
                            color: Colors.white,
                            size: 20,
                          ),
                        ),
                        const SizedBox(width: 14),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                isEditing ? 'EDIT PORTFOLIO' : 'ADD TO PORTFOLIO',
                                style: const TextStyle(
                                  fontWeight: FontWeight.w900,
                                  fontSize: 16,
                                  color: AppTheme.textDark,
                                  letterSpacing: 0.5,
                                ),
                              ),
                              const SizedBox(height: 2),
                              Text(
                                isEditing ? 'Update project details and links' : 'Showcase a completed project',
                                style: const TextStyle(
                                  color: AppTheme.textLight,
                                  fontSize: 12,
                                ),
                              ),
                            ],
                          ),
                        ),
                        IconButton(
                          onPressed: () => Navigator.pop(context),
                          icon: const Icon(Icons.close_rounded, color: AppTheme.textLight),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 8),
                  const Divider(height: 1),
                  // Form
                  Flexible(
                    child: SingleChildScrollView(
                      padding: const EdgeInsets.fromLTRB(24, 20, 24, 32),
                      child: Form(
                        key: formKey,
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            AppTextField(
                              label: 'Project Title *',
                              hint: 'E.g. E-commerce App',
                              controller: titleController,
                              validator: (v) => v == null || v.trim().isEmpty ? 'Title is required' : null,
                            ),
                            const SizedBox(height: 16),
                            AppTextField(
                              label: 'Client Name',
                              hint: 'E.g. Tech Corp',
                              controller: clientController,
                            ),
                            const SizedBox(height: 16),
                            AppTextField(
                              label: 'Description *',
                              hint: 'Describe the work done...',
                              controller: descController,
                              validator: (v) => v == null || v.trim().isEmpty ? 'Description is required' : null,
                            ),
                            const SizedBox(height: 16),
                            Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                const Text(
                                  'Category *',
                                  style: TextStyle(fontWeight: FontWeight.w500, fontSize: 13, color: AppTheme.textDark),
                                ),
                                const SizedBox(height: 6),
                                DropdownButtonFormField<String>(
                                  value: selectedCat,
                                  items: _categories
                                      .where((c) => c != 'All')
                                      .map((c) => DropdownMenuItem(
                                            value: c,
                                            child: Row(
                                              children: [
                                                Icon(_categoryIcons[c] ?? Icons.folder, size: 16, color: AppTheme.primary),
                                                const SizedBox(width: 8),
                                                Text(c, style: const TextStyle(fontSize: 13)),
                                              ],
                                            ),
                                          ))
                                      .toList(),
                                  onChanged: (val) {
                                    if (val != null) {
                                      setSheetState(() => selectedCat = val);
                                    }
                                  },
                                  decoration: const InputDecoration(
                                    contentPadding: EdgeInsets.symmetric(horizontal: 12, vertical: 12),
                                  ),
                                ),
                              ],
                            ),
                            const SizedBox(height: 16),
                            AppTextField(
                              label: 'Thumbnail Image URL',
                              hint: 'https://example.com/image.jpg',
                              controller: thumbController,
                              prefixIcon: Icons.image_outlined,
                            ),
                            const SizedBox(height: 16),
                            AppTextField(
                              label: 'Live Project Link',
                              hint: 'https://example.com',
                              controller: linkController,
                              prefixIcon: Icons.link_rounded,
                            ),
                            const SizedBox(height: 20),
                            // Featured Toggle
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                              decoration: BoxDecoration(
                                color: isFeatured ? AppTheme.primary.withOpacity(0.06) : Colors.grey.shade50,
                                borderRadius: BorderRadius.circular(14),
                                border: Border.all(
                                  color: isFeatured ? AppTheme.primary.withOpacity(0.3) : const Color(0xFFE2E8F0),
                                ),
                              ),
                              child: Row(
                                children: [
                                  Icon(
                                    Icons.star_rounded,
                                    color: isFeatured ? AppTheme.primary : AppTheme.textLight,
                                    size: 22,
                                  ),
                                  const SizedBox(width: 12),
                                  const Expanded(
                                    child: Text(
                                      'Mark as Featured',
                                      style: TextStyle(
                                        fontWeight: FontWeight.w700,
                                        fontSize: 13,
                                        color: AppTheme.textDark,
                                      ),
                                    ),
                                  ),
                                  Switch.adaptive(
                                    value: isFeatured,
                                    activeColor: AppTheme.primary,
                                    onChanged: (val) {
                                      setSheetState(() => isFeatured = val);
                                    },
                                  ),
                                ],
                              ),
                            ),
                            const SizedBox(height: 28),
                            // Submit Button
                            SizedBox(
                              width: double.infinity,
                              height: 52,
                              child: ElevatedButton(
                                onPressed: () async {
                                  if (formKey.currentState?.validate() ?? false) {
                                    final data = {
                                      'title': titleController.text.trim(),
                                      'clientName': clientController.text.trim(),
                                      'description': descController.text.trim(),
                                      'category': selectedCat,
                                      'thumbnail': thumbController.text.trim(),
                                      'liveLink': linkController.text.trim(),
                                      'isFeatured': isFeatured,
                                    };
                                    final messenger = ScaffoldMessenger.of(context);
                                    Navigator.of(context).pop();
                                    setState(() => _isLoading = true);
                                    try {
                                      if (isEditing) {
                                        await _repository.updatePortfolio(item.id, data);
                                        messenger.showSnackBar(
                                          const SnackBar(
                                            content: Text('Portfolio updated successfully!'),
                                            backgroundColor: AppTheme.success,
                                          ),
                                        );
                                      } else {
                                        await _repository.addPortfolio(data);
                                        messenger.showSnackBar(
                                          const SnackBar(
                                            content: Text('Portfolio item added!'),
                                            backgroundColor: AppTheme.success,
                                          ),
                                        );
                                      }
                                      _loadData();
                                    } catch (e) {
                                      messenger.showSnackBar(
                                        SnackBar(content: Text('Failed: $e'), backgroundColor: AppTheme.error),
                                      );
                                      setState(() => _isLoading = false);
                                    }
                                  }
                                },
                                style: ElevatedButton.styleFrom(
                                  backgroundColor: AppTheme.primary,
                                  foregroundColor: Colors.white,
                                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                                  elevation: 0,
                                ),
                                child: Text(
                                  isEditing ? 'UPDATE PORTFOLIO' : 'PUBLISH PORTFOLIO',
                                  style: const TextStyle(fontWeight: FontWeight.w800, letterSpacing: 1, fontSize: 13),
                                ),
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            );
          },
        );
      },
    );
  }

  void _confirmDelete(String id) {
    showDialog(
      context: context,
      builder: (context) {
        return AlertDialog(
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
          title: Row(
            children: [
              Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: AppTheme.error.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: const Icon(Icons.delete_outline_rounded, color: AppTheme.error, size: 20),
              ),
              const SizedBox(width: 12),
              const Text('Delete Item', style: TextStyle(fontWeight: FontWeight.w800, fontSize: 16)),
            ],
          ),
          content: const Text(
            'Are you sure you want to delete this portfolio item? This action cannot be undone.',
            style: TextStyle(color: AppTheme.textLight, fontSize: 13, height: 1.5),
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.of(context).pop(),
              child: const Text('CANCEL', style: TextStyle(color: AppTheme.textLight, fontWeight: FontWeight.w700)),
            ),
            ElevatedButton(
              style: ElevatedButton.styleFrom(
                backgroundColor: AppTheme.error,
                foregroundColor: Colors.white,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                elevation: 0,
              ),
              onPressed: () async {
                final messenger = ScaffoldMessenger.of(context);
                Navigator.of(context).pop();
                setState(() => _isLoading = true);
                try {
                  await _repository.deletePortfolio(id);
                  messenger.showSnackBar(
                    const SnackBar(content: Text('Portfolio item deleted!'), backgroundColor: AppTheme.success),
                  );
                  _loadData();
                } catch (e) {
                  messenger.showSnackBar(
                    SnackBar(content: Text('Failed to delete: $e'), backgroundColor: AppTheme.error),
                  );
                  setState(() => _isLoading = false);
                }
              },
              child: const Text('DELETE', style: TextStyle(fontWeight: FontWeight.w700)),
            ),
          ],
        );
      },
    );
  }

  Future<void> _openLink(String url) async {
    final uri = Uri.tryParse(url);
    if (uri != null && await canLaunchUrl(uri)) {
      await launchUrl(uri, mode: LaunchMode.externalApplication);
    }
  }

  // ── UI Builders ──────────────────────────────────────────────────────────

  Widget _buildHeader(bool hasAccess) {
    final featured = _list.where((e) => e.isFeatured).length;
    return Container(
      margin: const EdgeInsets.fromLTRB(16, 8, 16, 0),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [AppTheme.primary, AppTheme.secondary],
        ),
        borderRadius: BorderRadius.circular(24),
        boxShadow: [
          BoxShadow(
            color: AppTheme.primary.withOpacity(0.3),
            blurRadius: 20,
            offset: const Offset(0, 8),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text(
                      'PORTFOLIO',
                      style: TextStyle(
                        color: Colors.white,
                        fontWeight: FontWeight.w900,
                        fontSize: 20,
                        letterSpacing: 1.5,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      'Showcase of best work across digital disciplines',
                      style: TextStyle(
                        color: Colors.white.withOpacity(0.8),
                        fontSize: 11,
                        fontWeight: FontWeight.w500,
                      ),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ],
                ),
              ),
              const SizedBox(width: 8),
              if (hasAccess)
                Material(
                  color: Colors.white.withOpacity(0.15),
                  borderRadius: BorderRadius.circular(14),
                  child: InkWell(
                    onTap: () => _showAddEditSheet(),
                    borderRadius: BorderRadius.circular(14),
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                      child: const Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Icon(Icons.add_rounded, color: Colors.white, size: 16),
                          SizedBox(width: 4),
                          Text(
                            'ADD',
                            style: TextStyle(
                              color: Colors.white,
                              fontWeight: FontWeight.w800,
                              fontSize: 11,
                              letterSpacing: 0.5,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                ),
            ],
          ),
          const SizedBox(height: 14),
          Row(
            children: [
              _buildStatPill(Icons.folder_rounded, '${_list.length}', 'Total'),
              const SizedBox(width: 6),
              _buildStatPill(Icons.star_rounded, '$featured', 'Featured'),
              const SizedBox(width: 6),
              _buildStatPill(Icons.category_rounded, '${_categories.length - 1}', 'Categories'),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildStatPill(IconData icon, String value, String label) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 8),
        decoration: BoxDecoration(
          color: Colors.white.withOpacity(0.15),
          borderRadius: BorderRadius.circular(12),
        ),
        child: Row(
          children: [
            Icon(icon, color: Colors.white.withOpacity(0.9), size: 15),
            const SizedBox(width: 6),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    value,
                    style: const TextStyle(
                      color: Colors.white,
                      fontWeight: FontWeight.w900,
                      fontSize: 14,
                    ),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                  Text(
                    label,
                    style: TextStyle(
                      color: Colors.white.withOpacity(0.7),
                      fontSize: 8.5,
                      fontWeight: FontWeight.w600,
                      letterSpacing: 0.2,
                    ),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildSearchBar() {
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 16, 16, 0),
      child: SearchField(
        hint: 'Search by title, client, or description...',
        onChanged: (val) {
          setState(() => _searchQuery = val);
        },
      ),
    );
  }

  Widget _buildCategoryFilters() {
    return SizedBox(
      height: 42,
      child: ListView.builder(
        scrollDirection: Axis.horizontal,
        itemCount: _categories.length,
        padding: const EdgeInsets.symmetric(horizontal: 16),
        itemBuilder: (context, index) {
          final cat = _categories[index];
          final isSelected = _selectedCategory == cat;
          final count = _getCategoryCount(cat);
          return Container(
            margin: const EdgeInsets.only(right: 8),
            child: Material(
              color: isSelected ? AppTheme.primary : Colors.white,
              borderRadius: BorderRadius.circular(22),
              elevation: isSelected ? 2 : 0,
              shadowColor: AppTheme.primary.withOpacity(0.3),
              child: InkWell(
                onTap: () {
                  setState(() => _selectedCategory = cat);
                },
                borderRadius: BorderRadius.circular(22),
                child: AnimatedContainer(
                  duration: const Duration(milliseconds: 250),
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                  decoration: BoxDecoration(
                    border: Border.all(
                      color: isSelected ? AppTheme.primary : const Color(0xFFE2E8F0),
                      width: 1,
                    ),
                    borderRadius: BorderRadius.circular(22),
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(
                        _categoryIcons[cat] ?? Icons.folder,
                        size: 14,
                        color: isSelected ? Colors.white : AppTheme.textLight,
                      ),
                      const SizedBox(width: 6),
                      Text(
                        cat == 'All' ? 'All' : cat.split(' ').first,
                        style: TextStyle(
                          color: isSelected ? Colors.white : AppTheme.textLight,
                          fontSize: 11,
                          fontWeight: FontWeight.w700,
                          letterSpacing: 0.3,
                        ),
                      ),
                      if (count > 0) ...[
                        const SizedBox(width: 6),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                          decoration: BoxDecoration(
                            color: isSelected ? Colors.white.withOpacity(0.25) : AppTheme.primary.withOpacity(0.08),
                            borderRadius: BorderRadius.circular(8),
                          ),
                          child: Text(
                            '$count',
                            style: TextStyle(
                              color: isSelected ? Colors.white : AppTheme.primary,
                              fontSize: 10,
                              fontWeight: FontWeight.w800,
                            ),
                          ),
                        ),
                      ],
                    ],
                  ),
                ),
              ),
            ),
          );
        },
      ),
    );
  }

  Widget _buildPortfolioCard(PortfolioModel item, bool hasAccess) {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: const Color(0xFFE2E8F0)),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.04),
            blurRadius: 12,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Thumbnail / Image area
          Expanded(
            child: Stack(
              children: [
                // Image
                Container(
                  width: double.infinity,
                  decoration: BoxDecoration(
                    color: AppTheme.primary.withOpacity(0.04),
                    borderRadius: const BorderRadius.vertical(top: Radius.circular(20)),
                  ),
                  child: item.thumbnail != null && item.thumbnail!.isNotEmpty
                      ? ClipRRect(
                          borderRadius: const BorderRadius.vertical(top: Radius.circular(20)),
                          child: Image.network(
                            item.thumbnail!,
                            fit: BoxFit.cover,
                            width: double.infinity,
                            height: double.infinity,
                            errorBuilder: (c, e, s) => Center(
                              child: Column(
                                mainAxisAlignment: MainAxisAlignment.center,
                                children: [
                                  Icon(_categoryIcons[item.category] ?? Icons.folder_rounded,
                                      size: 32, color: AppTheme.primary.withOpacity(0.3)),
                                  const SizedBox(height: 4),
                                  Text(
                                    'NO PREVIEW',
                                    style: TextStyle(
                                      fontSize: 8,
                                      fontWeight: FontWeight.w800,
                                      color: AppTheme.textLight.withOpacity(0.4),
                                      letterSpacing: 1,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ),
                        )
                      : Center(
                          child: Column(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              Icon(_categoryIcons[item.category] ?? Icons.folder_rounded,
                                  size: 32, color: AppTheme.primary.withOpacity(0.2)),
                              const SizedBox(height: 4),
                              Text(
                                'NO PREVIEW',
                                style: TextStyle(
                                  fontSize: 8,
                                  fontWeight: FontWeight.w800,
                                  color: AppTheme.textLight.withOpacity(0.3),
                                  letterSpacing: 1,
                                ),
                              ),
                            ],
                          ),
                        ),
                ),
                // Featured Badge
                if (item.isFeatured)
                  Positioned(
                    top: 8,
                    left: 8,
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                      decoration: BoxDecoration(
                        gradient: const LinearGradient(
                          colors: [AppTheme.primary, AppTheme.secondary],
                        ),
                        borderRadius: BorderRadius.circular(8),
                        boxShadow: [
                          BoxShadow(
                            color: AppTheme.primary.withOpacity(0.3),
                            blurRadius: 6,
                            offset: const Offset(0, 2),
                          ),
                        ],
                      ),
                      child: const Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Icon(Icons.star_rounded, color: Colors.white, size: 10),
                          SizedBox(width: 3),
                          Text(
                            'FEATURED',
                            style: TextStyle(
                              color: Colors.white,
                              fontSize: 7,
                              fontWeight: FontWeight.w800,
                              letterSpacing: 0.5,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                // Live Link Badge
                if (item.liveLink != null && item.liveLink!.isNotEmpty)
                  Positioned(
                    top: 8,
                    right: 8,
                    child: Material(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(10),
                      elevation: 2,
                      shadowColor: Colors.black.withOpacity(0.1),
                      child: InkWell(
                        onTap: () => _openLink(item.liveLink!),
                        borderRadius: BorderRadius.circular(10),
                        child: Container(
                          padding: const EdgeInsets.all(6),
                          child: const Icon(
                            Icons.open_in_new_rounded,
                            size: 14,
                            color: AppTheme.primary,
                          ),
                        ),
                      ),
                    ),
                  ),
                // Admin Action Buttons
                if (hasAccess)
                  Positioned(
                    bottom: 8,
                    right: 8,
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        _buildCardAction(
                          Icons.edit_outlined,
                          AppTheme.primary,
                          () => _showAddEditSheet(item),
                        ),
                        const SizedBox(width: 4),
                        _buildCardAction(
                          Icons.delete_outline_rounded,
                          AppTheme.error,
                          () => _confirmDelete(item.id),
                        ),
                      ],
                    ),
                  ),
              ],
            ),
          ),
          // Content
          Padding(
            padding: const EdgeInsets.fromLTRB(12, 10, 12, 12),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Category
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                  decoration: BoxDecoration(
                    color: AppTheme.primary.withOpacity(0.06),
                    borderRadius: BorderRadius.circular(6),
                    border: Border.all(color: AppTheme.primary.withOpacity(0.12)),
                  ),
                  child: Text(
                    item.category.toUpperCase(),
                    style: const TextStyle(
                      color: AppTheme.primary,
                      fontWeight: FontWeight.w800,
                      fontSize: 8,
                      letterSpacing: 0.5,
                    ),
                  ),
                ),
                const SizedBox(height: 6),
                // Title
                Text(
                  item.title,
                  style: const TextStyle(
                    fontWeight: FontWeight.w800,
                    fontSize: 13,
                    color: AppTheme.textDark,
                    height: 1.2,
                  ),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
                // Client
                if (item.clientName != null && item.clientName!.isNotEmpty) ...[
                  const SizedBox(height: 3),
                  Row(
                    children: [
                      const Icon(Icons.person_outline_rounded, size: 11, color: AppTheme.textLight),
                      const SizedBox(width: 4),
                      Expanded(
                        child: Text(
                          item.clientName!,
                          style: const TextStyle(
                            color: AppTheme.textLight,
                            fontSize: 10,
                            fontWeight: FontWeight.w500,
                          ),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                    ],
                  ),
                ],
                // Description
                const SizedBox(height: 4),
                Text(
                  item.description,
                  style: TextStyle(
                    color: AppTheme.textLight.withOpacity(0.8),
                    fontSize: 10,
                    height: 1.4,
                  ),
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildCardAction(IconData icon, Color color, VoidCallback onTap) {
    return Material(
      color: Colors.white.withOpacity(0.92),
      borderRadius: BorderRadius.circular(10),
      elevation: 1,
      shadowColor: Colors.black.withOpacity(0.1),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(10),
        child: Container(
          padding: const EdgeInsets.all(6),
          child: Icon(icon, size: 14, color: color),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final authState = context.watch<AuthBloc>().state;
    final user = authState is Authenticated ? authState.user : null;
    final bool hasAccess = user?.isAdmin == true;

    final filteredList = _filteredList;

    return AppScaffold(
      title: 'Company Portfolio',
      showAppBar: true,
      body: _isLoading
          ? const LoadingState()
          : _errorMessage != null
              ? ErrorState(message: _errorMessage!, onRetry: _loadData)
              : Column(
                  children: [
                    _buildHeader(hasAccess),
                    _buildSearchBar(),
                    const SizedBox(height: 12),
                    _buildCategoryFilters(),
                    const SizedBox(height: 8),
                    Expanded(
                      child: RefreshIndicator(
                        onRefresh: () async => _loadData(),
                        child: filteredList.isEmpty
                            ? ListView(
                                children: [
                                  Padding(
                                    padding: const EdgeInsets.only(top: 60),
                                    child: EmptyState(
                                      title: 'No Work Items',
                                      message: _selectedCategory != 'All'
                                          ? 'No projects found for "$_selectedCategory".'
                                          : 'No portfolio items yet. Add your first project!',
                                      icon: Icons.art_track_rounded,
                                    ),
                                  ),
                                ],
                              )
                            : GridView.builder(
                                padding: const EdgeInsets.all(16),
                                gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                                  crossAxisCount: 2,
                                  crossAxisSpacing: 12,
                                  mainAxisSpacing: 12,
                                  childAspectRatio: 0.62,
                                ),
                                itemCount: filteredList.length,
                                itemBuilder: (context, index) {
                                  final item = filteredList[index];
                                  return _buildPortfolioCard(item, hasAccess);
                                },
                              ),
                      ),
                    ),
                  ],
                ),
    );
  }
}
