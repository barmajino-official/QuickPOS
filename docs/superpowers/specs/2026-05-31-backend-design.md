# Backend Design — QuickPOS Pro

**Date:** 2026-05-31  
**Stack:** .NET 10 · EF Core 9 + Npgsql · JWT Bearer · BCrypt.Net-Next · Swagger  
**Database:** PostgreSQL 15 — schema owned by `database.sql`, no EF migrations

---

## 1. Project Structure

```
backend/
├── Controllers/
│   ├── AuthController.cs
│   ├── CategoriesController.cs
│   ├── CustomersController.cs
│   ├── DashboardController.cs
│   ├── OrdersController.cs
│   ├── ProductsController.cs
│   └── StaffController.cs
├── Data/
│   └── AppDbContext.cs
├── Models/
│   ├── AuthUser.cs
│   ├── Category.cs
│   ├── Customer.cs
│   ├── Order.cs
│   ├── OrderItem.cs
│   ├── Product.cs
│   └── Staff.cs
├── DTOs/
│   ├── Auth/
│   ├── Categories/
│   ├── Customers/
│   ├── Dashboard/
│   ├── Orders/
│   ├── Products/
│   └── Staff/
├── Services/
│   ├── AuthService.cs
│   └── ImageService.cs
├── app.csproj
└── Program.cs
```

**Pattern:** Controllers + Service layer (Option A).  
Controllers handle HTTP routing and responses. `AuthService` owns BCrypt verification/hashing and JWT generation. `ImageService` owns file I/O for product images. EF Core `AppDbContext` injected directly into controllers for CRUD.

---

## 2. Packages

Relative to the old project — remove `Google.Apis.Auth`, add `BCrypt.Net-Next`:

```xml
<PackageReference Include="BCrypt.Net-Next" Version="4.0.3" />
<PackageReference Include="Microsoft.AspNetCore.Authentication.JwtBearer" Version="9.0.0" />
<PackageReference Include="Microsoft.AspNetCore.OpenApi" Version="9.0.0" />
<PackageReference Include="Npgsql.EntityFrameworkCore.PostgreSQL" Version="9.0.0" />
<PackageReference Include="Microsoft.EntityFrameworkCore" Version="9.0.0" />
<PackageReference Include="Microsoft.EntityFrameworkCore.Design" Version="9.0.0" />
<PackageReference Include="Swashbuckle.AspNetCore" Version="6.6.2" />
```

---

## 3. Authentication & JWT

### Endpoints

| Method | Route | Access | Behaviour |
|---|---|---|---|
| POST | `/api/auth/login` | public | BCrypt verify → return JWT + staff profile |
| POST | `/api/auth/register` | public | 403 if any staff exist; creates `auth.users` + `public.staff` (Admin, all permissions true) |
| GET | `/api/auth/me` | JWT | Returns staff profile from `sub` claim |
| POST | `/api/auth/test-token` | dev header | Dev env only; `X-Dev-Auth-Token` header; returns JWT without password check |

### JWT Claims

```
sub         → staff.id (uuid)
email       → staff.email
role        → staff.role
permissions → JSON-serialised Dictionary<string, bool>
```

Expiry: **8 hours** (env: `JwtSettings__ExpiryHours`).  
Signing key: env `JwtSettings__Secret`.  
Dev bypass token: env `JwtSettings__DevAuthToken`.

### Password hashing

BCrypt via `BCrypt.Net-Next`. `auth.users.encrypted_password` stores the BCrypt hash.

---

## 4. Endpoints

### Categories
| Method | Route | Notes |
|---|---|---|
| GET | `/api/categories` | All categories |
| POST | `/api/categories` | Create |
| PUT | `/api/categories/{id}` | Update |
| DELETE | `/api/categories/{id}` | Delete |

### Products
| Method | Route | Notes |
|---|---|---|
| GET | `/api/products` | Optional `?categoryId=` filter |
| POST | `/api/products` | JSON body |
| PUT | `/api/products/{id}` | Update |
| DELETE | `/api/products/{id}` | Deletes image file too |
| POST | `/api/products/{id}/image` | `multipart/form-data`; saves to `./uploads/`; returns URL |

### Customers
| Method | Route | Notes |
|---|---|---|
| GET | `/api/customers` | Optional `?search=` (name/email/phone) |
| POST | `/api/customers` | Create |
| PUT | `/api/customers/{id}` | Update |
| DELETE | `/api/customers/{id}` | Delete |

### Orders
| Method | Route | Notes |
|---|---|---|
| GET | `/api/orders` | Joins customer + staff names |
| GET | `/api/orders/{id}` | Includes order items |
| POST | `/api/orders` | Creates order + items + decrements stock in one EF transaction |
| DELETE | `/api/orders/{id}` | Delete |

### Staff
| Method | Route | Notes |
|---|---|---|
| GET | `/api/staff` | All staff |
| POST | `/api/staff` | Creates `auth.users` + `public.staff` |
| PUT | `/api/staff/{id}` | Update name/phone/role/permissions |
| DELETE | `/api/staff/{id}` | Deletes from both tables |

### Dashboard
| Method | Route | Notes |
|---|---|---|
| GET | `/api/dashboard` | All stats in one response |

Dashboard response shape:
- `todayRevenue`, `todayOrderCount`, `totalProducts`, `totalCustomers`
- `lowStockProducts` — stock ≤ 5
- `expiringSoon` — expiry_date within 7 days
- `topProducts` — top 5 by total quantity sold
- `topStaff` — top 5 by order count

---

## 5. Data Access — EF Core

**No migrations.** Schema is managed exclusively by `database.sql`.

### Schema mapping

```csharp
modelBuilder.Entity<AuthUser>().ToTable("users", "auth");
modelBuilder.Entity<Staff>().ToTable("staff", "public");
modelBuilder.Entity<Category>().ToTable("categories", "public");
modelBuilder.Entity<Product>().ToTable("products", "public");
modelBuilder.Entity<Customer>().ToTable("customers", "public");
modelBuilder.Entity<Order>().ToTable("orders", "public");
modelBuilder.Entity<OrderItem>().ToTable("order_items", "public");
```

### Permissions column

`staff.permissions` is `jsonb`. Mapped as `Dictionary<string, bool>` in C# using a value converter (`System.Text.Json` serialise/deserialise).

### Connection string fix

`docker-compose.yml` has the wrong port in the connection string (`Port=9001` is the host-side port; inside the Docker network the DB is on `5432`):

```
Host=db;Port=5432;Database=pos_iul_db;Username=pos_iul_user;Password=pos_iul_password
```

---

## 6. Image Uploads

- `POST /api/products/{id}/image` accepts `multipart/form-data`.
- `ImageService` saves the file to the path from env `Uploads__Path` (`/app/uploads` in Docker).
- Returns the public URL: `/uploads/<filename>`.
- Stored in `products.image_url`.
- Static files middleware maps `/uploads` → `Uploads__Path`.
- `DELETE /api/products/{id}` deletes the file from disk if `image_url` is set.

---

## 7. CORS

Allow origin `http://localhost:9003` (frontend Vite dev server) with all headers and methods.  
Policy name: `"FrontendDev"`.

---

## 8. Program.cs wiring order

1. Add DbContext (Npgsql)
2. Add AuthService, ImageService (scoped)
3. Add JWT Bearer authentication
4. Add Authorization
5. Add Controllers
6. Add Swagger (dev only)
7. Add CORS policy
8. `app.UseCors` → `app.UseAuthentication` → `app.UseAuthorization`
9. `app.UseStaticFiles` for uploads
10. `app.MapControllers`
