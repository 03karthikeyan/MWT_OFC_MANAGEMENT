import 'dart:io';
import 'package:dio/dio.dart';
import '../storage/secure_storage_service.dart';
import 'api_constants.dart';

class NetworkException implements Exception {
  final String message;
  final int? statusCode;

  NetworkException({required this.message, this.statusCode});

  @override
  String toString() => message;
}

class ApiClient {
  static ApiClient? _instance;

  final Dio _dio;
  final SecureStorageService _storage;
  void Function()? onSessionExpired;

  factory ApiClient({
    Dio? dio,
    SecureStorageService? storage,
  }) {
    _instance ??= ApiClient._internal(
      dio: dio ?? Dio(),
      storage: storage ?? SecureStorageService(),
    );
    return _instance!;
  }

  void updateBaseUrl(String newUrl) {
    _dio.options.baseUrl = newUrl;
  }

  ApiClient._internal({
    required Dio dio,
    required SecureStorageService storage,
  })  : _dio = dio,
        _storage = storage {
    _dio.options
      ..baseUrl = ApiConstants.baseUrl
      ..connectTimeout = const Duration(seconds: 15)
      ..receiveTimeout = const Duration(seconds: 15)
      ..headers = {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      };

    _dio.interceptors.add(
      InterceptorsWrapper(
        onRequest: (options, handler) async {
          final token = await _storage.getToken();
          if (token != null && token.isNotEmpty) {
            options.headers['Authorization'] = 'Bearer $token';
          }
          return handler.next(options);
        },
        onResponse: (response, handler) {
          return handler.next(response);
        },
        onError: (DioException error, handler) async {
          if (error.response?.statusCode == 401) {
            await _storage.clearAll();
            if (onSessionExpired != null) {
              onSessionExpired!();
            }
          }
          return handler.next(error);
        },
      ),
    );
  }

  NetworkException _handleDioError(DioException error) {
    if (error.response != null) {
      final statusCode = error.response!.statusCode;
      final data = error.response!.data;
      String message = 'Server error ($statusCode)';

      if (data is Map && data.containsKey('message')) {
        message = data['message'].toString();
      } else if (data is Map && data.containsKey('error')) {
        message = data['error'].toString();
      }

      if (statusCode == 401) {
        return NetworkException(
          message: 'Your session has expired. Please login again.',
          statusCode: statusCode,
        );
      }
      return NetworkException(message: message, statusCode: statusCode);
    }

    switch (error.type) {
      case DioExceptionType.connectionTimeout:
      case DioExceptionType.sendTimeout:
      case DioExceptionType.receiveTimeout:
        return NetworkException(
          message: 'Connection timed out. Please check your internet connection and try again.',
        );
      case DioExceptionType.connectionError:
        return NetworkException(
          message: 'Unable to connect to the server. Please check if the server is running.',
        );
      case DioExceptionType.badResponse:
        return NetworkException(message: 'Unexpected server response.');
      case DioExceptionType.cancel:
        return NetworkException(message: 'Request was cancelled.');
      default:
        if (error.error is SocketException) {
          return NetworkException(
            message: 'Unable to connect to the server. Please check your internet connection.',
          );
        }
        return NetworkException(
          message: 'An unexpected network error occurred. Please try again.',
        );
    }
  }

  Future<Response> get(String path, {Map<String, dynamic>? queryParameters}) async {
    try {
      return await _dio.get(path, queryParameters: queryParameters);
    } on DioException catch (e) {
      throw _handleDioError(e);
    } catch (e) {
      throw NetworkException(message: e.toString());
    }
  }

  Future<Response> post(String path, {dynamic data, Map<String, dynamic>? queryParameters}) async {
    try {
      return await _dio.post(path, data: data, queryParameters: queryParameters);
    } on DioException catch (e) {
      throw _handleDioError(e);
    } catch (e) {
      throw NetworkException(message: e.toString());
    }
  }

  Future<Response> put(String path, {dynamic data, Map<String, dynamic>? queryParameters}) async {
    try {
      return await _dio.put(path, data: data, queryParameters: queryParameters);
    } on DioException catch (e) {
      throw _handleDioError(e);
    } catch (e) {
      throw NetworkException(message: e.toString());
    }
  }

  Future<Response> delete(String path, {dynamic data, Map<String, dynamic>? queryParameters}) async {
    try {
      return await _dio.delete(path, data: data, queryParameters: queryParameters);
    } on DioException catch (e) {
      throw _handleDioError(e);
    } catch (e) {
      throw NetworkException(message: e.toString());
    }
  }
}
