using App.Authorization;
using App.Data;
using App.DTOs.Customers;
using App.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace App.Controllers;

[ApiController]
[Route("api/customers")]
[Authorize]
public class CustomersController : ControllerBase
{
    private readonly AppDbContext _db;
    public CustomersController(AppDbContext db) => _db = db;

    [Permission("customers", "pos")]
    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] string? search)
    {
        var query = _db.Customers.AsQueryable();
        if (!string.IsNullOrWhiteSpace(search))
        {
            var s = search.ToLower();
            query = query.Where(c =>
                c.Name.ToLower().Contains(s) ||
                (c.Email != null && c.Email.ToLower().Contains(s)) ||
                (c.Phone != null && c.Phone.Contains(s)));
        }
        return Ok(await query.OrderBy(c => c.Name).ToListAsync());
    }

    [Permission("customers")]
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CustomerRequest req)
    {
        var customer = new Customer
        {
            Name = req.Name,
            Phone = req.Phone,
            Email = req.Email,
            Address = req.Address,
            CreatedAt = DateTime.UtcNow
        };
        _db.Customers.Add(customer);
        await _db.SaveChangesAsync();
        return Ok(customer);
    }

    [Permission("customers")]
    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, [FromBody] CustomerRequest req)
    {
        var customer = await _db.Customers.FindAsync(id);
        if (customer == null) return NotFound();
        customer.Name = req.Name;
        customer.Phone = req.Phone;
        customer.Email = req.Email;
        customer.Address = req.Address;
        await _db.SaveChangesAsync();
        return Ok(customer);
    }

    [Permission("customers")]
    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        var customer = await _db.Customers.FindAsync(id);
        if (customer == null) return NotFound();
        _db.Customers.Remove(customer);
        await _db.SaveChangesAsync();
        return NoContent();
    }
}
