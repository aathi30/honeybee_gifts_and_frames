package com.honeybee.shop.exception;

import java.time.Instant;
import java.util.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.*;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import org.springframework.web.multipart.MaxUploadSizeExceededException;
import org.springframework.web.multipart.support.MissingServletRequestPartException;
import org.springframework.web.servlet.resource.NoResourceFoundException;

@RestControllerAdvice
public class GlobalExceptionHandler {
  private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

  public record ErrorResponse(String message, Map<String, String> errors, Instant timestamp) {}

  private ResponseEntity<ErrorResponse> error(
      HttpStatus status, String message, Map<String, String> fields) {
    return ResponseEntity.status(status).body(new ErrorResponse(message, fields, Instant.now()));
  }

  @ExceptionHandler(ApiException.class)
  ResponseEntity<ErrorResponse> api(ApiException e) {
    return error(e.getStatus(), e.getMessage(), Map.of());
  }

  @ExceptionHandler(MethodArgumentNotValidException.class)
  ResponseEntity<ErrorResponse> validation(MethodArgumentNotValidException e) {
    Map<String, String> fields = new LinkedHashMap<>();
    e.getBindingResult()
        .getFieldErrors()
        .forEach(f -> fields.putIfAbsent(f.getField(), f.getDefaultMessage()));
    return error(HttpStatus.BAD_REQUEST, "Please check the highlighted fields", fields);
  }

  @ExceptionHandler(DataIntegrityViolationException.class)
  ResponseEntity<ErrorResponse> conflict(DataIntegrityViolationException e) {
    return error(HttpStatus.CONFLICT, "This change conflicts with existing catalog data", Map.of());
  }

  @ExceptionHandler(MaxUploadSizeExceededException.class)
  ResponseEntity<ErrorResponse> upload(MaxUploadSizeExceededException e) {
    return error(
        HttpStatus.PAYLOAD_TOO_LARGE,
        "Each image must be under 8 MB; total request under 65 MB",
        Map.of());
  }

  @ExceptionHandler({
    HttpMessageNotReadableException.class,
    MethodArgumentTypeMismatchException.class,
    MissingServletRequestPartException.class,
    org.springframework.web.bind.MissingServletRequestParameterException.class
  })
  ResponseEntity<ErrorResponse> input(Exception e) {
    return error(HttpStatus.BAD_REQUEST, "Invalid request format", Map.of());
  }

  @ExceptionHandler(NoResourceFoundException.class)
  ResponseEntity<ErrorResponse> missing(Exception e) {
    return error(HttpStatus.NOT_FOUND, "Endpoint not found", Map.of());
  }

  @ExceptionHandler(AccessDeniedException.class)
  ResponseEntity<ErrorResponse> forbidden(Exception e) {
    return error(HttpStatus.FORBIDDEN, "Access denied", Map.of());
  }

  @ExceptionHandler(org.springframework.web.HttpMediaTypeNotSupportedException.class)
  ResponseEntity<ErrorResponse> mediaType(Exception e) {
    return error(
        HttpStatus.UNSUPPORTED_MEDIA_TYPE,
        "Use the supported content type for this endpoint",
        Map.of());
  }

  @ExceptionHandler(org.springframework.web.HttpRequestMethodNotSupportedException.class)
  ResponseEntity<ErrorResponse> method(
      org.springframework.web.HttpRequestMethodNotSupportedException e) {
    var methods = e.getSupportedHttpMethods();
    return ResponseEntity.status(HttpStatus.METHOD_NOT_ALLOWED)
        .allow(methods == null ? new HttpMethod[0] : methods.toArray(HttpMethod[]::new))
        .body(new ErrorResponse("Method not supported for this endpoint", Map.of(), Instant.now()));
  }

  @ExceptionHandler(jakarta.validation.ConstraintViolationException.class)
  ResponseEntity<ErrorResponse> constraint(Exception e) {
    return error(HttpStatus.BAD_REQUEST, "Invalid request parameters", Map.of());
  }

  @ExceptionHandler(Exception.class)
  ResponseEntity<ErrorResponse> unexpected(Exception e) {
    log.error("Unexpected request failure: {}", e.getClass().getSimpleName());
    return error(
        HttpStatus.INTERNAL_SERVER_ERROR, "Something went wrong. Please try again", Map.of());
  }
}
