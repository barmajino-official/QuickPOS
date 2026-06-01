using App.Authorization;
using App.Data;
using App.DTOs.Dashboard;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace App.Controllers;

[ApiController]
[Route("api/dashboard")]
[Authorize]
[Permission("dashboard")]
public class DashboardController : ControllerBase
{
    private readonly AppDbContext _db;
    public DashboardController(AppDbContext db) => _db = db;

    [HttpGet]
    public async Task<IActionResult> Get()
    {
        var today = DateTime.UtcNow.Date;
        var sevenDaysFromNow = DateOnly.FromDateTime(DateTime.UtcNow.AddDays(7));
        var todayDateOnly = DateOnly.FromDateTime(DateTime.UtcNow);

        var todayOrders = await _db.Orders
            .Where(o => o.CreatedAt >= today)
            .ToListAsync();

        var totalProducts = await _db.Products.CountAsync();
        var totalCustomers = await _db.Customers.CountAsync();

        var lowStock = await _db.Products
            .Where(p => p.Stock <= 5)
            .Select(p => new LowStockProduct(p.Id, p.Name, p.Stock))
            .ToListAsync();

        var expiringSoon = await _db.Products
            .Where(p => p.ExpiryDate.HasValue
                     && p.ExpiryDate <= sevenDaysFromNow
                     && p.ExpiryDate >= todayDateOnly)
            .Select(p => new ExpiringProduct(p.Id, p.Name, p.ExpiryDate!.Value, p.Stock))
            .ToListAsync();

        var topProductsRaw = await _db.OrderItems
            .GroupBy(i => new { i.ProductId, i.ProductName })
            .Select(g => new { g.Key.ProductId, g.Key.ProductName, TotalSold = g.Sum(i => i.Quantity) })
            .OrderByDescending(x => x.TotalSold)
            .Take(5)
            .ToListAsync();
        var topProducts = topProductsRaw
            .Select(x => new TopProduct(x.ProductId ?? 0, x.ProductName, x.TotalSold))
            .ToList();

        var topStaff = await _db.Orders
            .Where(o => o.StaffId.HasValue)
            .GroupBy(o => o.StaffId!.Value)
            .Select(g => new { StaffId = g.Key, Count = g.Count() })
            .OrderByDescending(x => x.Count)
            .Take(5)
            .ToListAsync();

        var staffIds = topStaff.Select(x => x.StaffId).ToList();
        var staffNames = await _db.Staff
            .Where(s => staffIds.Contains(s.Id))
            .ToDictionaryAsync(s => s.Id, s => s.Name);

        var topStaffResult = topStaff
            .Select(x => new TopStaff(
                x.StaffId,
                staffNames.GetValueOrDefault(x.StaffId, "Unknown"),
                x.Count))
            .ToList();

        // 7-day sales trend (oldest → today). Bucketed in memory by UTC date and
        // zero-filled so the chart always has exactly 7 points.
        const int TrendDays = 7;
        var trendStart = today.AddDays(-(TrendDays - 1));
        var recentOrders = await _db.Orders
            .Where(o => o.CreatedAt >= trendStart)
            .Select(o => new { o.CreatedAt, o.Total })
            .ToListAsync();

        var salesTrend = Enumerable.Range(0, TrendDays)
            .Select(i =>
            {
                var day = trendStart.AddDays(i);
                var dayOrders = recentOrders.Where(o => o.CreatedAt.Date == day).ToList();
                return new DailySales(
                    day.ToString("yyyy-MM-dd"),
                    dayOrders.Sum(o => o.Total),
                    dayOrders.Count);
            })
            .ToList();

        return Ok(new DashboardResponse(
            TodayRevenue: todayOrders.Sum(o => o.Total),
            TodayOrderCount: todayOrders.Count,
            TotalProducts: totalProducts,
            TotalCustomers: totalCustomers,
            LowStockProducts: lowStock,
            ExpiringSoon: expiringSoon,
            TopProducts: topProducts,
            TopStaff: topStaffResult,
            SalesTrend: salesTrend
        ));
    }
}
