# Honeybee REST API

Base URL: /api. Successful requests return DTO JSON directly; paginated endpoints return a stable page object. There is no ordering, payment or customer account API.

## Authentication and browser sessions

1. GET /api/auth/csrf. The response contains token and headerName (X-CSRF-TOKEN), and the browser receives an HTTP-only session cookie.
2. POST /api/auth/login with JSON username/password, that cookie and the returned CSRF header.
3. Login rotates the session ID and clears the previous CSRF token. Fetch a fresh token before the next write.
4. Send cookies on subsequent calls. GET /api/auth/me returns only the admin username, or 401.
5. POST /api/auth/logout with a fresh CSRF token invalidates the session and returns 204.

Sessions expire after 30 minutes of inactivity and are stored in PostgreSQL. All POST, PUT and DELETE requests require CSRF, including login and logout. Never disable CSRF to make an integration work. The Axios client fetches a fresh token before every write. Credentials are not stored in browser storage.

Login is limited to 10 attempts per client IP in a 15-minute window, including successful attempts. The database stores an IP hash, counter and expiry; limits survive service restarts and are shared by instances. The reverse proxy must overwrite untrusted forwarded headers so the application sees a trustworthy client address. Keep the Java service behind the intended ingress.

## Public endpoints

| Method | Path | Response |
| --- | --- | --- |
| GET | /frames | Paginated frames. |
| GET | /frames/{id} | One frame with all images. |
| GET | /frames/featured | Paginated featured frames. |
| GET | /frames/search?keyword=... | Paginated matching frames. |
| GET | /categories | Category array. |
| GET | /categories/{slug}/frames | Paginated frames in that category. |
| GET | /settings/public | Public contact and homepage settings. |
| GET | /health | Health status without internal details. |

Catalog query parameters: categoryId (optional database ID), keyword (case-insensitive frame name search, maximum 180 characters), sort (newest, price-asc or price-desc), page (zero-based, default 0), and size (1–48, default 12; featured default 8). Sort ties use descending frame ID for stable pagination. Search treats %, _ and ! as literal characters. Unavailable frames remain publicly visible with their availability status.

Example page response (illustrative, never seeded into the real catalog):

    {
      "content": [
        {
          "id": 1,
          "name": "Example Wooden Frame",
          "slug": "example-wooden-frame",
          "description": "A sample frame description",
          "price": 2500.00,
          "size": "8 x 12 inches, 10 x 12 inches",
          "available": true,
          "featured": true,
          "category": {
            "id": 1,
            "name": "Wooden Frames",
            "slug": "wooden-frames-example",
            "description": "Natural finishes",
            "imageUrl": null
          },
          "images": [{ "id": 1, "imageUrl": "https://res.cloudinary.com/YOUR_CLOUD/image/upload/YOUR_IMAGE.png", "displayOrder": 0 }],
          "createdAt": "2026-10-13T00:00:00Z"
        }
      ],
      "page": 0,
      "size": 12,
      "totalElements": 1,
      "totalPages": 1
    }

Database entities are not serialized to clients. Admin records, password hashes, Cloudinary credentials and image public IDs are never returned by public catalog endpoints.

## Admin endpoints

Every endpoint below requires ROLE_ADMIN independently of the frontend route guard.

| Method | Path | Request | Success |
| --- | --- | --- | --- |
| GET | /admin/dashboard | — | 200 catalog counts and recent frames. |
| POST | /admin/frames | Multipart frame JSON part and images file parts. | 201 frame DTO. |
| PUT | /admin/frames/{id} | Frame JSON. | 200 frame DTO. |
| DELETE | /admin/frames/{id} | — | 204. |
| POST | /admin/frames/{id}/images | Multipart images file parts. | 200 updated frame DTO. |
| DELETE | /admin/frames/{id}/images/{imageId} | — | 204. |
| POST | /admin/categories | Multipart category JSON and optional image. | 201 category DTO. |
| PUT | /admin/categories/{id} | Multipart category JSON and optional image; removeImage=true optionally. | 200 category DTO. |
| DELETE | /admin/categories/{id} | — | 204 for an empty category. |
| GET | /admin/settings | — | 200 settings DTO. |
| PUT | /admin/settings | Settings JSON. | 200 updated settings DTO. |

### Frame request

    {
      "name": "Example Wooden Frame",
      "description": "A sample description",
      "categoryId": 1,
      "price": "2500.00",
      "size": "8 x 12 inches",
      "available": true,
      "featured": false
    }

Name, category ID, price and size are required. Description is a string (empty permitted). Price must be positive, at most ten integer digits and two decimal places; the Java field is BigDecimal and PostgreSQL stores NUMERIC(12,2). A frame supports up to eight images, with at least one required at creation. The first image in display order is the main image. Comma-separated sizes are selectable on the detail page; this model has one listed price per frame.

For frame creation, send the JSON above in a multipart part called frame with Content-Type: application/json, and one or more file parts named images. Do not stringify a JSON part with text/plain; Spring's JSON converter needs the correct part content type. Do not set the overall multipart Content-Type manually: your client must include its generated boundary.

Update uses application/json. Additional images are uploaded separately. In the edit UI, metadata is saved first; if a subsequent image upload fails, the UI clearly reports that the details were saved and the images need to be retried. Remove an existing image only after saving a replacement if it is the last image.

### Category request

    { "name": "Wooden Frames", "description": "Natural finishes" }

Use a multipart category JSON part with Content-Type: application/json, plus an optional image file part. Category names must be unique ignoring case. Slugs are generated once and remain stable after renaming. Uploading a replacement image queues the old image for cleanup. Set removeImage=true on the PUT query to remove the existing image without replacement. A non-empty category returns 409 on deletion.

### Settings request/response

    {
      "shopName": "Honeybee Frame Shop",
      "whatsappNumber": "",
      "phoneNumber": "",
      "address": "",
      "openingHours": "",
      "facebookUrl": "",
      "instagramUrl": "",
      "mapsUrl": "",
      "heroTitle": "Make memories feel at home.",
      "heroSubtitle": "Find a home for your favourite moment."
    }

Leave unconfigured contact fields empty. WhatsApp is international digits only, 7–15 digits, starting with 1–9. External URLs are empty or HTTPS. All contact details are public. The map URL is an additional configurable field beyond the brief's base schema.

## Image validation and transactions

JPEG and PNG only; maximum 8 MB per image, 65 MB per multipart request, eight images per frame, maximum 25 megapixels and 10,000 pixels per side. Backend validation checks MIME type, decoded image format, dimensions and actual decodability. SVG and arbitrary renamed files are rejected. Cloudinary public IDs use generated UUIDs; credentials remain exclusively in the backend environment.

The database transaction attaches all images together. A failed upload batch queues completed uploads for cleanup; a transaction rollback also queues uploads for cleanup. Deletion jobs commit with the catalog change and are retried asynchronously. Frame mutation locks serialize competing image changes. A Cloudinary outage never causes an image URL to be removed prematurely during upload.

## Errors

    {
      "message": "Please check the highlighted fields",
      "errors": { "price": "must be greater than or equal to 0.01" },
      "timestamp": "2026-10-13T00:00:00Z"
    }

| Status | Meaning |
| --- | --- |
| 400 | Invalid JSON/parameters/fields/image content. |
| 401 | Missing/expired admin session or invalid credentials. |
| 403 | Missing/invalid CSRF or unauthorized role. |
| 404 | Missing resource. |
| 409 | Duplicate category, non-empty category deletion, or last-image removal. |
| 405 | Unsupported HTTP method (with Allow header). |
| 413 | Multipart size exceeded. |
| 415 | Unsupported request/part content type. |
| 429 | Login limit reached; Retry-After: 900. |
| 502 | Cloudinary upload failed. |
| 503 | Cloudinary is not configured. |
| 500 | Unexpected failure; no stack trace or secrets returned. |

Security filter errors use the same message/errors fields, without a timestamp. Every successful deletion/logout returns an empty 204 response. Unrecognized paths are denied by the security configuration.

## Postman

Import Honeybee.postman_collection.json. Set baseUrl and your admin username/password locally in Postman. Do not export a collection containing real credentials. The collection fetches a CSRF token automatically before each unsafe request and uses the cookie jar. Create a category before creating a frame; creation requests save their IDs for subsequent requests. Select your own local image files for multipart requests. Each request includes an illustrative response.

## Reference choices

The session/CSRF flow follows [Spring Security's CSRF guidance](https://docs.spring.io/spring-security/reference/servlet/exploits/csrf.html). Java image integration uses the [Cloudinary Java SDK](https://cloudinary.com/documentation/java_integration).
