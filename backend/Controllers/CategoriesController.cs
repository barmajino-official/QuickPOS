using App.Authorization;
using App.Data;
using App.DTOs.Categories;
using App.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace App.Controllers;

[ApiController]
[Route("api/categories")]
[Authorize]
public class CategoriesController : ControllerBase
{
    private readonly AppDbContext _db;
    public CategoriesController(AppDbContext db) => _db = db;

    [Permission("categories", "pos")]
    [HttpGet]
    public async Task<IActionResult> GetAll() =>
        Ok(await _db.Categories.OrderBy(c => c.Name).ToListAsync());

    [Permission("categories")]
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CategoryRequest req)
    {
        var category = new Category
        {
            Name = req.Name,
            Description = req.Description,
            CreatedAt = DateTime.UtcNow
        };
        _db.Categories.Add(category);
        await _db.SaveChangesAsync();
        return Ok(category);
    }

    [Permission("categories")]
    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, [FromBody] CategoryRequest req)
    {
        var category = await _db.Categories.FindAsync(id);
        if (category == null) return NotFound();
        category.Name = req.Name;
        category.Description = req.Description;
        await _db.SaveChangesAsync();
        return Ok(category);
    }

    [Permission("categories")]
    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        var category = await _db.Categories.FindAsync(id);
        if (category == null) return NotFound();
        _db.Categories.Remove(category);
        await _db.SaveChangesAsync();
        return NoContent();
    }
}
