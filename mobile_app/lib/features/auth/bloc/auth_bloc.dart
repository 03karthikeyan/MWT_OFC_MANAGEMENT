import 'package:flutter_bloc/flutter_bloc.dart';
import '../../../core/storage/secure_storage_service.dart';
import '../data/repository/auth_repository.dart';
import '../data/models/user_model.dart';
import 'auth_event.dart';
import 'auth_state.dart';

import '../../../core/network/api_client.dart';
import '../../../core/services/firebase_messaging_service.dart';

class AuthBloc extends Bloc<AuthEvent, AuthState> {
  final AuthRepository _authRepository;
  final SecureStorageService _storage;

  AuthBloc({
    AuthRepository? authRepository,
    SecureStorageService? storage,
  })  : _authRepository = authRepository ?? AuthRepository(),
        _storage = storage ?? SecureStorageService(),
        super(AuthInitial()) {
    on<CheckAuthEvent>(_onCheckAuth);
    on<LoginEvent>(_onLogin);
    on<RegisterEvent>(_onRegister);
    on<UpdateProfileEvent>(_onUpdateProfile);
    on<LogoutEvent>(_onLogout);
  }

  Future<void> _onCheckAuth(CheckAuthEvent event, Emitter<AuthState> emit) async {
    emit(AuthLoading());
    try {
      final token = await _storage.getToken();
      final cachedUser = await _storage.getUser();
      
      if (token != null && cachedUser != null) {
        try {
          // Verify with backend
          final user = await _authRepository.getMe();
          await _storage.saveUser(user.toJson());
          emit(Authenticated(user: user, token: token));
          FirebaseMessagingService.syncUserFcmToken(ApiClient());
        } catch (_) {
          // Backend offline or token expired
          emit(Authenticated(user: UserModel.fromJson(cachedUser), token: token));
        }
      } else {
        emit(Unauthenticated());
      }
    } catch (e) {
      emit(Unauthenticated());
    }
  }

  Future<void> _onLogin(LoginEvent event, Emitter<AuthState> emit) async {
    emit(AuthLoading());
    try {
      final data = await _authRepository.login(event.username, event.password);
      final token = data['token'] as String;
      final user = data['user'] as Map<String, dynamic>;
      
      await _storage.saveToken(token);
      await _storage.saveUser(user);
      
      emit(Authenticated(user: user['role'] != null ? UserModel.fromJson(user) : await _authRepository.getMe(), token: token));
      FirebaseMessagingService.syncUserFcmToken(ApiClient());
    } catch (e) {
      emit(AuthFailure(e.toString()));
    }
  }

  Future<void> _onRegister(RegisterEvent event, Emitter<AuthState> emit) async {
    emit(AuthLoading());
    try {
      final data = await _authRepository.register(event.data);
      final token = data['token'] as String;
      final user = data['user'] as Map<String, dynamic>;

      await _storage.saveToken(token);
      await _storage.saveUser(user);

      emit(Authenticated(user: user['role'] != null ? UserModel.fromJson(user) : await _authRepository.getMe(), token: token));
    } catch (e) {
      emit(AuthFailure(e.toString()));
    }
  }

  Future<void> _onUpdateProfile(UpdateProfileEvent event, Emitter<AuthState> emit) async {
    final currentState = state;
    if (currentState is Authenticated) {
      try {
        final updatedUser = await _authRepository.updateProfile(event.profileData);
        await _storage.saveUser(updatedUser.toJson());
        emit(Authenticated(user: updatedUser, token: currentState.token));
      } catch (e) {
        emit(AuthFailure(e.toString()));
        // Restore previous authenticated state
        emit(currentState);
      }
    }
  }

  Future<void> _onLogout(LogoutEvent event, Emitter<AuthState> emit) async {
    await _storage.clearAll();
    emit(Unauthenticated());
  }
}
