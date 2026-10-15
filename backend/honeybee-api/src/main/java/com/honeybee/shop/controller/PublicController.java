package com.honeybee.shop.controller;

import com.honeybee.shop.dto.response.*;
import com.honeybee.shop.service.*;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class PublicController {
  private final CatalogService catalog;
  private final SettingsService settings;

  @GetMapping("/frames")
  public PageResponse<FrameResponse> frames(
      @RequestParam(required = false) Long categoryId,
      @RequestParam(required = false) String keyword,
      @RequestParam(defaultValue = "newest") String sort,
      @RequestParam(defaultValue = "0") int page,
      @RequestParam(defaultValue = "12") int size) {
    return catalog.list(categoryId, keyword, sort, page, size, null);
  }

  @GetMapping("/frames/{id}")
  public FrameResponse frame(@PathVariable Long id) {
    return catalog.detail(id);
  }

  @GetMapping("/frames/featured")
  public PageResponse<FrameResponse> featured(
      @RequestParam(defaultValue = "0") int page, @RequestParam(defaultValue = "8") int size) {
    return catalog.list(null, null, "newest", page, size, true);
  }

  @GetMapping("/frames/search")
  public PageResponse<FrameResponse> search(
      @RequestParam String keyword,
      @RequestParam(required = false) Long categoryId,
      @RequestParam(defaultValue = "newest") String sort,
      @RequestParam(defaultValue = "0") int page,
      @RequestParam(defaultValue = "12") int size) {
    return catalog.list(categoryId, keyword, sort, page, size, null);
  }

  @GetMapping("/categories")
  public List<CategoryResponse> categories() {
    return catalog.categories();
  }

  @GetMapping("/categories/{slug}/frames")
  public PageResponse<FrameResponse> categoryFrames(
      @PathVariable String slug,
      @RequestParam(required = false) String keyword,
      @RequestParam(defaultValue = "newest") String sort,
      @RequestParam(defaultValue = "0") int page,
      @RequestParam(defaultValue = "12") int size) {
    return catalog.categoryFrames(slug, keyword, sort, page, size);
  }

  @GetMapping("/settings/public")
  public SettingsResponse settings() {
    return settings.get();
  }
}
