package com.honeybee.shop.service;

import com.honeybee.shop.entity.ImageCleanupJob;
import com.honeybee.shop.repository.ImageCleanupJobRepository;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.PageRequest;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.*;

@Service
@RequiredArgsConstructor
public class ImageCleanupService {
  private static final Logger log = LoggerFactory.getLogger(ImageCleanupService.class);
  private final ImageCleanupJobRepository jobs;
  private final ImageService images;

  @Transactional
  public void enqueue(String publicId) {
    if (publicId != null && !publicId.isBlank()) {
      var job = new ImageCleanupJob();
      job.setPublicId(publicId);
      jobs.save(job);
    }
  }

  @Transactional(propagation = Propagation.REQUIRES_NEW)
  public void compensate(String publicId) {
    enqueue(publicId);
  }

  @Scheduled(fixedDelay = 60000, initialDelay = 60000)
  public void clean() {
    for (var job : jobs.findAll(PageRequest.of(0, 50))) {
      try {
        images.delete(job.getPublicId());
        jobs.deleteById(job.getId());
      } catch (Exception e) {
        log.warn("Cloud image cleanup deferred for job {}", job.getId());
      }
    }
  }
}
