namespace App.Models;

public class Product : EntityBase<int>
{
    public string Name { get; set; } = string.Empty;
    public decimal Price { get; set; }
    public decimal Cost { get; set; }
    public int Stock { get; set; }
    public int? CategoryId { get; set; }
    public int? BrandId { get; set; }
    public string? Barcode { get; set; }
    public string? ImageUrl { get; set; }
    public DateOnly? ExpiryDate { get; set; }
    public Category? Category { get; set; }
    public Brand? Brand { get; set; }
}
