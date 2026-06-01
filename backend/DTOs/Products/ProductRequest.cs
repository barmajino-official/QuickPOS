namespace App.DTOs.Products;

public record ProductRequest(
    string Name,
    decimal Price,
    decimal Cost,
    int Stock,
    int? CategoryId,
    int? BrandId,
    string? Barcode,
    string? ImageUrl,
    DateOnly? ExpiryDate
);
