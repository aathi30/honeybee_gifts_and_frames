package com.honeybee.shop.service;

import com.honeybee.shop.dto.request.*;
import com.honeybee.shop.dto.response.*;
import com.honeybee.shop.entity.*;
import com.honeybee.shop.exception.ApiException;
import com.honeybee.shop.repository.*;
import jakarta.persistence.criteria.Predicate;
import java.text.Normalizer;
import java.util.*;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.*;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.*;
import org.springframework.web.multipart.MultipartFile;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class GiftCatalogService {
  private final GiftRepository gifts;
  private final GiftCategoryRepository giftCategories;
  private final ImageService images;
  private final ImageCleanupService cleanup;

  private Gift gift(Long id) {
    return gifts.findById(id).orElseThrow(() -> ApiException.notFound("Gift"));
  }

  private Gift lockedGift(Long id) {
    return gifts.findForUpdate(id).orElseThrow(() -> ApiException.notFound("Gift"));
  }

  private GiftCategory category(Long id) {
    return giftCategories.findById(id).orElseThrow(() -> ApiException.notFound("Gift category"));
  }

  private GiftCategory lockedGiftCategory(Long id) {
    return giftCategories.findForUpdate(id).orElseThrow(() -> ApiException.notFound("Gift category"));
  }

  private String slug(String name) {
    String text =
        Normalizer.normalize(name, Normalizer.Form.NFD)
            .replaceAll("[^a-zA-Z0-9 ]", "")
            .trim()
            .toLowerCase(Locale.ROOT)
            .replaceAll(" +", "-");
    return (text.isBlank() ? "item" : text) + "-" + UUID.randomUUID().toString().substring(0, 8);
  }

  public PageResponse<GiftResponse> list(
      Long categoryId, String keyword, String sort, int page, int size, Boolean featured) {
    if (page < 0 || size < 1 || size > 48)
      throw ApiException.badRequest("Page must be non-negative and size between 1 and 48");
    if (keyword != null && keyword.length() > 180)
      throw ApiException.badRequest("Search is too long");
    Sort order =
        switch (Objects.toString(sort, "newest")) {
          case "price-asc" -> Sort.by("price").ascending();
          case "price-desc" -> Sort.by("price").descending();
          case "newest" -> Sort.by("createdAt").descending();
          default -> throw ApiException.badRequest("Invalid sort option");
        };
    Specification<Gift> spec =
        (root, query, cb) -> {
          List<Predicate> terms = new ArrayList<>();
          if (categoryId != null) terms.add(cb.equal(root.get("category").get("id"), categoryId));
          if (featured != null) terms.add(cb.equal(root.get("featured"), featured));
          if (keyword != null && !keyword.isBlank()) {
            String escaped =
                keyword
                    .trim()
                    .toLowerCase(Locale.ROOT)
                    .replace("!", "!!")
                    .replace("%", "!%")
                    .replace("_", "!_");
            terms.add(cb.like(cb.lower(root.get("name")), "%" + escaped + "%", '!'));
          }
          return cb.and(terms.toArray(Predicate[]::new));
        };
    return PageResponse.from(
        gifts
            .findAll(spec, PageRequest.of(page, size, order.and(Sort.by("id").descending())))
            .map(GiftResponse::from));
  }

  public GiftResponse detail(Long id) {
    return GiftResponse.from(gift(id));
  }

  public List<GiftCategoryResponse> giftCategories() {
    return giftCategories.findAll(Sort.by("name")).stream().map(GiftCategoryResponse::from).toList();
  }

  public PageResponse<GiftResponse> categoryGifts(
      String slug, String keyword, String sort, int page, int size) {
    GiftCategory c = giftCategories.findBySlug(slug).orElseThrow(() -> ApiException.notFound("Gift category"));
    return list(c.getId(), keyword, sort, page, size, null);
  }

  private List<ImageService.UploadedImage> upload(List<MultipartFile> files) {
    if (files == null || files.isEmpty())
      throw ApiException.badRequest("At least one image is required");
    if (files.size() > 8) throw ApiException.badRequest("A gift can have at most 8 images");
    files.forEach(images::validate);
    List<ImageService.UploadedImage> uploaded = new ArrayList<>();
    try {
      for (var file : files) uploaded.add(images.upload(file));
    } catch (RuntimeException e) {
      uploaded.forEach(i -> cleanup.compensate(i.publicId()));
      throw e;
    }
    TransactionSynchronizationManager.registerSynchronization(
        new TransactionSynchronization() {
          @Override
          public void afterCompletion(int status) {
            if (status != STATUS_COMMITTED) uploaded.forEach(i -> cleanup.compensate(i.publicId()));
          }
        });
    return uploaded;
  }

  private void apply(Gift f, GiftRequest r) {
    f.setName(r.name().trim());
    f.setDescription(r.description().trim());
    f.setPrice(r.price());
    f.setCategory(category(r.categoryId()));
    f.setAvailable(r.available());
    f.setFeatured(r.featured());
  }

  private void addImages(Gift f, List<ImageService.UploadedImage> uploaded) {
    int order = f.getImages().stream().mapToInt(GiftImage::getDisplayOrder).max().orElse(-1) + 1;
    for (var item : uploaded) {
      GiftImage i = new GiftImage();
      i.setGift(f);
      i.setImageUrl(item.url());
      i.setCloudinaryPublicId(item.publicId());
      i.setDisplayOrder(order++);
      f.getImages().add(i);
    }
  }

  @Transactional
  public GiftResponse create(GiftRequest r, List<MultipartFile> files) {
    Gift f = new Gift();
    apply(f, r);
    f.setSlug(slug(r.name()));
    addImages(f, upload(files));
    return GiftResponse.from(gifts.saveAndFlush(f));
  }

  @Transactional
  public GiftResponse update(Long id, GiftRequest r) {
    Gift f = lockedGift(id);
    apply(f, r);
    return GiftResponse.from(gifts.saveAndFlush(f));
  }

  @Transactional
  public GiftResponse uploadImages(Long id, List<MultipartFile> files) {
    Gift f = lockedGift(id);
    if (files == null || f.getImages().size() + files.size() > 8)
      throw ApiException.badRequest("A gift can have at most 8 images");
    addImages(f, upload(files));
    return GiftResponse.from(gifts.saveAndFlush(f));
  }

  @Transactional
  public void removeImage(Long id, Long imageId) {
    Gift f = lockedGift(id);
    GiftImage image =
        f.getImages().stream()
            .filter(i -> i.getId().equals(imageId))
            .findFirst()
            .orElseThrow(() -> ApiException.notFound("Image"));
    if (f.getImages().size() == 1)
      throw ApiException.conflict("Upload a replacement before removing the last image");
    cleanup.enqueue(image.getCloudinaryPublicId());
    f.getImages().remove(image);
  }

  @Transactional
  public void delete(Long id) {
    Gift f = lockedGift(id);
    f.getImages().forEach(i -> cleanup.enqueue(i.getCloudinaryPublicId()));
    gifts.delete(f);
  }

  @Transactional
  public GiftCategoryResponse saveGiftCategory(
      Long id, GiftCategoryRequest r, MultipartFile file, boolean removeImage) {
    GiftCategory c = id == null ? new GiftCategory() : lockedGiftCategory(id);
    if ((id == null || !c.getName().equalsIgnoreCase(r.name().trim()))
        && giftCategories.existsByNameIgnoreCase(r.name().trim()))
      throw ApiException.conflict("A category with this name already exists");
    c.setName(r.name().trim());
    c.setDescription(r.description().trim());
    if (c.getSlug() == null) c.setSlug(slug(r.name()));
    if (file != null && !file.isEmpty()) {
      var uploaded = upload(List.of(file)).getFirst();
      cleanup.enqueue(c.getImagePublicId());
      c.setImageUrl(uploaded.url());
      c.setImagePublicId(uploaded.publicId());
    } else if (removeImage) {
      cleanup.enqueue(c.getImagePublicId());
      c.setImageUrl(null);
      c.setImagePublicId(null);
    }
    return GiftCategoryResponse.from(giftCategories.saveAndFlush(c));
  }

  @Transactional
  public void deleteGiftCategory(Long id) {
    GiftCategory c = lockedGiftCategory(id);
    if (gifts.existsByCategoryId(id))
      throw ApiException.conflict("Move or delete this category's gifts before deleting it");
    cleanup.enqueue(c.getImagePublicId());
    giftCategories.delete(c);
  }

  public Map<String, Object> statistics() {
    return Map.of(
        "totalGifts",
        gifts.count(),
        "totalCategories",
        giftCategories.count(),
        "availableGifts",
        gifts.countByAvailable(true),
        "unavailableGifts",
        gifts.countByAvailable(false),
        "recentGifts",
        list(null, null, "newest", 0, 5, null).content());
  }
}
