# Honeybee Frames & Gifts — Windows localhost setup

A React/Vite storefront and Java 21/Spring Boot API with PostgreSQL, a private administrator dashboard, Cloudinary images, and WhatsApp enquiries. Customers do not need accounts; there is no cart, payment system, or order database.

Run the frontend at **http://localhost:5173**, the backend at **http://localhost:8080**, and your installed PostgreSQL at **localhost:5432**. Open **http://localhost:5173/login** for administration. All existing pages, styling, APIs, security, migrations, and admin features are preserved.

## Frames and gifts

The shop has separate frame and gift catalogs. The customer navbar includes **All Frames** (`/frames`) and **All Gifts** (`/gifts`). Gift browsing supports database categories, name search, price sorting, pagination and availability. Gift details (`/gifts/:id`) include an image gallery and a WhatsApp message with the actual gift name, category, LKR price and product link. The homepage displays featured gifts below featured frames, and `/categories` separates Frame Categories from Gift Categories.

In the admin dashboard, **Add Gift** appears beside the existing frame button. Use `/admin/gift-categories` to create categories first, then `/admin/gifts/add` to add a gift with a name, description, category, positive LKR price, one to eight images, availability and optional homepage featuring. Use `/admin/gifts` to view, search, edit or delete gifts. The edit form (`/admin/gifts/edit/:id`) supports uploading and removing images. At least one image must remain; upload a replacement before deleting the last image. A gift category cannot be deleted while it contains gifts.

Gift categories are managed independently from frame categories and may have optional images. No categories or example products are seeded. The existing Cloudinary image service handles JPEG/PNG validation, uploads and durable cleanup for both catalogs. Each image must be under 8 MB. The existing admin login, sessions, admin management and CSRF protection apply to all gift write operations.

| Purpose | API |
| --- | --- |
| Browse, search, filter, sort | `GET /api/gifts?categoryId=&keyword=&sort=newest&page=0&size=12` |
| Gift details / featured gifts | `GET /api/gifts/{id}` / `GET /api/gifts/featured` |
| Gift categories | `GET /api/gift-categories` |
| Category's gifts | `GET /api/gift-categories/{slug}/gifts` |
| Create / update / delete gift | `POST /api/admin/gifts`, `PUT /api/admin/gifts/{id}`, `DELETE /api/admin/gifts/{id}` |
| Upload / remove gift images | `POST /api/admin/gifts/{id}/images`, `DELETE /api/admin/gifts/{id}/images/{imageId}` |
| Create / update / delete gift category | `POST /api/admin/gift-categories`, `PUT /api/admin/gift-categories/{id}`, `DELETE /api/admin/gift-categories/{id}` |

Gift creation uses multipart `gift` JSON plus repeated `images` parts; updates use JSON. Category writes use multipart `category` JSON plus optional `image`, with `removeImage=true` on updates to clear the category image. Gift JSON contains `name`, `description`, `categoryId`, `price`, `available` and `featured`; gifts have no frame-size field.

Flyway **V5__gift_catalog.sql** adds `gifts`, `gift_categories` and `gift_images` with foreign keys and indexes. It does not change existing frame, frame-image, frame-category or admin records. It updates the original default shop name to **Honeybee Frames & Gifts**, preserving a customized shop name and all contact settings. Start the backend normally to apply the migration; do not reinitialize the database or edit older migrations. No Docker or deployment setup is needed.

Run `npm.cmd test` and `npm.cmd run build` in `frontend`, and `mvn clean test` in `backend/honeybee-api`. The gift API tests use an isolated in-memory test database and mocked Cloudinary uploads. `npm.cmd run test:e2e -- e2e/gifts.spec.js` checks customer and admin gift workflows with API fixtures, including mobile layouts, category separation and WhatsApp links.

## 1. Check the installed tools

Open Windows PowerShell:

~~~powershell
Set-Location D:\Honneybee\honeybee-frame-shop
java -version
mvn -version
node --version
npm.cmd --version
Get-Service '*postgres*'
~~~

Use Java 21, Maven 3.9+, Node.js 22.12+ or compatible Node 24, and PostgreSQL 17/18. Use npm.cmd in PowerShell if npm.ps1 is blocked by your execution policy.

On this computer Java and Maven are already available, and PostgreSQL 18 is installed in C:\Program Files\PostgreSQL\18. If a new terminal cannot find them, add the installed bin folders for this terminal:

~~~powershell
$env:JAVA_HOME = 'C:\jdk-21'
$env:Path = 'C:\jdk-21\bin;C:\apache-maven-3.9.11\bin;C:\Program Files\nodejs;C:\Program Files\PostgreSQL\18\bin;' + $env:Path
~~~

## 2. Start the existing Windows PostgreSQL service

~~~powershell
Get-Service '*postgres*'
# Only if the service is stopped; run this command in an Administrator terminal:
Start-Service -Name 'postgresql-x64-18'
# Confirm the database port:
Test-NetConnection localhost -Port 5432
~~~

Use the service name shown by Get-Service if your version is different. On inspection, postgresql-x64-18 was already running on port 5432. Do not initialize a new cluster over the existing installation or delete its data directory.

### Create the application database in pgAdmin 4, only if missing

1. Open pgAdmin 4 and connect to your existing PostgreSQL server at localhost, port 5432. Use the database administrator login chosen when PostgreSQL was installed, usually postgres. A pgAdmin master password is separate from a PostgreSQL login password.
2. Expand Login/Group Roles. If a role named honeybee already exists, use its actual password and permissions; do not recreate it. Otherwise, right-click Login/Group Roles → Create → Login/Group Role. Set Name to honeybee, choose a unique password under Definition, and enable Can login under Privileges. Leave superuser and role-creation permissions off.
3. Expand Databases. If honeybee exists, keep it and its contents. Otherwise, right-click Databases → Create → Database; set Database to honeybee and Owner to honeybee. Use UTF8 encoding.
4. If connecting to an existing honeybee database, ask its administrator to ensure the application role owns the application tables and can use/create objects in the public schema. Do not change another application's ownership blindly.

The application role needs CONNECT to the database and USAGE/CREATE on the application schema for Flyway, plus access to its own tables and sequences. For a newly created dedicated database owned by honeybee, these are normally available already. Flyway applies the five migration versions automatically; do not manually import the SQL files first.

**If you do not know the PostgreSQL password:** use an existing working pgAdmin connection to have the database administrator set a password for the dedicated honeybee role. If no working administrator login exists, recover that login with the person who installed PostgreSQL. No password reset or authentication bypass has been performed by this project.

## 3. Configure backend environment variables

~~~powershell
Set-Location D:\Honneybee\honeybee-frame-shop
# Copy only when .env does not already exist:
if (-not (Test-Path .\backend\honeybee-api\.env)) {
    Copy-Item .\backend\honeybee-api\.env.example .\backend\honeybee-api\.env
}
notepad .\backend\honeybee-api\.env
~~~

Enter your actual database login. Do not wrap values in quotation marks; Import-Env.ps1 reads them literally. Do not paste secrets into chat or commit .env.

| Variable | Local value / purpose |
| --- | --- |
| DATABASE_URL | jdbc:postgresql://localhost:5432/honeybee |
| DATABASE_USERNAME | honeybee, or your existing dedicated application role |
| DATABASE_PASSWORD | Actual password for that role; required |
| ALLOWED_ORIGINS | http://localhost:5173,http://127.0.0.1:5173 |
| COOKIE_SECURE | false for local HTTP |
| PORT | 8080 |
| CLOUDINARY_CLOUD_NAME | Your cloud name; leave blank until configured |
| CLOUDINARY_API_KEY | Your API key; leave blank until configured |
| CLOUDINARY_API_SECRET | Your API secret; leave blank until configured |
| BOOTSTRAP_ADMIN | false during normal startup |

The default database remains honeybee. All credentials stay in environment variables. Spring Boot does not automatically read a plain .env file; the supplied PowerShell helpers import it into the current process and its children. Re-import it in every new backend terminal.

Cloudinary is still used for uploaded images. Without valid credentials, browsing, categories without images, settings, and login can work, but image uploads return a clear configuration error. Creating a frame requires at least one valid image, so configure Cloudinary before adding actual frames. Never put Cloudinary secrets in frontend variables.

Check the connection before starting Java:

~~~powershell
.\scripts\Test-Database.ps1
~~~

This is a read-only connection check. It shows the connected database/user and schema privileges, never the password. It does not apply migrations or modify catalogue data. If psql is in a different installation folder, pass -PsqlPath 'C:\your\PostgreSQL\bin\psql.exe'.

## 4. Build the backend and initialize your administrator

~~~powershell
Set-Location D:\Honneybee\honeybee-frame-shop\backend\honeybee-api
mvn clean package
Set-Location ..\..
.\scripts\Initialize-Admin.ps1
~~~

The initializer checks the database, asks for a username and email, reads the password without echoing it, then runs the non-web bootstrap profile. Use a unique password of at least 8 characters and at most 72 UTF-8 bytes. The initializer stores a BCrypt hash and exits. It refuses to initialize again when an administrator exists; use the existing account instead. Local admin defaults are configured in application.properties and can be overridden with ADMIN_USERNAME, ADMIN_EMAIL, and ADMIN_PASSWORD. There is no public registration API.

You do not need to keep ADMIN_USERNAME, ADMIN_EMAIL, or ADMIN_PASSWORD in .env. The initializer supplies and clears these variables. Do not start the regular website with the bootstrap profile.

After signing in, open **Admin Management** in the admin sidebar to search the admin list. Select **Add Admin** to open the new-account form, or **Edit** on an account to update its username, email or password. Leave the password fields empty when editing to keep the existing password. New accounts can sign in using their username or email. All administrators have the same access to the shop and admin management. Username and password changes sign out the affected account's other sessions while preserving your current session. Deleting an account signs it out and removes its access. You cannot delete your own account or the last administrator, and deletion requires confirmation.

## 5. Start Spring Boot on port 8080

In your backend terminal:

~~~powershell
Set-Location D:\Honneybee\honeybee-frame-shop
.\scripts\Test-Database.ps1
Set-Location .\backend\honeybee-api
mvn spring-boot:run
~~~

Test-Database.ps1 imports the environment into this terminal. The equivalent convenience command from the project root is:

~~~powershell
.\scripts\Start-Backend.ps1
~~~

The backend remains in the foreground. Wait for the Started HoneybeeApplication message. Flyway validates/applies migrations and Hibernate validates the schema. Existing migrations and database-backed sessions remain enabled.

To run the built JAR instead:

~~~powershell
Set-Location D:\Honneybee\honeybee-frame-shop
.\scripts\Import-Env.ps1 -Path .\backend\honeybee-api\.env
java -jar .\backend\honeybee-api\target\honeybee-api-1.0.0.jar
~~~

## 6. Start React on port 5173

Open a second PowerShell terminal:

~~~powershell
Set-Location D:\Honneybee\honeybee-frame-shop\frontend
if (-not (Test-Path .env)) { Copy-Item .env.example .env }
npm.cmd ci
npm.cmd run dev
Start-Process 'http://localhost:5173'
~~~

The frontend .env contains only VITE_API_BASE_URL=/api. Vite proxies /api to http://localhost:8080, including session cookies. The development server uses port 5173 and fails clearly if that port is occupied instead of silently changing ports. Both http://localhost:5173 and http://127.0.0.1:5173 are allowed for local login. Keep using the same hostname during a session because each hostname has separate cookies.

Open http://localhost:5173/login and sign in with the account you initialized. Add your real shop contact information in settings. Add categories, configure Cloudinary, then add real products. A fresh database has an empty catalogue and blank contact details; this is expected.

## 7. Check the APIs and website

In another terminal:

~~~powershell
Invoke-RestMethod http://localhost:8080/api/health
Invoke-RestMethod http://localhost:8080/api/categories
Invoke-RestMethod 'http://localhost:8080/api/frames?page=0&size=12'
Invoke-RestMethod http://localhost:8080/api/settings/public
# Confirm the frontend proxy also reaches the backend:
Invoke-RestMethod http://localhost:5173/api/health
~~~

Health should report UP. Empty categories and frame content are correct before you add products. Import docs/Honeybee.postman_collection.json into Postman for authentication and admin requests; it obtains CSRF tokens automatically. Its base URL is http://localhost:8080/api.

Check login/logout, creating/editing/deleting categories, settings, and frame CRUD after image storage is configured. In the storefront, select a frame size and check that the WhatsApp link contains the product, selected size, LKR price, and page URL. Enter an international WhatsApp number as digits only in settings before using ordering.

Security remains active: unauthenticated admin APIs return 401, writes without CSRF return 403, cookies are HTTP-only with SameSite=Lax, and sessions persist in PostgreSQL. A frame's last image and a category containing frames cannot be deleted. Remote image cleanup retries through the existing persistent queue.

## 8. Troubleshoot the HikariPool / Flyway connection error

The original startup was reproduced. Its root exception was:

    org.postgresql.util.PSQLException:
    FATAL: password authentication failed for user "honeybee"
    SQL State: 28P01

The installed PostgreSQL server log also confirms: DETAIL: Role "honeybee" does not exist. No DATABASE_PASSWORD was configured in a local .env or the inspected environment. PostgreSQL itself was running and listening on 5432. The application login must be created by a PostgreSQL administrator and its password configured; changing the file format does not fix this. The existence of the honeybee database remains unverified without an administrator login.

1. Run scripts/Test-Database.ps1. If it says a value is missing, fill backend/honeybee-api/.env and rerun it.
2. If psql reports password authentication failed, check DATABASE_USERNAME and the actual PostgreSQL password with the database administrator. The server log confirms that the configured honeybee role is absent; create it using the pgAdmin steps above or configure an existing dedicated application role.
3. If it reports database does not exist, create honeybee in pgAdmin only if absent.
4. If it reports connection refused, check Get-Service '*postgres*' and Test-NetConnection localhost -Port 5432.
5. If it reports permission denied for schema public, have the database administrator grant the dedicated application role the required schema/table ownership and privileges.
6. If Flyway reports a checksum mismatch or a nonempty schema without history, keep the data and migration history and investigate the exact error. Do not disable Flyway, use clean, or recreate the database to hide it.

To save startup output, after importing the environment:

~~~powershell
mvn spring-boot:run 2>&1 | Tee-Object -FilePath .\backend-startup.log
Get-Content .\backend-startup.log -Tail 100
~~~

Inspect the deepest Caused by message. Do not share passwords or full secret-bearing environment output.

## 9. Run tests without containers

~~~powershell
Set-Location D:\Honneybee\honeybee-frame-shop\frontend
npm.cmd test
npm.cmd run build
Set-Location ..\backend\honeybee-api
mvn test
~~~

The default backend suite runs H2/API and image/rate-limit checks. The original optional container test source is preserved but excluded from default local execution. The installed PostgreSQL contract suite runs only when HONEYBEE_TEST_JDBC_URL is set.

For actual PostgreSQL verification, create a **separate disposable** honeybee_test database in pgAdmin, owned by a dedicated test role. The test suite deletes catalogue records during setup: do not point it at your honeybee database.

~~~powershell
$env:HONEYBEE_TEST_JDBC_URL = 'jdbc:postgresql://localhost:5432/honeybee_test'
$env:HONEYBEE_TEST_DB_USERNAME = Read-Host 'Dedicated test database username'
$testPassword = Read-Host 'Dedicated test database password' -AsSecureString
$testPointer = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($testPassword)
try {
    $env:HONEYBEE_TEST_DB_PASSWORD = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($testPointer)
    mvn '-Dtest=ApiIntegrationTest,ImageValidationTest,LoginRateLimitTest,LocalPostgresIntegrationTest' test
} finally {
    [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($testPointer)
    Remove-Item Env:HONEYBEE_TEST_DB_PASSWORD -ErrorAction SilentlyContinue
}
~~~

Browser tests require installed Google Chrome and a backend connected to an empty, separate QA database on port 8080:

~~~powershell
Set-Location D:\Honneybee\honeybee-frame-shop\frontend
npm.cmd run test:e2e
~~~

The admin browser test requires HONEYBEE_QA_USERNAME/HONEYBEE_QA_PASSWORD for an account initialized only in that QA database. Without them it is explicitly skipped. Browser tests create/delete test categories and expect empty contacts/catalogue; never use your real shop database. Cloudinary network operations are mocked in backend tests; live uploads require your configured account.

## 10. Stop the applications

Press Ctrl+C in the frontend terminal and Ctrl+C in the backend terminal. PostgreSQL can remain running. If you deliberately want to stop the Windows database service after closing applications that use it, run in an Administrator terminal:

~~~powershell
Stop-Service -Name 'postgresql-x64-18'
~~~

Stopping the service does not delete data. Do not kill unknown Java, Node, or PostgreSQL processes.

## Project structure and configuration

~~~text
honeybee-frame-shop/
  README.md
  frontend/
    .env.example
    vite.config.js
    playwright.config.js
    package.json, package-lock.json
    public/images/
    src/components/, pages/, admin/, context/, services/, utils/, test/
    e2e/
  backend/honeybee-api/
    .env.example
    pom.xml
    src/main/java/com/honeybee/shop/
    src/main/resources/
      application.properties
      application-bootstrap.properties
      db/migration/V1...V5.sql
    src/test/java/com/honeybee/shop/
    src/test/resources/
      application-test.properties
      application-postgres-test.properties
  scripts/
    Import-Env.ps1
    Test-Database.ps1
    Initialize-Admin.ps1
    Start-Backend.ps1
  docs/
    API_DOCUMENTATION.md
    Honeybee.postman_collection.json
    ASSETS.md
~~~

Database migrations live in backend/honeybee-api/src/main/resources/db/migration. Bootstrap properties override base properties only for the bootstrap profile. Test overrides live in test resources only. Environment variables and explicit command-line properties retain normal Spring Boot precedence.

Browser tests generate screenshots in docs/screenshots and results in frontend/test-results. These generated files are excluded from version control.

See [API documentation](docs/API_DOCUMENTATION.md) and [image source information](docs/ASSETS.md).
