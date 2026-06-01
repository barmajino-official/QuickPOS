using App.Authorization;
using App.Data;
using App.DTOs.Products;
using App.Models;
using App.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace App.Controllers;

[ApiController]
[Route("api/products")]
[Authorize]
public class ProductsController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly ImageService _images;

    public ProductsController(AppDbContext db, ImageService images)
    {
        _db = db;
        _images = images;
    }

    [Permission("products", "pos")]
    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] int? categoryId)
    {
        var query = _db.Products.Include(p => p.Category).Include(p => p.Brand).AsQueryable();
        if (categoryId.HasValue)
            query = query.Where(p => p.CategoryId == categoryId);
        return Ok(await query.OrderBy(p => p.Name).ToListAsync());
    }

    [Permission("products")]
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] ProductRequest req)
    {
        var product = new Product
        {
            Name = req.Name,
            Price = req.Price,
            Cost = req.Cost,
            Stock = req.Stock,
            CategoryId = req.CategoryId,
            BrandId = req.BrandId,
            Barcode = req.Barcode,
            ImageUrl = req.ImageUrl,
            ExpiryDate = req.ExpiryDate,
            CreatedAt = DateTime.UtcNow
        };
        _db.Products.Add(product);
        await _db.SaveChangesAsync();
        return Ok(product);
    }

    [Permission("products")]
    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, [FromBody] ProductRequest req)
    {
        var product = await _db.Products.FindAsync(id);
        if (product == null) return NotFound();
        product.Name = req.Name;
        product.Price = req.Price;
        product.Cost = req.Cost;
        product.Stock = req.Stock;
        product.CategoryId = req.CategoryId;
        product.BrandId = req.BrandId;
        product.Barcode = req.Barcode;
        product.ImageUrl = req.ImageUrl;
        product.ExpiryDate = req.ExpiryDate;
        await _db.SaveChangesAsync();
        return Ok(product);
    }

    [Permission("products")]
    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        var product = await _db.Products.FindAsync(id);
        if (product == null) return NotFound();
        _images.Delete(product.ImageUrl);
        _db.Products.Remove(product);
        await _db.SaveChangesAsync();
        return NoContent();
    }

    [Permission("products")]
    [HttpPost("{id:int}/image")]
    [RequestSizeLimit(10_485_760)]
    public async Task<IActionResult> UploadImage(int id, IFormFile file)
    {
        var product = await _db.Products.FindAsync(id);
        if (product == null) return NotFound();
        _images.Delete(product.ImageUrl);
        product.ImageUrl = await _images.SaveAsync(file);
        await _db.SaveChangesAsync();
        return Ok(new { imageUrl = product.ImageUrl });
    }
}
