package com.honeybee.shop;

import static org.assertj.core.api.Assertions.*;

import com.honeybee.shop.exception.ApiException;
import com.honeybee.shop.service.ImageService;
import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import javax.imageio.ImageIO;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockMultipartFile;

class ImageValidationTest {
  ImageService images = new ImageService("", "", "");

  @Test
  void acceptsActualPngContent() throws Exception {
    var out = new ByteArrayOutputStream();
    ImageIO.write(new BufferedImage(3, 3, BufferedImage.TYPE_INT_RGB), "png", out);
    var file = new MockMultipartFile("images", "test.png", "image/png", out.toByteArray());
    assertThat(images.validate(file)).isEqualTo(out.toByteArray());
  }

  @Test
  void rejectsExecutableDisguisedAsPng() {
    assertThatThrownBy(
            () ->
                images.validate(
                    new MockMultipartFile(
                        "images", "bad.png", "image/png", "not an image".getBytes())))
        .isInstanceOf(ApiException.class);
  }

  @Test
  void rejectsMimeMismatch() throws Exception {
    var out = new ByteArrayOutputStream();
    ImageIO.write(new BufferedImage(3, 3, BufferedImage.TYPE_INT_RGB), "png", out);
    assertThatThrownBy(
            () ->
                images.validate(
                    new MockMultipartFile("images", "fake.jpg", "image/jpeg", out.toByteArray())))
        .isInstanceOf(ApiException.class);
  }

  @Test
  void rejectsOversizeAndUnsupportedFormats() {
    assertThatThrownBy(
            () ->
                images.validate(
                    new MockMultipartFile(
                        "images", "huge.png", "image/png", new byte[8 * 1024 * 1024 + 1])))
        .isInstanceOf(ApiException.class);
    assertThatThrownBy(
            () ->
                images.validate(
                    new MockMultipartFile(
                        "images", "script.svg", "image/svg+xml", "<svg/>".getBytes())))
        .isInstanceOf(ApiException.class);
  }
}
