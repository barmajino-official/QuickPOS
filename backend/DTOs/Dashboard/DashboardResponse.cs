namespace App.DTOs.Dashboard;

public record DashboardResponse(
    decimal TodayRevenue,
    int TodayOrderCount,
    int TotalProducts,
    int TotalCustomers,
    List<LowStockProduct> LowStockProducts,
    List<ExpiringProduct> ExpiringSoon,
    List<TopProduct> TopProducts,
    List<TopStaff> TopStaff,
    List<DailySales> SalesTrend
);

public record LowStockProduct(int Id, string Name, int Stock);
public record ExpiringProduct(int Id, string Name, DateOnly ExpiryDate, int Stock);
public record TopProduct(int Id, string Name, int TotalSold);
public record TopStaff(Guid Id, string Name, int OrderCount);
public record DailySales(string Date, decimal Revenue, int OrderCount);
