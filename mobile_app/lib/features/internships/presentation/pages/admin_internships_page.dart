import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:intl/intl.dart';
import '../../../../core/theme/app_theme.dart';
import '../../../../shared/widgets/avatar.dart';
import '../../../../shared/widgets/cards.dart';
import '../../../../shared/widgets/chips.dart';
import '../../../../shared/widgets/feedback.dart';
import '../../../../shared/widgets/layout.dart';
import '../../../../shared/widgets/text_fields.dart';
import '../../../auth/data/models/user_model.dart';
import '../../../employee_management/data/repository/employee_repository.dart';
import '../../data/repository/internship_repository.dart';
import '../../data/models/internship_model.dart';

class AdminInternshipsPage extends StatefulWidget {
  const AdminInternshipsPage({super.key});

  @override
  State<AdminInternshipsPage> createState() => _AdminInternshipsPageState();
}

class _AdminInternshipsPageState extends State<AdminInternshipsPage> {
  final _repository = InternshipRepository();
  final _employeeRepo = EmployeeRepository();
  List<InternshipModel> _list = [];
  Map<String, dynamic> _stats = {};
  List<UserModel> _users = [];
  bool _isLoading = true;
  bool _isLoadingUsers = false;
  String? _errorMessage;
  String? _selectedStatusFilter;
  String _searchQuery = '';

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
      final res = await _repository.getInternships();
      final statsRes = await _repository.getInternshipStats();
      setState(() {
        _list = res;
        _stats = statsRes;
        _isLoading = false;
      });
    } catch (e) {
      setState(() {
        _isLoading = false;
        _errorMessage = e.toString();
      });
    }
  }

  void _loadUsers() async {
    if (_users.isNotEmpty) return;
    setState(() {
      _isLoadingUsers = true;
    });
    try {
      final res = await _employeeRepo.getUsers();
      setState(() {
        _users = res;
        _isLoadingUsers = false;
      });
    } catch (_) {
      setState(() {
        _isLoadingUsers = false;
      });
    }
  }

  List<InternshipModel> _getFilteredList() {
    var filtered = _list;
    if (_selectedStatusFilter != null) {
      filtered = filtered
          .where((e) => e.status.toLowerCase() == _selectedStatusFilter!.toLowerCase())
          .toList();
    }
    if (_searchQuery.isNotEmpty) {
      filtered = filtered.where((e) {
        final name = e.name.toLowerCase();
        final email = e.email.toLowerCase();
        final domain = e.domain.toLowerCase();
        return name.contains(_searchQuery) || email.contains(_searchQuery) || domain.contains(_searchQuery);
      }).toList();
    }
    return filtered;
  }

  void _exportCSV() {
    final list = _getFilteredList();
    if (list.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('No data available to export.')),
      );
      return;
    }
    final buffer = StringBuffer();
    buffer.writeln('Name,Email,College,Domain,Duration,Fees,Status,BillPaid');
    for (final item in list) {
      buffer.writeln(
        '"${item.name}","${item.email}","${item.college ?? ''}","${item.domain}","${item.duration} Mos.",${item.fees},"${item.status}","${item.billPaid}"',
      );
    }
    Clipboard.setData(ClipboardData(text: buffer.toString())).then((_) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('CSV exported to clipboard successfully!')),
      );
    });
  }

  void _showEnquiryFormDialog() {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Public Enquiry Form'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: const [
            Text('To invite new applicants, share the link below:'),
            SizedBox(height: 12),
            SelectableText(
              'https://mediawavetech.vercel.app/enquiry',
              style: TextStyle(
                color: AppTheme.primary,
                fontWeight: FontWeight.bold,
                decoration: TextDecoration.underline,
              ),
            ),
            SizedBox(height: 12),
            Text(
              'Applicants can fill the public form to register interest. Their logs will appear instantly in this panel.',
              style: TextStyle(fontSize: 12, color: AppTheme.textLight),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(),
            child: const Text('Close'),
          ),
          TextButton(
            onPressed: () {
              Clipboard.setData(const ClipboardData(text: 'https://mediawavetech.vercel.app/enquiry')).then((_) {
                Navigator.of(context).pop();
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(content: Text('Link copied to clipboard!')),
                );
              });
            },
            child: const Text('Copy Link'),
          ),
        ],
      ),
    );
  }

  void _confirmDelete(String id, String name) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Delete Application'),
        content: Text('Are you sure you want to delete the internship enquiry for "$name"? This action cannot be undone.'),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(),
            child: const Text('Cancel'),
          ),
          TextButton(
            onPressed: () async {
              Navigator.of(context).pop();
              setState(() {
                _isLoading = true;
              });
              try {
                await _repository.deleteInternship(id);
                _loadData();
              } catch (e) {
                setState(() {
                  _isLoading = false;
                  _errorMessage = e.toString();
                });
              }
            },
            child: const Text('Delete', style: TextStyle(color: AppTheme.error)),
          ),
        ],
      ),
    );
  }

  void _showEditInternDialog(InternshipModel intern) {
    final allowedStatuses = ['Pending', 'Active', 'Completed', 'Rejected'];
    String selectedStatus = allowedStatuses.contains(intern.status) ? intern.status : 'Pending';

    final allowedBillPaids = ['Unpaid', 'Partial', 'Paid', 'Failed'];
    String selectedBillPaid = allowedBillPaids.contains(intern.billPaid) ? intern.billPaid : 'Unpaid';

    double billAmount = intern.billAmount;
    double paidAmount = intern.paidAmount;
    String? selectedManagerId = intern.leadManagerId;
    bool certificate = intern.documents.certificate;
    bool offerLetter = intern.documents.offerLetter;
    bool completionLetter = intern.documents.completionLetter;
    bool bill = intern.documents.bill;
    String notes = intern.notes ?? '';

    final billAmountController = TextEditingController(text: billAmount.toStringAsFixed(0));
    final paidAmountController = TextEditingController(text: paidAmount.toStringAsFixed(0));
    final notesController = TextEditingController(text: notes);

    // New web matching fields
    final collegeYearController = TextEditingController(text: intern.year ?? '');
    final durationController = TextEditingController(text: intern.duration);
    final feesController = TextEditingController(text: intern.fees.toStringAsFixed(0));
    final billNumberController = TextEditingController(text: intern.billNumber ?? '');
    final billDescriptionController = TextEditingController(text: intern.billDescription ?? '');
    DateTime? startDate = intern.startDate;
    DateTime? endDate = intern.endDate;
    DateTime? billDate = intern.billDate ?? DateTime.now();

    showDialog(
      context: context,
      builder: (context) {
        return StatefulBuilder(
          builder: (context, setDialogState) {
            return AlertDialog(
              title: Text('Edit ${intern.name}', style: const TextStyle(fontWeight: FontWeight.bold)),
              content: SizedBox(
                width: double.maxFinite,
                child: ListView(
                  shrinkWrap: true,
                  children: [
                    // Status Dropdown
                    DropdownButtonFormField<String>(
                      value: selectedStatus,
                      decoration: const InputDecoration(labelText: 'Application Status'),
                      items: ['Pending', 'Active', 'Completed', 'Rejected'].map((s) {
                        return DropdownMenuItem(value: s, child: Text(s));
                      }).toList(),
                      onChanged: (val) {
                        if (val != null) {
                          setDialogState(() {
                            selectedStatus = val;
                          });
                        }
                      },
                    ),
                    const SizedBox(height: 12),

                    // Lead Manager Dropdown
                    _isLoadingUsers
                        ? const Center(
                            child: Padding(
                              padding: EdgeInsets.all(8.0),
                              child: CircularProgressIndicator(),
                            ),
                          )
                        : DropdownButtonFormField<String?>(
                            value: selectedManagerId,
                            decoration: const InputDecoration(labelText: 'Lead Manager'),
                            items: [
                              const DropdownMenuItem<String?>(value: null, child: Text('Unassigned')),
                              ..._users.map((u) {
                                return DropdownMenuItem<String?>(value: u.id, child: Text('${u.name} (${u.jobRole})'));
                              }),
                            ],
                            onChanged: (val) {
                              setDialogState(() {
                                selectedManagerId = val;
                              });
                            },
                          ),
                    const SizedBox(height: 12),

                    // College Year
                    TextField(
                      controller: collegeYearController,
                      decoration: const InputDecoration(labelText: 'College Year (e.g. 4th Year)'),
                    ),
                    const SizedBox(height: 12),

                    // Duration & Base Fees in a Row
                    Row(
                      children: [
                        Expanded(
                          child: TextField(
                            controller: durationController,
                            decoration: const InputDecoration(labelText: 'Duration (Months)'),
                            keyboardType: TextInputType.number,
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: TextField(
                            controller: feesController,
                            decoration: const InputDecoration(labelText: 'Fees (₹)'),
                            keyboardType: TextInputType.number,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 12),

                    // Commencement Date
                    DatePickerField(
                      label: 'Commencement Date',
                      selectedDate: startDate,
                      onDateSelected: (date) {
                        setDialogState(() {
                          startDate = date;
                        });
                      },
                    ),
                    const SizedBox(height: 12),

                    // End Date
                    DatePickerField(
                      label: 'End Date',
                      selectedDate: endDate,
                      onDateSelected: (date) {
                        setDialogState(() {
                          endDate = date;
                        });
                      },
                    ),
                    const SizedBox(height: 16),

                    const Text('Documents Checklist', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
                    const SizedBox(height: 8),
                    GridView.count(
                      crossAxisCount: 2,
                      shrinkWrap: true,
                      physics: const NeverScrollableScrollPhysics(),
                      crossAxisSpacing: 8,
                      mainAxisSpacing: 8,
                      childAspectRatio: 2.8,
                      children: [
                        _buildDocButton('Offer Letter', '📄', offerLetter, (val) {
                          setDialogState(() {
                            offerLetter = val;
                          });
                        }),
                        _buildDocButton('Invoice / Bill', '🧾', bill, (val) {
                          setDialogState(() {
                            bill = val;
                          });
                        }),
                        _buildDocButton('Completion Letter', '📃', completionLetter, (val) {
                          setDialogState(() {
                            completionLetter = val;
                          });
                        }),
                        _buildDocButton('Certificate', '🎓', certificate, (val) {
                          setDialogState(() {
                            certificate = val;
                          });
                        }),
                      ],
                    ),
                    const SizedBox(height: 16),

                    // Internal Notes Field
                    TextField(
                      controller: notesController,
                      decoration: const InputDecoration(labelText: 'Internal Notes'),
                      maxLines: 2,
                    ),
                    const SizedBox(height: 20),

                    // Bill / Invoice details section
                    Container(
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: Colors.grey[50],
                        borderRadius: BorderRadius.circular(16),
                        border: Border.all(color: const Color(0xFFE2E8F0)),
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Row(
                            children: [
                              Icon(Icons.receipt_long_outlined, size: 16, color: AppTheme.primary),
                              SizedBox(width: 6),
                              Text(
                                'BILL / INVOICE DETAILS',
                                style: TextStyle(fontWeight: FontWeight.bold, fontSize: 11, letterSpacing: 0.5, color: AppTheme.textDark),
                              ),
                            ],
                          ),
                          const SizedBox(height: 12),

                          // Bill Number
                          TextField(
                            controller: billNumberController,
                            decoration: const InputDecoration(labelText: 'Bill Number', fillColor: Colors.white),
                          ),
                          const SizedBox(height: 12),

                          // Bill Date picker
                          DatePickerField(
                            label: 'Bill Date',
                            selectedDate: billDate,
                            onDateSelected: (date) {
                              setDialogState(() {
                                billDate = date;
                              });
                            },
                          ),
                          const SizedBox(height: 12),

                          // Bill Amount & Paid Amount in row
                          Row(
                            children: [
                              Expanded(
                                child: TextField(
                                  controller: billAmountController,
                                  decoration: const InputDecoration(labelText: 'Invoiced Amount (₹)', fillColor: Colors.white),
                                  keyboardType: TextInputType.number,
                                ),
                              ),
                              const SizedBox(width: 12),
                              Expanded(
                                child: TextField(
                                  controller: paidAmountController,
                                  decoration: const InputDecoration(labelText: 'Amount Collected (₹)', fillColor: Colors.white),
                                  keyboardType: TextInputType.number,
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 12),

                          // Payment Status selector row
                          const Text('Payment Status', style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: AppTheme.textLight)),
                          const SizedBox(height: 6),
                          Row(
                            children: ['Unpaid', 'Partial', 'Paid', 'Failed'].map((status) {
                              final isSelected = selectedBillPaid == status;
                              Color activeColor;
                              switch (status) {
                                case 'Paid':
                                  activeColor = AppTheme.success;
                                  break;
                                case 'Partial':
                                  activeColor = AppTheme.warning;
                                  break;
                                case 'Failed':
                                  activeColor = AppTheme.error;
                                  break;
                                default:
                                  activeColor = AppTheme.textDark;
                              }
                              return Expanded(
                                child: Padding(
                                  padding: const EdgeInsets.symmetric(horizontal: 2.0),
                                  child: OutlinedButton(
                                    style: OutlinedButton.styleFrom(
                                      backgroundColor: isSelected ? activeColor : Colors.white,
                                      foregroundColor: isSelected ? Colors.white : AppTheme.textLight,
                                      side: BorderSide(
                                        color: isSelected ? activeColor : const Color(0xFFE2E8F0),
                                        width: 1,
                                      ),
                                      padding: const EdgeInsets.symmetric(vertical: 8),
                                      minimumSize: Size.zero,
                                      shape: RoundedRectangleBorder(
                                        borderRadius: BorderRadius.circular(8),
                                      ),
                                    ),
                                    onPressed: () {
                                      setDialogState(() {
                                        selectedBillPaid = status;
                                      });
                                    },
                                    child: Text(
                                      status.toUpperCase(),
                                      style: const TextStyle(fontSize: 9, fontWeight: FontWeight.bold),
                                    ),
                                  ),
                                ),
                              );
                            }).toList(),
                          ),
                          const SizedBox(height: 12),

                          // Bill Description
                          TextField(
                            controller: billDescriptionController,
                            decoration: const InputDecoration(labelText: 'Bill Description', fillColor: Colors.white),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
              actions: [
                TextButton(
                  onPressed: () => Navigator.of(context).pop(),
                  child: const Text('Cancel'),
                ),
                TextButton(
                  onPressed: () async {
                    final data = {
                      'status': selectedStatus,
                      'billPaid': selectedBillPaid,
                      'billAmount': double.tryParse(billAmountController.text) ?? billAmount,
                      'paidAmount': double.tryParse(paidAmountController.text) ?? paidAmount,
                      'leadManager': selectedManagerId,
                      'notes': notesController.text,
                      'year': collegeYearController.text,
                      'duration': durationController.text,
                      'fees': double.tryParse(feesController.text) ?? intern.fees,
                      'startDate': startDate?.toIso8601String(),
                      'endDate': endDate?.toIso8601String(),
                      'billNumber': billNumberController.text,
                      'billDate': billDate?.toIso8601String(),
                      'billDescription': billDescriptionController.text,
                      'documents': {
                        'offerLetter': offerLetter,
                        'bill': bill,
                        'completionLetter': completionLetter,
                        'certificate': certificate,
                      }
                    };
                    Navigator.of(context).pop();
                    setState(() {
                      _isLoading = true;
                    });
                    try {
                      await _repository.updateInternship(intern.id, data);
                      _loadData();
                    } catch (e) {
                      setState(() {
                        _isLoading = false;
                        _errorMessage = e.toString();
                      });
                    }
                  },
                  child: const Text('Save'),
                ),
              ],
            );
          },
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    return AppScaffold(
      title: 'Internship Management',
      showAppBar: true,
      actions: [
        IconButton(
          tooltip: 'Export CSV',
          icon: const Icon(Icons.download_rounded, color: AppTheme.primary),
          onPressed: _exportCSV,
        ),
        IconButton(
          tooltip: 'Public Enquiry Form',
          icon: const Icon(Icons.link_rounded, color: AppTheme.primary),
          onPressed: _showEnquiryFormDialog,
        ),
      ],
      body: _isLoading
          ? const LoadingState()
          : _errorMessage != null
              ? ErrorState(message: _errorMessage!, onRetry: _loadData)
              : Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Page Subtitle/Description
                    const Padding(
                      padding: EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                      child: Text(
                        'Review applications, assign leads, manage documents & bills.',
                        style: TextStyle(
                          fontSize: 12,
                          color: AppTheme.textLight,
                          fontStyle: FontStyle.italic,
                        ),
                      ),
                    ),
                    // KPI Section
                    _buildKPISection(),

                    // Search Field
                    _buildFilterActions(),

                    // Filter Chips Row
                    _buildStatusFilterRow(),

                    // Registries List
                    Expanded(
                      child: _buildInternsList(),
                    ),
                  ],
                ),
    );
  }

  Widget _buildKPISection() {
    final total = _stats['total'] ?? 0;
    final totalInvoiced = (_stats['totalInvoiced'] ?? 0).toDouble();
    final totalCollected = (_stats['totalCollected'] ?? 0).toDouble();
    final balancePending = totalInvoiced - totalCollected;

    final statsList = [
      {
        'title': 'TOTAL APPLICANTS',
        'value': '$total',
        'icon': Icons.school_outlined,
        'color': AppTheme.primary,
      },
      {
        'title': 'TOTAL INVOICED',
        'value': '₹${NumberFormat('#,##,###').format(totalInvoiced)}',
        'icon': Icons.receipt_long_outlined,
        'color': AppTheme.secondary,
      },
      {
        'title': 'AMOUNT COLLECTED',
        'value': '₹${NumberFormat('#,##,###').format(totalCollected)}',
        'icon': Icons.check_circle_outline,
        'color': AppTheme.success,
      },
      {
        'title': 'BALANCE PENDING',
        'value': '₹${NumberFormat('#,##,###').format(balancePending)}',
        'icon': Icons.pending_actions_outlined,
        'color': AppTheme.warning,
      },
    ];

    return SizedBox(
      height: 76,
      child: ListView.builder(
        scrollDirection: Axis.horizontal,
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
        itemCount: statsList.length,
        itemBuilder: (context, index) {
          final item = statsList[index];
          final color = item['color'] as Color;
          return Container(
            width: 170,
            margin: EdgeInsets.only(right: index == statsList.length - 1 ? 0 : 10),
            child: AppCard(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
              child: Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(8),
                    decoration: BoxDecoration(
                      color: color.withOpacity(0.1),
                      borderRadius: BorderRadius.circular(10),
                    ),
                    child: Icon(
                      item['icon'] as IconData,
                      color: color,
                      size: 20,
                    ),
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Text(
                          item['value'] as String,
                          style: const TextStyle(
                            fontSize: 15,
                            fontWeight: FontWeight.bold,
                            color: AppTheme.textDark,
                          ),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                        const SizedBox(height: 1),
                        Text(
                          item['title'] as String,
                          style: const TextStyle(
                            fontSize: 8,
                            fontWeight: FontWeight.bold,
                            color: AppTheme.textLight,
                            letterSpacing: 0.3,
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
        },
      ),
    );
  }

  Widget _buildFilterActions() {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
      child: Row(
        children: [
          Expanded(
            child: SearchField(
              hint: 'Search name, email, domain...',
              onChanged: (val) {
                setState(() {
                  _searchQuery = val.trim().toLowerCase();
                });
              },
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildStatusFilterRow() {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
      child: SingleChildScrollView(
        scrollDirection: Axis.horizontal,
        child: Row(
          children: [
            _buildFilterChip('All', null),
            _buildFilterChip('Pending', 'Pending'),
            _buildFilterChip('Active', 'Active'),
            _buildFilterChip('Completed', 'Completed'),
            _buildFilterChip('Rejected', 'Rejected'),
          ],
        ),
      ),
    );
  }

  Widget _buildFilterChip(String label, String? status) {
    final isSelected = _selectedStatusFilter == status;
    return Container(
      margin: const EdgeInsets.only(right: 8),
      child: FilterChip(
        selected: isSelected,
        label: Text(label),
        onSelected: (_) {
          setState(() {
            _selectedStatusFilter = status;
          });
        },
        selectedColor: AppTheme.primary.withValues(alpha: 0.15),
        labelStyle: TextStyle(
          color: isSelected ? AppTheme.primary : AppTheme.textDark,
          fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
        ),
      ),
    );
  }

  Widget _buildInternsList() {
    final filtered = _getFilteredList();

    if (filtered.isEmpty) {
      return RefreshIndicator(
        onRefresh: () async => _loadData(),
        child: ListView(
          physics: const AlwaysScrollableScrollPhysics(),
          children: const [
            SizedBox(height: 100),
            EmptyState(
              title: 'No Interns Found',
              message: 'No internship records matched the query.',
            ),
          ],
        ),
      );
    }

    return RefreshIndicator(
      onRefresh: () async => _loadData(),
      child: ListView.builder(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      itemCount: filtered.length,
      itemBuilder: (context, index) {
        final intern = filtered[index];
        final startStr = intern.startDate != null ? DateFormat('dd MMM').format(intern.startDate!) : 'TBD';
        final endStr = intern.endDate != null ? DateFormat('dd MMM yyyy').format(intern.endDate!) : 'TBD';
        final managerName = intern.leadManager?.name ?? 'Unassigned';

        return Container(
          margin: const EdgeInsets.symmetric(vertical: 6),
          child: AppCard(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Top Row: Applicant Profile Info
                Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Avatar(
                      url: null,
                      name: intern.name,
                      size: 40,
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            intern.name,
                            style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 15),
                          ),
                          Text(
                            intern.email,
                            style: const TextStyle(color: AppTheme.textLight, fontSize: 12),
                          ),
                          if (intern.college != null && intern.college!.isNotEmpty)
                            Text(
                              '${intern.college} (${intern.year ?? "N/A"} Year)',
                              style: const TextStyle(color: AppTheme.textLight, fontSize: 11),
                            ),
                        ],
                      ),
                    ),
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.end,
                      children: [
                        StatusChip(label: intern.status, status: intern.status),
                        const SizedBox(height: 4),
                        StatusChip(label: intern.billPaid, status: intern.billPaid),
                      ],
                    ),
                  ],
                ),
                const Divider(height: 20, color: Color(0xFFF1F5F9)),

                // Technical details
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text('DOMAIN TRACK', style: TextStyle(color: AppTheme.textLight, fontSize: 10, fontWeight: FontWeight.bold)),
                        const SizedBox(height: 2),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                          decoration: BoxDecoration(
                            color: AppTheme.primary.withValues(alpha: 0.1),
                            borderRadius: BorderRadius.circular(4),
                          ),
                          child: Text(
                            intern.domain.toUpperCase(),
                            style: const TextStyle(color: AppTheme.primary, fontWeight: FontWeight.bold, fontSize: 10),
                          ),
                        ),
                      ],
                    ),
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.end,
                      children: [
                        const Text('DURATION & TIMELINE', style: TextStyle(color: AppTheme.textLight, fontSize: 10, fontWeight: FontWeight.bold)),
                        const SizedBox(height: 2),
                        Text(
                          '${intern.duration} Months ($startStr - $endStr)',
                          style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 12),
                        ),
                      ],
                    ),
                  ],
                ),
                const SizedBox(height: 12),

                // Lead manager & Invoice details
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text('LEAD MANAGER', style: TextStyle(color: AppTheme.textLight, fontSize: 10, fontWeight: FontWeight.bold)),
                        const SizedBox(height: 2),
                        Text(
                          managerName,
                          style: TextStyle(
                            fontSize: 12,
                            fontWeight: FontWeight.w600,
                            color: intern.leadManager != null ? AppTheme.textDark : AppTheme.textLight,
                            fontStyle: intern.leadManager != null ? FontStyle.normal : FontStyle.italic,
                          ),
                        ),
                      ],
                    ),
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.end,
                      children: [
                        const Text('FEES DETAILS', style: TextStyle(color: AppTheme.textLight, fontSize: 10, fontWeight: FontWeight.bold)),
                        const SizedBox(height: 2),
                        Text(
                          '₹${intern.paidAmount.toStringAsFixed(0)} Paid / ₹${intern.billAmount.toStringAsFixed(0)} Invoiced',
                          style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 12),
                        ),
                      ],
                    ),
                  ],
                ),
                const SizedBox(height: 12),

                // Documents Checklist indicator
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text('DOCUMENTS CHECKLIST', style: TextStyle(color: AppTheme.textLight, fontSize: 10, fontWeight: FontWeight.bold)),
                    const SizedBox(height: 4),
                    Wrap(
                      spacing: 6,
                      runSpacing: 4,
                      children: [
                        _buildDocIndicatorChip('Offer Letter', intern.documents.offerLetter),
                        _buildDocIndicatorChip('Bill/Invoice', intern.documents.bill),
                        _buildDocIndicatorChip('Completion', intern.documents.completionLetter),
                        _buildDocIndicatorChip('Certificate', intern.documents.certificate),
                      ],
                    ),
                  ],
                ),

                const Divider(height: 24, color: Color(0xFFF1F5F9)),

                // Action buttons row
                Row(
                  mainAxisAlignment: MainAxisAlignment.end,
                  children: [
                    IconButton(
                      tooltip: 'Delete',
                      icon: const Icon(Icons.delete_outline, color: AppTheme.error, size: 20),
                      onPressed: () => _confirmDelete(intern.id, intern.name),
                    ),
                    const SizedBox(width: 4),
                    IconButton(
                      tooltip: 'View Invoice',
                      icon: const Icon(Icons.receipt_long_outlined, color: AppTheme.success, size: 20),
                      onPressed: () => _showBillPreviewDialog(intern),
                    ),
                    const SizedBox(width: 8),
                    ElevatedButton.icon(
                      onPressed: () {
                        _loadUsers();
                        _showEditInternDialog(intern);
                      },
                      icon: const Icon(Icons.edit_outlined, size: 14),
                      label: const Text('Edit Details'),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppTheme.primary,
                        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                        minimumSize: Size.zero,
                        textStyle: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold),
                      ),
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

  Widget _buildDocIndicatorChip(String label, bool isPresent) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
      decoration: BoxDecoration(
        color: isPresent ? AppTheme.success.withOpacity(0.1) : Colors.grey[100],
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: isPresent ? AppTheme.success.withOpacity(0.3) : Colors.grey[200]!,
          width: 0.5,
        ),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(
            isPresent ? Icons.check_circle : Icons.radio_button_unchecked,
            size: 11,
            color: isPresent ? AppTheme.success : Colors.grey[400],
          ),
          const SizedBox(width: 4),
          Text(
            label,
            style: TextStyle(
              fontSize: 10,
              color: isPresent ? AppTheme.success : Colors.grey[600],
              fontWeight: isPresent ? FontWeight.bold : FontWeight.normal,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildDocButton(String label, String emoji, bool isSelected, ValueChanged<bool> onChanged) {
    return InkWell(
      onTap: () => onChanged(!isSelected),
      borderRadius: BorderRadius.circular(12),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
        decoration: BoxDecoration(
          color: isSelected ? AppTheme.success.withOpacity(0.08) : Colors.white,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(
            color: isSelected ? AppTheme.success : const Color(0xFFE2E8F0),
            width: 1.5,
          ),
        ),
        child: Row(
          children: [
            Text(emoji, style: const TextStyle(fontSize: 16)),
            const SizedBox(width: 8),
            Expanded(
              child: Text(
                label,
                style: TextStyle(
                  fontSize: 11,
                  fontWeight: FontWeight.bold,
                  color: isSelected ? AppTheme.success : AppTheme.textLight,
                ),
              ),
            ),
            if (isSelected)
              const Icon(Icons.check_circle, size: 16, color: AppTheme.success),
          ],
        ),
      ),
    );
  }

  void _showBillPreviewDialog(InternshipModel intern) {
    final now = intern.billDate ?? DateTime.now();
    final formattedDate = DateFormat('dd MMMM yyyy').format(now);
    final billNo = intern.billNumber != null && intern.billNumber!.isNotEmpty
        ? intern.billNumber!
        : 'MWT-BILL-${intern.id.substring(intern.id.length - 6).toUpperCase()}';
    final billAmt = intern.billAmount > 0 ? intern.billAmount : intern.fees;
    final paidAmt = intern.paidAmount;
    final balanceAmt = billAmt - paidAmt;
    final managerName = intern.leadManager?.name ?? 'Authorized Signatory';
    final managerRole = intern.leadManager?.jobRole ?? 'Internship Lead';

    showDialog(
      context: context,
      builder: (context) {
        return Dialog(
          backgroundColor: Colors.transparent,
          insetPadding: const EdgeInsets.all(12),
          child: Container(
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(20),
            ),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                // Top control bar
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Row(
                        children: [
                          Container(
                            padding: const EdgeInsets.all(8),
                            decoration: BoxDecoration(
                              color: AppTheme.primary.withOpacity(0.1),
                              borderRadius: BorderRadius.circular(10),
                            ),
                            child: const Icon(Icons.receipt_long_outlined, color: AppTheme.primary, size: 20),
                          ),
                          const SizedBox(width: 10),
                          Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              const Text(
                                'INTERNSHIP BILL',
                                style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13, letterSpacing: 0.5),
                              ),
                              Text(
                                intern.name,
                                style: const TextStyle(color: AppTheme.textLight, fontSize: 11),
                              ),
                            ],
                          ),
                        ],
                      ),
                      Row(
                        children: [
                          IconButton(
                            tooltip: 'Copy Details',
                            icon: const Icon(Icons.copy_rounded, color: AppTheme.textLight, size: 20),
                            onPressed: () {
                              final textDetails = '''
MEDIAWAVE TECHNOLOGIES - INTERNSHIP BILL
----------------------------------------
Bill Number: $billNo
Bill Date: $formattedDate
Intern Name: ${intern.name}
Email: ${intern.email}
College: ${intern.college ?? '—'} (${intern.year ?? '—'})
Domain: ${intern.domain}
Duration: ${intern.duration} Months
Managed By: $managerName

FEES DETAILS:
Description: Internship Fee — ${intern.domain}
Total Invoiced: ₹${billAmt.toStringAsFixed(0)}
Amount Paid: ₹${paidAmt.toStringAsFixed(0)}
Balance Due: ₹${balanceAmt.toStringAsFixed(0)}
Payment Status: ${intern.billPaid}
----------------------------------------
Authorized Signature
MediaWave Technologies
''';
                              Clipboard.setData(ClipboardData(text: textDetails)).then((_) {
                                ScaffoldMessenger.of(context).showSnackBar(
                                  const SnackBar(content: Text('Invoice details copied to clipboard!')),
                                );
                              });
                            },
                          ),
                          IconButton(
                            icon: const Icon(Icons.close_rounded, color: AppTheme.textLight, size: 20),
                            onPressed: () => Navigator.of(context).pop(),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
                const Divider(height: 1, color: Color(0xFFE2E8F0)),

                // Document content
                Expanded(
                  child: SingleChildScrollView(
                    padding: const EdgeInsets.all(12),
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 20),
                      decoration: BoxDecoration(
                        color: Colors.white,
                        border: Border.all(color: Colors.black.withOpacity(0.08), width: 1),
                        borderRadius: BorderRadius.circular(12),
                        boxShadow: [
                          BoxShadow(
                            color: Colors.black.withOpacity(0.02),
                            blurRadius: 10,
                            offset: const Offset(0, 4),
                          )
                        ],
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          // Invoice Header
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Image.asset(
                                'assets/images/logo.png',
                                height: 42,
                                errorBuilder: (c, e, s) => Row(
                                  children: [
                                    Container(
                                      padding: const EdgeInsets.all(6),
                                      decoration: const BoxDecoration(
                                        color: AppTheme.primary,
                                        shape: BoxShape.circle,
                                      ),
                                      child: const Icon(Icons.school, color: Colors.white, size: 20),
                                    ),
                                    const SizedBox(width: 8),
                                    const Text(
                                      'Media Wave\nTECHNOLOGIES',
                                      style: TextStyle(
                                        fontWeight: FontWeight.w900,
                                        fontSize: 12,
                                        color: Colors.black87,
                                        height: 1.1,
                                        letterSpacing: 0.5,
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                              CustomPaint(
                                size: const Size(120, 42),
                                painter: HeaderPatternPainter(),
                              ),
                            ],
                          ),
                          const SizedBox(height: 16),
                          const Divider(color: Colors.black, thickness: 1.5, height: 1.5),
                          const SizedBox(height: 24),

                          // Document Title
                          Row(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              const Text(
                                'INTERNSHIP ',
                                style: TextStyle(
                                  fontWeight: FontWeight.bold,
                                  fontSize: 15,
                                  color: Colors.black,
                                  letterSpacing: 1.0,
                                ),
                              ),
                              Container(
                                padding: const EdgeInsets.only(bottom: 2),
                                decoration: const BoxDecoration(
                                  border: Border(
                                    bottom: BorderSide(color: Colors.black, width: 1.5),
                                  ),
                                ),
                                child: const Text(
                                  'BILL / INVOICE',
                                  style: TextStyle(
                                    fontWeight: FontWeight.bold,
                                    fontSize: 15,
                                    color: Colors.black,
                                    letterSpacing: 1.0,
                                  ),
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 24),

                          // Bill Metadata Table
                          Container(
                            decoration: BoxDecoration(
                              border: Border.all(color: Colors.black, width: 1.5),
                            ),
                            child: Table(
                              columnWidths: const {
                                0: FixedColumnWidth(140),
                                1: FlexColumnWidth(),
                              },
                              border: TableBorder.all(color: Colors.black, width: 1.5),
                              children: [
                                _buildInvoiceRow('BILL NUMBER', billNo),
                                _buildInvoiceRow('BILL DATE', formattedDate),
                                _buildInvoiceRow('INTERN NAME', intern.name),
                                _buildInvoiceRow('EMAIL / CONTACT', '${intern.email}${intern.phone != null && intern.phone!.isNotEmpty ? ' | ${intern.phone}' : ''}'),
                                _buildInvoiceRow('COLLEGE / INSTITUTION', intern.college ?? '—'),
                                _buildInvoiceRow('DOMAIN / TRACK', intern.domain),
                                _buildInvoiceRow('INTERNSHIP DURATION', '${intern.duration} ${intern.duration == "1" ? "Month" : "Months"}'),
                                _buildInvoiceRow('MANAGED BY (LEAD)', managerName),
                              ],
                            ),
                          ),
                          const SizedBox(height: 24),

                          // Fees Details Section
                          Container(
                            decoration: BoxDecoration(
                              border: Border.all(color: Colors.black, width: 1.5),
                            ),
                            child: Column(
                              children: [
                                // Table Header
                                Container(
                                  color: const Color(0xFF0B132B),
                                  padding: const EdgeInsets.symmetric(vertical: 8),
                                  child: Row(
                                    children: [
                                      const SizedBox(
                                        width: 50,
                                        child: Center(
                                          child: Text('#', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 10)),
                                        ),
                                      ),
                                      Container(width: 1.5, height: 14, color: Colors.white),
                                      const Expanded(
                                        child: Padding(
                                          padding: EdgeInsets.only(left: 10),
                                          child: Text('DESCRIPTION', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 10)),
                                        ),
                                      ),
                                      Container(width: 1.5, height: 14, color: Colors.white),
                                      const SizedBox(
                                        width: 120,
                                        child: Center(
                                          child: Text('AMOUNT (INR)', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 10)),
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                                const Divider(height: 1.5, color: Colors.black, thickness: 1.5),

                                // Item Row
                                Row(
                                  children: [
                                    const SizedBox(
                                      width: 50,
                                      child: Center(
                                        child: Text('01', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 11, color: Colors.black)),
                                      ),
                                    ),
                                    Container(width: 1.5, height: 40, color: Colors.black),
                                    Expanded(
                                      child: Padding(
                                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
                                        child: Text(
                                          intern.billDescription != null && intern.billDescription!.isNotEmpty
                                              ? intern.billDescription!
                                              : 'Internship Fee — ${intern.domain} (${intern.duration} ${intern.duration == "1" ? "Month" : "Months"})',
                                          style: const TextStyle(fontSize: 10, color: Colors.black),
                                        ),
                                      ),
                                    ),
                                    Container(width: 1.5, height: 40, color: Colors.black),
                                    SizedBox(
                                      width: 120,
                                      child: Center(
                                        child: Text(
                                          NumberFormat('#,##,##0.00').format(billAmt),
                                          style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 11, color: Colors.black),
                                        ),
                                      ),
                                    ),
                                  ],
                                ),
                                const Divider(height: 1.5, color: Colors.black, thickness: 1.5),

                                // Total Bill Amount Row
                                Row(
                                  children: [
                                    const Expanded(
                                      child: Padding(
                                        padding: EdgeInsets.symmetric(horizontal: 10, vertical: 8),
                                        child: Text(
                                          'TOTAL BILL AMOUNT',
                                          style: TextStyle(fontWeight: FontWeight.bold, fontSize: 9, color: Color(0xFF475569)),
                                        ),
                                      ),
                                    ),
                                    Container(width: 1.5, height: 30, color: Colors.black),
                                    SizedBox(
                                      width: 120,
                                      child: Center(
                                        child: Text(
                                          '₹ ${NumberFormat('#,##,##0.00').format(billAmt)}',
                                          style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 11, color: Colors.black),
                                        ),
                                      ),
                                    ),
                                  ],
                                ),
                                const Divider(height: 1.5, color: Colors.black, thickness: 1.5),

                                // Amount Already Paid Row
                                Row(
                                  children: [
                                    const Expanded(
                                      child: Padding(
                                        padding: EdgeInsets.symmetric(horizontal: 10, vertical: 8),
                                        child: Text(
                                          'AMOUNT ALREADY PAID (-)',
                                          style: TextStyle(fontWeight: FontWeight.bold, fontSize: 9, color: Color(0xFF059669)),
                                        ),
                                      ),
                                    ),
                                    Container(width: 1.5, height: 30, color: Colors.black),
                                    SizedBox(
                                      width: 120,
                                      child: Center(
                                        child: Text(
                                          '₹ ${NumberFormat('#,##,##0.00').format(paidAmt)}',
                                          style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 11, color: Color(0xFF059669)),
                                        ),
                                      ),
                                    ),
                                  ],
                                ),
                                const Divider(height: 1.5, color: Colors.black, thickness: 1.5),

                                // Final Balance Due Row
                                Container(
                                  color: const Color(0xFF0B132B),
                                  child: Row(
                                    children: [
                                      const Expanded(
                                        child: Padding(
                                          padding: EdgeInsets.symmetric(horizontal: 10, vertical: 10),
                                          child: Text(
                                            'FINAL BALANCE DUE (INR)',
                                            style: TextStyle(fontWeight: FontWeight.bold, fontSize: 10, color: Colors.white),
                                          ),
                                        ),
                                      ),
                                      Container(width: 1.5, height: 36, color: Colors.white),
                                      SizedBox(
                                        width: 120,
                                        child: Center(
                                          child: Text(
                                            '₹ ${NumberFormat('#,##,##0.0').format(balanceAmt)}',
                                            style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 12, color: Colors.white),
                                          ),
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                              ],
                            ),
                          ),
                          const SizedBox(height: 24),

                          // Payment Status Box
                          Row(
                            children: [
                              const Text(
                                'PAYMENT STATUS: ',
                                style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: Colors.black),
                              ),
                              const SizedBox(width: 8),
                              _buildPaymentStatusBadge(intern.billPaid),
                            ],
                          ),
                          const SizedBox(height: 36),

                          // Authorized Signature Section
                          const Text(
                            'Authorized Signature,',
                            style: TextStyle(fontStyle: FontStyle.italic, fontSize: 12, fontWeight: FontWeight.bold, color: Colors.black),
                          ),
                          const SizedBox(height: 36),
                          Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Container(
                                padding: const EdgeInsets.only(bottom: 2),
                                decoration: const BoxDecoration(
                                  border: Border(
                                    bottom: BorderSide(color: Colors.black, width: 1.5),
                                  ),
                                ),
                                child: Text(
                                  managerName.toUpperCase(),
                                  style: const TextStyle(
                                    fontWeight: FontWeight.bold,
                                    fontSize: 11,
                                    color: Colors.black,
                                    letterSpacing: 0.5,
                                  ),
                                ),
                              ),
                              const SizedBox(height: 4),
                              Text(
                                '${managerRole.toUpperCase()} — MEDIAWAVE TECHNOLOGIES',
                                style: const TextStyle(
                                  fontSize: 9,
                                  fontWeight: FontWeight.bold,
                                  color: Color(0xFF475569),
                                  letterSpacing: 0.5,
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 24),

                          // Footer with Icons
                          const Divider(height: 20, color: Colors.grey, thickness: 1),
                          const SizedBox(height: 10),
                          CustomPaint(
                            painter: FooterPatternPainter(),
                            child: Padding(
                              padding: const EdgeInsets.only(bottom: 12),
                              child: Row(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Expanded(
                                    child: Column(
                                      children: [
                                        _buildFooterIcon(Icons.location_on_rounded),
                                        const SizedBox(height: 6),
                                        const Text(
                                          'WD-54, Anandha bhavan complex,\nSecond floor, 17/52, Puthur High Rd,\nTiruchirappalli, Tamil Nadu 620017',
                                          style: TextStyle(fontSize: 8, color: Colors.black87),
                                          textAlign: TextAlign.center,
                                        ),
                                      ],
                                    ),
                                  ),
                                  Expanded(
                                    child: Column(
                                      children: [
                                        _buildFooterIcon(Icons.phone_rounded),
                                        const SizedBox(height: 6),
                                        const Text(
                                          '+91 6369152325',
                                          style: TextStyle(fontSize: 8, color: Colors.black87, fontWeight: FontWeight.bold),
                                          textAlign: TextAlign.center,
                                        ),
                                      ],
                                    ),
                                  ),
                                  Expanded(
                                    child: Column(
                                      children: [
                                        _buildFooterIcon(Icons.language_rounded),
                                        const SizedBox(height: 6),
                                        const Text(
                                          'mediawavetech.com\nsupport@mediawavetech.com',
                                          style: TextStyle(fontSize: 8, color: Colors.black87),
                                          textAlign: TextAlign.center,
                                        ),
                                      ],
                                    ),
                                  ),
                                ],
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
          ),
        );
      },
    );
  }

  TableRow _buildInvoiceRow(String label, String value) {
    return TableRow(
      children: [
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
          child: Text(
            label,
            style: const TextStyle(
              fontWeight: FontWeight.bold,
              fontSize: 10,
              color: Colors.black,
            ),
          ),
        ),
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
          child: Text(
            value,
            style: const TextStyle(
              fontSize: 10,
              color: Colors.black,
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildFooterIcon(IconData icon) {
    return Container(
      padding: const EdgeInsets.all(6),
      decoration: const BoxDecoration(
        color: Color(0xFF0284C7),
        shape: BoxShape.circle,
      ),
      child: Icon(icon, color: Colors.white, size: 14),
    );
  }

  Widget _buildPaymentStatusBadge(String status) {
    Color borderColor;
    Color bgColor;
    String label;
    IconData icon;

    switch (status.toLowerCase()) {
      case 'paid':
        borderColor = const Color(0xFF10B981); // green
        bgColor = const Color(0xFFECFDF5);
        label = 'PAID';
        icon = Icons.check_circle_outline_rounded;
        break;
      case 'partial':
        borderColor = const Color(0xFFF59E0B); // amber
        bgColor = const Color(0xFFFFFBEB);
        label = 'PARTIAL';
        icon = Icons.error_outline_rounded;
        break;
      case 'failed':
        borderColor = const Color(0xFFEF4444); // red
        bgColor = const Color(0xFFFEF2F2);
        label = 'FAILED';
        icon = Icons.cancel_outlined;
        break;
      default:
        borderColor = const Color(0xFFEF4444); // red
        bgColor = const Color(0xFFFEF2F2);
        label = 'UNPAID';
        icon = Icons.warning_amber_rounded;
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: bgColor,
        border: Border.all(color: borderColor, width: 1.5),
        borderRadius: BorderRadius.circular(4),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, color: borderColor, size: 12),
          const SizedBox(width: 4),
          Text(
            label,
            style: TextStyle(
              fontSize: 10,
              fontWeight: FontWeight.w900,
              color: borderColor,
              letterSpacing: 0.5,
            ),
          ),
        ],
      ),
    );
  }
}

class HeaderPatternPainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final strokePaint = Paint()
      ..color = const Color(0xFF0284C7).withOpacity(0.3)
      ..style = PaintingStyle.stroke
      ..strokeWidth = 1.5;

    final fillPaint = Paint()
      ..color = const Color(0xFF0284C7).withOpacity(0.15)
      ..style = PaintingStyle.fill;

    // Outer geometric outline
    final path = Path();
    path.moveTo(size.width - 90, 0);
    path.lineTo(size.width - 45, size.height * 0.8);
    path.lineTo(size.width, 0);
    canvas.drawPath(path, strokePaint);

    // Inner filled diamond
    final path2 = Path();
    path2.moveTo(size.width - 55, 0);
    path2.lineTo(size.width - 15, size.height * 0.9);
    path2.lineTo(size.width, size.height * 0.4);
    canvas.drawPath(path2, strokePaint);
    canvas.drawPath(path2, fillPaint);
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}

class FooterPatternPainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final paint1 = Paint()
      ..color = const Color(0xFF0284C7)
      ..style = PaintingStyle.fill;
    
    final paint2 = Paint()
      ..color = const Color(0xFF38BDF8)
      ..style = PaintingStyle.fill;

    // Bottom left triangles
    final pathLeft = Path();
    pathLeft.moveTo(0, size.height);
    pathLeft.lineTo(20, size.height);
    pathLeft.lineTo(0, size.height - 20);
    pathLeft.close();
    canvas.drawPath(pathLeft, paint1);

    final pathLeft2 = Path();
    pathLeft2.moveTo(5, size.height);
    pathLeft2.lineTo(25, size.height);
    pathLeft2.lineTo(5, size.height - 20);
    pathLeft2.close();
    canvas.drawPath(pathLeft2, paint2);

    // Bottom right triangles
    final pathRight = Path();
    pathRight.moveTo(size.width, size.height);
    pathRight.lineTo(size.width - 20, size.height);
    pathRight.lineTo(size.width, size.height - 20);
    pathRight.close();
    canvas.drawPath(pathRight, paint1);

    final pathRight2 = Path();
    pathRight2.moveTo(size.width - 5, size.height);
    pathRight2.lineTo(size.width - 25, size.height);
    pathRight2.lineTo(size.width - 5, size.height - 20);
    pathRight2.close();
    canvas.drawPath(pathRight2, paint2);
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}
