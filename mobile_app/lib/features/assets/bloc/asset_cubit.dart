import 'package:equatable/equatable.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import '../data/models/asset_model.dart';
import '../data/repository/asset_repository.dart';

abstract class AssetState extends Equatable {
  const AssetState();
  @override
  List<Object?> get props => [];
}

class AssetInitial extends AssetState {}
class AssetLoading extends AssetState {}

class AssetLoaded extends AssetState {
  final List<AssetModel> assets;
  const AssetLoaded({required this.assets});

  @override
  List<Object?> get props => [assets];
}

class AssetFailure extends AssetState {
  final String message;
  const AssetFailure(this.message);

  @override
  List<Object?> get props => [message];
}

class AssetCubit extends Cubit<AssetState> {
  final AssetRepository _repository;

  AssetCubit({AssetRepository? repository})
      : _repository = repository ?? AssetRepository(),
        super(AssetInitial());

  Future<void> loadAssets({required bool isAdmin, String? status, String? category}) async {
    emit(AssetLoading());
    try {
      final list = isAdmin
          ? await _repository.getAllAssets(status: status, category: category)
          : await _repository.getMyAssets();
      emit(AssetLoaded(assets: list));
    } catch (e) {
      emit(AssetFailure(e.toString()));
    }
  }

  Future<void> registerAsset({
    required String name,
    required String category,
    required String assetTag,
    String? serialNumber,
    String? specifications,
    String? assignedTo,
  }) async {
    try {
      await _repository.createAsset(
        name: name,
        category: category,
        assetTag: assetTag,
        serialNumber: serialNumber,
        specifications: specifications,
        assignedTo: assignedTo,
      );
      await loadAssets(isAdmin: true);
    } catch (e) {
      emit(AssetFailure(e.toString()));
    }
  }

  Future<void> allocateAsset(String id, {String? assignedTo, String? status}) async {
    try {
      await _repository.allocateAsset(id, assignedTo: assignedTo, status: status);
      await loadAssets(isAdmin: true);
    } catch (e) {
      emit(AssetFailure(e.toString()));
    }
  }

  Future<void> deleteAsset(String id) async {
    try {
      await _repository.deleteAsset(id);
      await loadAssets(isAdmin: true);
    } catch (e) {
      emit(AssetFailure(e.toString()));
    }
  }
}
