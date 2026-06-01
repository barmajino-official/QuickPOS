using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using App.Data;
using App.DTOs.Auth;
using App.Models;
using App.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace App.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly AuthService _auth;
    private readonly IConfiguration _config;
    private readonly IWebHostEnvironment _env;

    public AuthController(AppDbContext db, AuthService auth, IConfiguration config, IWebHostEnvironment env)
    {
        _db = db;
        _auth = auth;
        _config = config;
        _env = env;
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginRequest req)
    {
        var user = await _db.AuthUsers.FirstOrDefaultAsync(u => u.Email == req.Email);
        if (user?.EncryptedPassword == null || !_auth.VerifyPassword(req.Password, user.EncryptedPassword))
            return Unauthorized(new { message = "Invalid email or password" });

        var staff = await _db.Staff.FirstOrDefaultAsync(s => s.Id == user.Id);
        if (staff == null)
            return Unauthorized(new { message = "Staff record not found" });

        user.LastSignInAt = DateTime.UtcNow;
        user.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();

        return Ok(new AuthResponse(_auth.GenerateToken(staff), ToProfile(staff)));
    }

    [HttpPost("register")]
    public async Task<IActionResult> Register([FromBody] RegisterRequest req)
    {
        if (await _db.Staff.AnyAsync())
            return StatusCode(403, new { message = "Initial setup already completed" });

        if (await _db.AuthUsers.AnyAsync(u => u.Email == req.Email))
            return BadRequest(new { message = "Email already in use" });

        var adminPermissions = new Dictionary<string, bool>
        {
            ["dashboard"] = true, ["pos"] = true, ["orders"] = true,
            ["products"] = true, ["categories"] = true, ["customers"] = true, ["staff"] = true
        };

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
            Role = "Admin",
            Permissions = adminPermissions,
            CreatedAt = now
        };
        _db.Staff.Add(staff);
        await _db.SaveChangesAsync();

        return Ok(new AuthResponse(_auth.GenerateToken(staff), ToProfile(staff)));
    }

    [HttpGet("me")]
    [Authorize]
    public async Task<IActionResult> Me()
    {
        var id = Guid.Parse(User.FindFirstValue(JwtRegisteredClaimNames.Sub)!);
        var staff = await _db.Staff.FindAsync(id);
        return staff == null ? NotFound() : Ok(ToProfile(staff));
    }

    [HttpPost("test-token")]
    public async Task<IActionResult> TestToken([FromBody] TestTokenRequest req)
    {
        if (!_env.IsDevelopment()) return NotFound();

        var devToken = _config["JwtSettings:DevAuthToken"];
        if (!Request.Headers.TryGetValue("X-Dev-Auth-Token", out var header) || header != devToken)
            return Unauthorized();

        var staff = await _db.Staff.FirstOrDefaultAsync(s => s.Email == req.Email);
        if (staff == null) return NotFound(new { message = "Staff not found" });

        return Ok(new AuthResponse(_auth.GenerateToken(staff), ToProfile(staff)));
    }

    private static StaffProfile ToProfile(Staff s) =>
        new(s.Id, s.Name, s.Email, s.Role, s.Permissions, s.CreatedAt);
}
