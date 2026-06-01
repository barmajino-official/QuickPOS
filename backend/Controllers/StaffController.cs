using App.Authorization;
using App.Data;
using App.DTOs.Staff;
using App.Models;
using App.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace App.Controllers;

[ApiController]
[Route("api/staff")]
[Authorize]
[Permission("staff")]
public class StaffController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly AuthService _auth;

    public StaffController(AppDbContext db, AuthService auth)
    {
        _db = db;
        _auth = auth;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll() =>
        Ok(await _db.Staff.OrderBy(s => s.Name).ToListAsync());

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateStaffRequest req)
    {
        if (await _db.AuthUsers.AnyAsync(u => u.Email == req.Email))
            return BadRequest(new { message = "Email already in use" });

        var now = DateTime.UtcNow;
        var userId = Guid.NewGuid();

        _db.AuthUsers.Add(new AuthUser
        {
            Id = userId,
            Email = req.Email,
            EncryptedPassword = _auth.HashPassword(req.Password),
            EmailConfirmedAt = now,
            CreatedAt = now,
            UpdatedAt = now
        });

        var staff = new Staff
        {
            Id = userId,
            Name = req.Name,
            Email = req.Email,
            Phone = req.Phone,
            Role = req.Role,
            Permissions = req.Permissions,
            CreatedAt = now
        };
        _db.Staff.Add(staff);
        await _db.SaveChangesAsync();

        return Ok(staff);
    }

    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateStaffRequest req)
    {
        var staff = await _db.Staff.FindAsync(id);
        if (staff == null) return NotFound();
        staff.Name = req.Name;
        staff.Phone = req.Phone;
        staff.Role = req.Role;
        staff.Permissions = req.Permissions;
        await _db.SaveChangesAsync();
        return Ok(staff);
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        await using var tx = await _db.Database.BeginTransactionAsync();
        var staffDeleted = await _db.Staff.Where(s => s.Id == id).ExecuteDeleteAsync();
        if (staffDeleted == 0) return NotFound();
        await _db.AuthUsers.Where(u => u.Id == id).ExecuteDeleteAsync();
        await tx.CommitAsync();
        return NoContent();
    }
}
