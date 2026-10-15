package com.honeybee.shop.controller;

import com.honeybee.shop.dto.request.*;
import com.honeybee.shop.dto.response.*;
import com.honeybee.shop.service.*;
import jakarta.validation.Valid;
import java.util.*;
import lombok.RequiredArgsConstructor;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
public class GiftAdminController {
  private final GiftCatalogService catalog;

  @PostMapping(value = "/gifts", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
  @ResponseStatus(HttpStatus.CREATED)
  public GiftResponse create(
      @Valid @RequestPart("gift") GiftRequest request,
      @RequestPart("images") List<MultipartFile> files) {
    return catalog.create(request, files);
  }

  @PutMapping("/gifts/{id}")
  public GiftResponse update(@PathVariable Long id, @Valid @RequestBody GiftRequest request) {
    return catalog.update(id, request);
  }

  @DeleteMapping("/gifts/{id}")
  @ResponseStatus(HttpStatus.NO_CONTENT)
  public void delete(@PathVariable Long id) {
    catalog.delete(id);
  }

  @PostMapping(value = "/gifts/{id}/images", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
  public GiftResponse upload(
      @PathVariable Long id, @RequestPart("images") List<MultipartFile> files) {
    return catalog.uploadImages(id, files);
  }

  @DeleteMapping("/gifts/{id}/images/{imageId}")
  @ResponseStatus(HttpStatus.NO_CONTENT)
  public void removeImage(@PathVariable Long id, @PathVariable Long imageId) {
    catalog.removeImage(id, imageId);
  }

  @PostMapping(value = "/gift-categories", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
  @ResponseStatus(HttpStatus.CREATED)
  public GiftCategoryResponse createGiftCategory(
      @Valid @RequestPart("category") GiftCategoryRequest request,
      @RequestPart(value = "image", required = false) MultipartFile image) {
    return catalog.saveGiftCategory(null, request, image, false);
  }

  @PutMapping(value = "/gift-categories/{id}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
  public GiftCategoryResponse updateGiftCategory(
      @PathVariable Long id,
      @Valid @RequestPart("category") GiftCategoryRequest request,
      @RequestPart(value = "image", required = false) MultipartFile image,
      @RequestParam(defaultValue = "false") boolean removeImage) {
    return catalog.saveGiftCategory(id, request, image, removeImage);
  }

  @DeleteMapping("/gift-categories/{id}")
  @ResponseStatus(HttpStatus.NO_CONTENT)
  public void deleteGiftCategory(@PathVariable Long id) {
    catalog.deleteGiftCategory(id);
  }

}
