using App.Authorization;
using App.Data;
using App.DTOs.Brands;
using App.Models;
using App.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace App.Controllers;

[ApiController]
[Route("api/brands")]
[Authorize]
public class BrandsController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly ImageService _images;

    public BrandsController(AppDbContext db, ImageService images)
    {
        _db = db;
        _images = images;
    }

    [Permission("brands", "products", "pos")]
    [HttpGet]
    public async Task<IActionResult> GetAll() =>
        Ok(await _db.Brands.OrderBy(b => b.Name).ToListAsync());

    [Permission("brands", "products", "pos")]
    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetById(int id)
    {
        var brand = await _db.Brands.FindAsync(id);
        return brand == null ? NotFound() : Ok(brand);
    }

    [Permission("brands")]
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] BrandRequest req)
    {
        var brand = new Brand
        {
            Name = req.Name,
            Phone = req.Phone,
            Email = req.Email,
            Link = req.Link,
            ImageUrl = req.ImageUrl,
            CreatedAt = DateTime.UtcNow
        };
        _db.Brands.Add(brand);
        await _db.SaveChangesAsync();
        return Ok(brand);
    }

    [Permission("brands")]
    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, [FromBody] BrandRequest req)
    {
        var brand = await _db.Brands.FindAsync(id);
        if (brand == null) return NotFound();
        brand.Name = req.Name;
        brand.Phone = req.Phone;
        brand.Email = req.Email;
        brand.Link = req.Link;
        brand.ImageUrl = req.ImageUrl;
        await _db.SaveChangesAsync();
        return Ok(brand);
    }

    [Permission("brands")]
    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        var brand = await _db.Brands.FindAsync(id);
        if (brand == null) return NotFound();
        _images.Delete(brand.ImageUrl);
        _db.Brands.Remove(brand);
        await _db.SaveChangesAsync();
        return NoContent();
    }

    [Permission("brands", "products", "pos")]
    [HttpGet("{id:int}/analytics")]
    public async Task<IActionResult> Analytics(int id)
    {
        var brand = await _db.Brands.FindAsync(id);
        if (brand == null) return NotFound();

        var products = await _db.Products.Where(p => p.BrandId == id).ToListAsync();
        var productIds = products.Select(p => p.Id).ToList();
        var costById = products.ToDictionary(p => p.Id, p => p.Cost);

        var soldItems = await _db.OrderItems
            .Where(i => i.ProductId != null && productIds.Contains(i.ProductId.Value))
            .ToListAsync();

        var unitsSold = soldItems.Sum(i => i.Quantity);
        var revenue = soldItems.Sum(i => i.UnitPrice * i.Quantity);
        var costOfSold = soldItems.Sum(i =>
            (costById.TryGetValue(i.ProductId!.Value, out var c) ? c : 0m) * i.Quantity);

        var productRows = products
            .Select(p => new BrandProduct(
                p.Id, p.Name, p.Price, p.Cost, p.Stock,
                soldItems.Where(i => i.ProductId == p.Id).Sum(i => i.Quantity)))
            .OrderByDescending(p => p.UnitsSold)
            .ToList();

        return Ok(new BrandAnalytics(
            brand.Id,
            brand.Name,
            unitsSold,
            revenue,
            costOfSold,
            revenue - costOfSold,
            products.Sum(p => p.Stock),
            products.Sum(p => p.Stock * p.Price),
            products.Sum(p => p.Stock * p.Cost),
            productRows,
            brand.ImageUrl
        ));
    }

    [Permission("brands")]
    [HttpPost("{id:int}/image")]
    [RequestSizeLimit(10_485_760)]
    public async Task<IActionResult> UploadImage(int id, IFormFile file)
    {
        var brand = await _db.Brands.FindAsync(id);
        if (brand == null) return NotFound();
        _images.Delete(brand.ImageUrl);
        brand.ImageUrl = await _images.SaveAsync(file);
        await _db.SaveChangesAsync();
        return Ok(new { imageUrl = brand.ImageUrl });
    }
}
