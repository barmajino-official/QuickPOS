using App.Authorization;
using App.Data;
using App.DTOs.Orders;
using App.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace App.Controllers;

[ApiController]
[Route("api/orders")]
[Authorize]
public class OrdersController : ControllerBase
{
    private readonly AppDbContext _db;
    public OrdersController(AppDbContext db) => _db = db;

    [Permission("orders")]
    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var orders = await _db.Orders
            .Include(o => o.Customer)
            .Include(o => o.Staff)
            .OrderByDescending(o => o.CreatedAt)
            .ToListAsync();

        return Ok(orders.Select(o => new OrderResponse(
            o.Id, o.Total, o.Status,
            o.CustomerId, o.Customer?.Name,
            o.StaffId, o.Staff?.Name,
            o.CreatedAt
        )));
    }

    [Permission("orders")]
    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetById(int id)
    {
        var order = await _db.Orders
            .Include(o => o.Customer)
            .Include(o => o.Staff)
            .Include(o => o.Items)
            .FirstOrDefaultAsync(o => o.Id == id);

        if (order == null) return NotFound();

        return Ok(new OrderResponse(
            order.Id, order.Total, order.Status,
            order.CustomerId, order.Customer?.Name,
            order.StaffId, order.Staff?.Name,
            order.CreatedAt,
            order.Items.Select(i => new OrderItemResponse(
                i.Id, i.ProductId, i.ProductName, i.Quantity, i.UnitPrice
            )).ToList()
        ));
    }

    [Permission("pos", "orders")]
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateOrderRequest req)
    {
        await using var tx = await _db.Database.BeginTransactionAsync();
        try
        {
            var order = new Order
            {
                Total = req.Total,
                Status = req.Status,
                CustomerId = req.CustomerId,
                StaffId = req.StaffId,
                CreatedAt = DateTime.UtcNow
            };
            _db.Orders.Add(order);
            await _db.SaveChangesAsync();

            foreach (var item in req.Items)
            {
                _db.OrderItems.Add(new OrderItem
                {
                    OrderId = order.Id,
                    ProductId = item.ProductId,
                    ProductName = item.ProductName,
                    Quantity = item.Quantity,
                    UnitPrice = item.UnitPrice
                });

                if (item.ProductId.HasValue)
                {
                    var product = await _db.Products.FindAsync(item.ProductId.Value);
                    if (product != null)
                        product.Stock = Math.Max(0, product.Stock - item.Quantity);
                }
            }

            await _db.SaveChangesAsync();
            await tx.CommitAsync();
            return Ok(new { id = order.Id });
        }
        catch
        {
            await tx.RollbackAsync();
            throw;
        }
    }

    [Permission("orders")]
    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        if (!await _db.Orders.AnyAsync(o => o.Id == id)) return NotFound();
        await using var tx = await _db.Database.BeginTransactionAsync();
        await _db.OrderItems.Where(i => i.OrderId == id).ExecuteDeleteAsync();
        await _db.Orders.Where(o => o.Id == id).ExecuteDeleteAsync();
        await tx.CommitAsync();
        return NoContent();
    }
}
