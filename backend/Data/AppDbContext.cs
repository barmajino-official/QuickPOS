using System.Text.Json;
using App.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Storage.ValueConversion;

namespace App.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<AuthUser> AuthUsers => Set<AuthUser>();
    public DbSet<Staff> Staff => Set<Staff>();
    public DbSet<Category> Categories => Set<Category>();
    public DbSet<Brand> Brands => Set<Brand>();
    public DbSet<Product> Products => Set<Product>();
    public DbSet<Customer> Customers => Set<Customer>();
    public DbSet<Order> Orders => Set<Order>();
    public DbSet<OrderItem> OrderItems => Set<OrderItem>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        // ── Schema / table mapping ────────────────────────────────────
        modelBuilder.Entity<AuthUser>().ToTable("users", "auth");
        modelBuilder.Entity<Staff>().ToTable("staff", "public");
        modelBuilder.Entity<Category>().ToTable("categories", "public");
        modelBuilder.Entity<Brand>().ToTable("brands", "public");
        modelBuilder.Entity<Product>().ToTable("products", "public");
        modelBuilder.Entity<Customer>().ToTable("customers", "public");
        modelBuilder.Entity<Order>().ToTable("orders", "public");
        modelBuilder.Entity<OrderItem>().ToTable("order_items", "public");

        // ── Permissions JSONB ─────────────────────────────────────────
        modelBuilder.Entity<Staff>()
            .Property(s => s.Permissions)
            .HasColumnType("jsonb")
            .HasConversion(new ValueConverter<Dictionary<string, bool>, string>(
                v => JsonSerializer.Serialize(v, (JsonSerializerOptions?)null),
                v => JsonSerializer.Deserialize<Dictionary<string, bool>>(v, (JsonSerializerOptions?)null) ?? new()
            ));

        // ── Relationships ─────────────────────────────────────────────
        // Staff.Id is both PK and FK → auth.users.id (insert auth user first)
        modelBuilder.Entity<Staff>()
            .HasOne<AuthUser>()
            .WithMany()
            .HasForeignKey(s => s.Id)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<Product>()
            .HasOne(p => p.Category).WithMany()
            .HasForeignKey(p => p.CategoryId).OnDelete(DeleteBehavior.SetNull);

        modelBuilder.Entity<Product>()
            .HasOne(p => p.Brand).WithMany()
            .HasForeignKey(p => p.BrandId).OnDelete(DeleteBehavior.SetNull);

        modelBuilder.Entity<Order>()
            .HasOne(o => o.Customer).WithMany()
            .HasForeignKey(o => o.CustomerId).OnDelete(DeleteBehavior.SetNull);

        modelBuilder.Entity<Order>()
            .HasOne(o => o.Staff).WithMany()
            .HasForeignKey(o => o.StaffId).OnDelete(DeleteBehavior.SetNull);

        modelBuilder.Entity<OrderItem>()
            .HasOne(i => i.Order).WithMany(o => o.Items)
            .HasForeignKey(i => i.OrderId).OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<OrderItem>()
            .HasOne(i => i.Product).WithMany()
            .HasForeignKey(i => i.ProductId).OnDelete(DeleteBehavior.SetNull);

        // ── Global snake_case column names (replaces EFCore.NamingConventions) ──
        foreach (var entity in modelBuilder.Model.GetEntityTypes())
            foreach (var property in entity.GetProperties())
                property.SetColumnName(ToSnakeCase(property.Name));
    }

    private static string ToSnakeCase(string name) =>
        string.Concat(name.Select((c, i) =>
            i > 0 && char.IsUpper(c) ? "_" + char.ToLower(c) : char.ToString(char.ToLower(c))));
}
