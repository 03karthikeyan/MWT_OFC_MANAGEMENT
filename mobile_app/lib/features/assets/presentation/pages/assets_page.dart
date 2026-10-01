import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:intl/intl.dart';
import '../../../../core/theme/app_theme.dart';
import '../../../../shared/widgets/avatar.dart';
import '../../../../shared/widgets/cards.dart';
import '../../../../shared/widgets/feedback.dart';
import '../../../../shared/widgets/layout.dart';
import '../../../../shared/widgets/buttons.dart';
import '../../../../shared/widgets/text_fields.dart';
import '../../bloc/asset_cubit.dart';
import '../../data/models/asset_model.dart';
import '../../../employee_management/bloc/employees_cubit.dart';

class AssetsPage extends StatefulWidget {
  final bool isAdmin;
  const AssetsPage({super.key, this.isAdmin = false});

  @override
  State<AssetsPage> createState() => _AssetsPageState();
}

class _AssetsPageState extends State<AssetsPage> {
  String _selectedFilter = 'all';

  @override
  void initState() {
    super.initState();
    _load();
  }

  void _load() {
    context.read<AssetCubit>().loadAssets(
      isAdmin: widget.isAdmin,
      status: _selectedFilter == 'all' ? null : _selectedFilter,
    );
  }

  void _openAddAssetModal() {
    context.read<EmployeesCubit>().loadEmployees();
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => _AddAssetBottomSheet(onAssetCreated: _load),
    );
  }

  void _openAllocateModal(AssetModel asset) {
    context.read<EmployeesCubit>().loadEmployees();
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      builder: (ctx) => _AllocateAssetBottomSheet(asset: asset, onUpdated: _load),
    );
  }

  Color _getStatusColor(String status) {
    switch (status.toLowerCase()) {
      case 'allocated':
        return AppTheme.primary;
      case 'available':
        return AppTheme.success;
      case 'in_repair':
        return const Color(0xFFF59E0B);
      case 'retired':
      default:
        return AppTheme.textLight;
    }
  }

  IconData _getCategoryIcon(String category) {
    switch (category.toLowerCase()) {
      case 'laptop':
      case 'desktop':
        return Icons.laptop_mac;
      case 'monitor':
        return Icons.desktop_windows_outlined;
      case 'mobile device':
        return Icons.phone_android;
      case 'access card':
        return Icons.credit_card;
      default:
        return Icons.inventory_2_outlined;
    }
  }

  @override
  Widget build(BuildContext context) {
    return AppScaffold(
      title: widget.isAdmin ? 'Company Assets & Inventory' : 'My Allocated Assets',
      showAppBar: true,
      floatingActionButton: widget.isAdmin
          ? FloatingActionButton.extended(
              onPressed: _openAddAssetModal,
              backgroundColor: AppTheme.primary,
              icon: const Icon(Icons.add_circle_outline, color: Colors.white),
              label: const Text('Add Asset', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
            )
          : null,
      body: Column(
        children: [
          // Filter Chips (Admin only)
          if (widget.isAdmin)
            SingleChildScrollView(
              scrollDirection: Axis.horizontal,
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
              child: Row(
                children: [
                  _buildFilterChip('all', 'All Assets'),
                  const SizedBox(width: 8),
                  _buildFilterChip('allocated', 'Allocated'),
                  const SizedBox(width: 8),
                  _buildFilterChip('available', 'Available'),
                  const SizedBox(width: 8),
                  _buildFilterChip('in_repair', 'In Repair'),
                ],
              ),
            ),

          // Assets List
          Expanded(
            child: BlocBuilder<AssetCubit, AssetState>(
              builder: (context, state) {
                if (state is AssetLoading) {
                  return const LoadingState();
                }
                if (state is AssetFailure) {
                  return ErrorState(message: state.message, onRetry: _load);
                }
                if (state is AssetLoaded) {
                  if (state.assets.isEmpty) {
                    return const EmptyState(
                      title: 'No Assets Found',
                      message: 'No hardware or assets match this criteria.',
                    );
                  }

                  return RefreshIndicator(
                    onRefresh: () async => _load(),
                    child: ListView.builder(
                      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                      itemCount: state.assets.length,
                      itemBuilder: (context, index) {
                        final asset = state.assets[index];
                        final statusColor = _getStatusColor(asset.status);
                        final icon = _getCategoryIcon(asset.category);

                        return Container(
                          margin: const EdgeInsets.only(bottom: 12),
                          child: AppCard(
                            padding: const EdgeInsets.all(16),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Row(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Container(
                                      padding: const EdgeInsets.all(10),
                                      decoration: BoxDecoration(
                                        color: AppTheme.primary.withOpacity(0.08),
                                        borderRadius: BorderRadius.circular(10),
                                      ),
                                      child: Icon(icon, color: AppTheme.primary, size: 28),
                                    ),
                                    const SizedBox(width: 12),
                                    Expanded(
                                      child: Column(
                                        crossAxisAlignment: CrossAxisAlignment.start,
                                        children: [
                                          Text(
                                            asset.name,
                                            style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
                                          ),
                                          const SizedBox(height: 2),
                                          Text(
                                            'Tag: ${asset.assetTag} • S/N: ${asset.serialNumber.isNotEmpty ? asset.serialNumber : 'N/A'}',
                                            style: const TextStyle(color: AppTheme.textLight, fontSize: 12),
                                          ),
                                        ],
                                      ),
                                    ),
                                    Container(
                                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                                      decoration: BoxDecoration(
                                        color: statusColor.withOpacity(0.12),
                                        borderRadius: BorderRadius.circular(12),
                                      ),
                                      child: Text(
                                        asset.status.toUpperCase(),
                                        style: TextStyle(
                                          color: statusColor,
                                          fontWeight: FontWeight.bold,
                                          fontSize: 10,
                                        ),
                                      ),
                                    ),
                                  ],
                                ),
                                if (asset.specifications.isNotEmpty) ...[
                                  const SizedBox(height: 10),
                                  Text(
                                    asset.specifications,
                                    style: const TextStyle(color: AppTheme.textDark, fontSize: 13),
                                  ),
                                ],
                                const SizedBox(height: 12),
                                const Divider(color: Color(0xFFF1F5F9), height: 1),
                                const SizedBox(height: 10),

                                // Footer: Assigned User & Action
                                Row(
                                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                  children: [
                                    if (asset.assignedTo != null)
                                      Row(
                                        children: [
                                          Avatar(
                                            url: asset.assignedTo?.profilePicture,
                                            name: asset.assignedTo?.name ?? 'Staff',
                                            size: 24,
                                          ),
                                          const SizedBox(width: 6),
                                          Text(
                                            'Assigned to: ${asset.assignedTo?.name}',
                                            style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600),
                                          ),
                                        ],
                                      )
                                    else
                                      const Text(
                                        'In Inventory (Available)',
                                        style: TextStyle(fontSize: 12, color: AppTheme.success, fontWeight: FontWeight.w600),
                                      ),
                                    if (widget.isAdmin)
                                      TextButton.icon(
                                        icon: const Icon(Icons.swap_horiz, size: 16),
                                        label: Text(asset.assignedTo != null ? 'Reassign' : 'Allocate'),
                                        onPressed: () => _openAllocateModal(asset),
                                      ),
                                  ],
                                ),
                              ],
                            ),
                          ),
                        );
                      },
                    ),
                  );
                }
                return const SizedBox.shrink();
              },
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildFilterChip(String value, String label) {
    final isSelected = _selectedFilter == value;
    return ChoiceChip(
      label: Text(
        label,
        style: TextStyle(
          color: isSelected ? Colors.white : AppTheme.textDark,
          fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
          fontSize: 12,
        ),
      ),
      selected: isSelected,
      selectedColor: AppTheme.primary,
      backgroundColor: Colors.white,
      side: BorderSide(
        color: isSelected ? AppTheme.primary : const Color(0xFFCBD5E1),
      ),
      onSelected: (selected) {
        if (selected) {
          setState(() {
            _selectedFilter = value;
          });
          _load();
        }
      },
    );
  }
}

class _AllocateAssetBottomSheet extends StatefulWidget {
  final AssetModel asset;
  final VoidCallback onUpdated;
  const _AllocateAssetBottomSheet({required this.asset, required this.onUpdated});

  @override
  State<_AllocateAssetBottomSheet> createState() => _AllocateAssetBottomSheetState();
}

class _AllocateAssetBottomSheetState extends State<_AllocateAssetBottomSheet> {
  String? _assignedToUserId;

  @override
  void initState() {
    super.initState();
    _assignedToUserId = widget.asset.assignedTo?.id;
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(24),
      decoration: const BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text('Allocate ${widget.asset.name}', style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
              IconButton(icon: const Icon(Icons.close), onPressed: () => Navigator.pop(context)),
            ],
          ),
          const SizedBox(height: 16),
          const Text('Assign To Employee', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
          const SizedBox(height: 6),
          BlocBuilder<EmployeesCubit, EmployeesState>(
            builder: (context, state) {
              final employees = (state is EmployeesLoaded) ? state.employees : [];
              return DropdownButtonFormField<String>(
                value: _assignedToUserId,
                hint: const Text('Select Employee (or unassign)'),
                decoration: InputDecoration(
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
                  contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                ),
                items: [
                  const DropdownMenuItem<String>(
                    value: null,
                    child: Text('❌ Return to Inventory (Available)'),
                  ),
                  ...employees.map((emp) => DropdownMenuItem<String>(
                        value: emp.id,
                        child: Text('${emp.name} (${emp.jobRole})'),
                      )),
                ],
                onChanged: (val) => setState(() => _assignedToUserId = val),
              );
            },
          ),
          const SizedBox(height: 24),
          PrimaryButton(
            text: 'Save Allocation',
            onPressed: () {
              context.read<AssetCubit>().allocateAsset(
                    widget.asset.id,
                    assignedTo: _assignedToUserId,
                    status: _assignedToUserId != null ? 'allocated' : 'available',
                  ).then((_) {
                widget.onUpdated();
                Navigator.pop(context);
              });
            },
          ),
        ],
      ),
    );
  }
}

class _AddAssetBottomSheet extends StatefulWidget {
  final VoidCallback onAssetCreated;
  const _AddAssetBottomSheet({required this.onAssetCreated});

  @override
  State<_AddAssetBottomSheet> createState() => _AddAssetBottomSheetState();
}

class _AddAssetBottomSheetState extends State<_AddAssetBottomSheet> {
  final _formKey = GlobalKey<FormState>();
  final _nameController = TextEditingController();
  final _tagController = TextEditingController();
  final _serialController = TextEditingController();
  final _specsController = TextEditingController();
  String _category = 'Laptop';
  String? _assignedTo;

  @override
  void dispose() {
    _nameController.dispose();
    _tagController.dispose();
    _serialController.dispose();
    _specsController.dispose();
    super.dispose();
  }

  void _submit() {
    if (_formKey.currentState!.validate()) {
      context.read<AssetCubit>().registerAsset(
            name: _nameController.text.trim(),
            category: _category,
            assetTag: _tagController.text.trim(),
            serialNumber: _serialController.text.trim(),
            specifications: _specsController.text.trim(),
            assignedTo: _assignedTo,
          ).then((_) {
        widget.onAssetCreated();
        Navigator.pop(context);
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      height: MediaQuery.of(context).size.height * 0.85,
      padding: const EdgeInsets.all(24),
      decoration: const BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      child: Form(
        key: _formKey,
        child: SingleChildScrollView(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Text('Register Company Asset', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
                  IconButton(icon: const Icon(Icons.close), onPressed: () => Navigator.pop(context)),
                ],
              ),
              const SizedBox(height: 16),
              AppTextField(
                label: 'Asset Name',
                hint: 'e.g., MacBook Pro M2 16GB',
                controller: _nameController,
                validator: (val) => (val == null || val.trim().isEmpty) ? 'Asset name is required' : null,
              ),
              const SizedBox(height: 16),
              AppTextField(
                label: 'Asset Tag / ID',
                hint: 'e.g., MWT-LAP-042',
                controller: _tagController,
                validator: (val) => (val == null || val.trim().isEmpty) ? 'Asset tag is required' : null,
              ),
              const SizedBox(height: 16),
              AppTextField(
                label: 'Serial Number',
                hint: 'e.g., C02G43X1MD6R',
                controller: _serialController,
              ),
              const SizedBox(height: 16),

              // Category
              const Text('Category', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
              const SizedBox(height: 6),
              DropdownButtonFormField<String>(
                value: _category,
                decoration: InputDecoration(
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
                  contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                ),
                items: const [
                  DropdownMenuItem(value: 'Laptop', child: Text('💻 Laptop')),
                  DropdownMenuItem(value: 'Desktop', child: Text('🖥️ Desktop PC')),
                  DropdownMenuItem(value: 'Monitor', child: Text('📺 External Monitor')),
                  DropdownMenuItem(value: 'Mobile Device', child: Text('📱 Mobile Device')),
                  DropdownMenuItem(value: 'Access Card', child: Text('🪪 Access Card / Key')),
                  DropdownMenuItem(value: 'Other', child: Text('📦 Other Equipment')),
                ],
                onChanged: (val) => setState(() => _category = val ?? 'Laptop'),
              ),
              const SizedBox(height: 16),
              AppTextField(
                label: 'Specifications & Notes',
                hint: 'RAM, SSD, Color, Condition, etc.',
                controller: _specsController,
                keyboardType: TextInputType.multiline,
              ),
              const SizedBox(height: 32),
              PrimaryButton(text: 'Register Asset', onPressed: _submit),
            ],
          ),
        ),
      ),
    );
  }
}
