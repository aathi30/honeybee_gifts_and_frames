package com.honeybee.shop.dto.request;

import jakarta.validation.constraints.*;

public record SettingsRequest(
    @NotBlank @Size(max = 120) String shopName,
    @NotNull
        @Pattern(
            regexp = "^$|^[1-9][0-9]{6,14}$",
            message = "Use international digits without + or spaces")
        String whatsappNumber,
    @NotNull @Size(max = 40) String phoneNumber,
    @NotNull @Size(max = 1000) String address,
    @NotNull @Size(max = 500) String openingHours,
    @NotNull
        @Size(max = 500)
        @Pattern(regexp = "^$|^https://[^\\s]+$", message = "Use an HTTPS URL")
        String facebookUrl,
    @NotNull
        @Size(max = 500)
        @Pattern(regexp = "^$|^https://[^\\s]+$", message = "Use an HTTPS URL")
        String instagramUrl,
    @NotNull
        @Size(max = 500)
        @Pattern(regexp = "^$|^https://[^\\s]+$", message = "Use an HTTPS URL")
        String mapsUrl,
    @NotBlank @Size(max = 200) String heroTitle,
    @NotBlank @Size(max = 500) String heroSubtitle) {}
