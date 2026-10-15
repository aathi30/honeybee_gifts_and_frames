package com.honeybee.shop.service;

import com.cloudinary.Cloudinary;
import com.honeybee.shop.exception.ApiException;
import java.io.*;
import java.util.*;
import javax.imageio.ImageIO;
import javax.imageio.ImageReader;
import javax.imageio.stream.ImageInputStream;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

@Service
public class ImageService {
  public record UploadedImage(String url, String publicId) {}

  private final Cloudinary cloudinary;
  private final boolean configured;

  public ImageService(
      @Value("$" + "{cloudinary.cloud-name}") String name,
      @Value("$" + "{cloudinary.api-key}") String key,
      @Value("$" + "{cloudinary.api-secret}") String secret) {
    configured = !name.isBlank() && !key.isBlank() && !secret.isBlank();
    cloudinary =
        new Cloudinary(
            Map.of("cloud_name", name, "api_key", key, "api_secret", secret, "secure", true));
  }

  public byte[] validate(MultipartFile file) {
    if (file == null || file.isEmpty() || file.getSize() > 8L * 1024 * 1024)
      throw ApiException.badRequest("Choose a non-empty image under 8 MB");
    if (!Set.of("image/jpeg", "image/png").contains(Objects.toString(file.getContentType(), "")))
      throw ApiException.badRequest("Only JPEG and PNG images are supported");
    try {
      byte[] bytes = file.getBytes();
      try (ImageInputStream input =
          ImageIO.createImageInputStream(new ByteArrayInputStream(bytes))) {
        Iterator<ImageReader> readers = ImageIO.getImageReaders(input);
        if (!readers.hasNext()) throw ApiException.badRequest("File is not a valid image");
        ImageReader reader = readers.next();
        try {
          reader.setInput(input);
          String format = reader.getFormatName().toLowerCase(Locale.ROOT);
          if (!Set.of("jpeg", "png").contains(format)
              || !file.getContentType().equals("image/" + format))
            throw ApiException.badRequest("Image content does not match its file type");
          int width = reader.getWidth(0), height = reader.getHeight(0);
          if (width < 1
              || height < 1
              || width > 10000
              || height > 10000
              || (long) width * height > 25000000)
            throw ApiException.badRequest(
                "Image dimensions exceed 25 megapixels or 10,000 pixels per side");
          if (reader.read(0) == null) throw ApiException.badRequest("Image cannot be decoded");
        } finally {
          reader.dispose();
        }
      }
      return bytes;
    } catch (IOException e) {
      throw ApiException.badRequest("Image cannot be decoded");
    }
  }

  public UploadedImage upload(MultipartFile file) {
    byte[] bytes = validate(file);
    if (!configured)
      throw new ApiException(
          HttpStatus.SERVICE_UNAVAILABLE,
          "Image storage is not configured. Set the Cloudinary environment variables");
    try {
      var result =
          cloudinary
              .uploader()
              .upload(
                  bytes,
                  Map.of(
                      "public_id",
                      "honeybee/" + UUID.randomUUID(),
                      "resource_type",
                      "image",
                      "overwrite",
                      false));
      return new UploadedImage((String) result.get("secure_url"), (String) result.get("public_id"));
    } catch (IOException e) {
      throw new ApiException(HttpStatus.BAD_GATEWAY, "Image upload failed. Please try again");
    }
  }

  public void delete(String publicId) throws IOException {
    if (!configured) throw new IOException("Image storage unavailable");
    var result =
        cloudinary
            .uploader()
            .destroy(publicId, Map.of("resource_type", "image", "invalidate", true));
    if (!Set.of("ok", "not found").contains(result.get("result")))
      throw new IOException("Image deletion failed");
  }
}
