namespace App.DTOs.Brands;

public record BrandAnalytics(
    int Id,
    string Name,
    int UnitsSold,
    decimal Revenue,
    decimal CostOfSold,
    decimal Profit,
    int StockUnits,
    decimal StockValue,
    decimal InventoryBudget,
    List<BrandProduct> Products,
    string? ImageUrl
);

public record BrandProduct(
    int Id,
    string Name,
    decimal Price,
    decimal Cost,
    int Stock,
    int UnitsSold
);
