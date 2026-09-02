import 'dart:convert';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import '../../core/network/api_constants.dart';
import '../../core/theme/app_theme.dart';

class Avatar extends StatelessWidget {
  final String? url;
  final String name;
  final double size;

  const Avatar({
    super.key,
    this.url,
    required this.name,
    this.size = 40,
  });

  @override
  Widget build(BuildContext context) {
    final initials = name.trim().isNotEmpty
        ? name.trim().split(' ')
            .where((e) => e.isNotEmpty)
            .map((e) => e.substring(0, 1).toUpperCase())
            .take(2)
            .join()
        : 'U';

    if (url != null && url!.isNotEmpty) {
      if (url!.startsWith('data:image/')) {
        try {
          final commaIndex = url!.indexOf(',');
          final base64String = commaIndex != -1 ? url!.substring(commaIndex + 1) : url!;
          final imageBytes = base64Decode(base64String.trim());
          return Container(
            width: size,
            height: size,
            decoration: const BoxDecoration(
              shape: BoxShape.circle,
            ),
            clipBehavior: Clip.antiAlias,
            child: Image.memory(
              imageBytes,
              fit: BoxFit.cover,
              errorBuilder: (context, _, __) => _buildInitials(context, initials),
            ),
          );
        } catch (e) {
          print('Error decoding base64 image: $e');
        }
      }
    }

    String? fullUrl;
    if (url != null && url!.isNotEmpty) {
      if (url!.startsWith('http://') || url!.startsWith('https://')) {
        fullUrl = url;
      } else {
        // Assume it's a relative path on backend server
        fullUrl = '${ApiConstants.baseUrl}/$url';
      }
    }

    return Container(
      width: size,
      height: size,
      decoration: const BoxDecoration(
        shape: BoxShape.circle,
      ),
      clipBehavior: Clip.antiAlias,
      child: fullUrl != null
          ? CachedNetworkImage(
              imageUrl: fullUrl,
              fit: BoxFit.cover,
              placeholder: (context, _) => _buildInitials(context, initials),
              errorWidget: (context, _, __) => _buildInitials(context, initials),
            )
          : _buildInitials(context, initials),
    );
  }

  Widget _buildInitials(BuildContext context, String initials) {
    return Container(
      alignment: Alignment.center,
      color: AppTheme.primary.withOpacity(0.1),
      child: Text(
        initials,
        style: Theme.of(context).textTheme.titleMedium?.copyWith(
              color: AppTheme.primary,
              fontWeight: FontWeight.bold,
              fontSize: size * 0.4,
            ),
      ),
    );
  }
}
