package com.honeybee.shop.controller;

import com.honeybee.shop.dto.response.*;
import com.honeybee.shop.service.*;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class GiftPublicController {
  private final GiftCatalogService catalog;

  @GetMapping("/gifts")
  public PageResponse<GiftResponse> gifts(
      @RequestParam(required = false) Long categoryId,
      @RequestParam(required = false) String keyword,
      @RequestParam(defaultValue = "newest") String sort,
      @RequestParam(defaultValue = "0") int page,
      @RequestParam(defaultValue = "12") int size) {
    return catalog.list(categoryId, keyword, sort, page, size, null);
  }

  @GetMapping("/gifts/{id}")
  public GiftResponse gift(@PathVariable Long id) {
    return catalog.detail(id);
  }

  @GetMapping("/gifts/featured")
  public PageResponse<GiftResponse> featured(
      @RequestParam(defaultValue = "0") int page, @RequestParam(defaultValue = "8") int size) {
    return catalog.list(null, null, "newest", page, size, true);
  }

  @GetMapping("/gifts/search")
  public PageResponse<GiftResponse> search(
      @RequestParam String keyword,
      @RequestParam(required = false) Long categoryId,
      @RequestParam(defaultValue = "newest") String sort,
      @RequestParam(defaultValue = "0") int page,
      @RequestParam(defaultValue = "12") int size) {
    return catalog.list(categoryId, keyword, sort, page, size, null);
  }

  @GetMapping("/gift-categories")
  public List<GiftCategoryResponse> giftCategories() {
    return catalog.giftCategories();
  }

  @GetMapping("/gift-categories/{slug}/gifts")
  public PageResponse<GiftResponse> categoryGifts(
      @PathVariable String slug,
      @RequestParam(required = false) String keyword,
      @RequestParam(defaultValue = "newest") String sort,
      @RequestParam(defaultValue = "0") int page,
      @RequestParam(defaultValue = "12") int size) {
    return catalog.categoryGifts(slug, keyword, sort, page, size);
  }

}
