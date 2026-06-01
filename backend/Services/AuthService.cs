using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using System.Text.Json;
using App.Models;
using Microsoft.IdentityModel.Tokens;

namespace App.Services;

public class AuthService
{
    private readonly IConfiguration _config;

    public AuthService(IConfiguration config) => _config = config;

    public string HashPassword(string password) =>
        BCrypt.Net.BCrypt.HashPassword(password);

    public bool VerifyPassword(string password, string hash) =>
        BCrypt.Net.BCrypt.Verify(password, hash);

    public string GenerateToken(Staff staff)
    {
        var secret = _config["JwtSettings:Secret"]
            ?? throw new InvalidOperationException("JwtSettings:Secret not configured");
        var expiryHours = _config.GetValue<int>("JwtSettings:ExpiryHours", 8);

        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secret));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var claims = new[]
        {
            new Claim(JwtRegisteredClaimNames.Sub, staff.Id.ToString()),
            new Claim(JwtRegisteredClaimNames.Email, staff.Email),
            new Claim("role", staff.Role),
            new Claim("permissions", JsonSerializer.Serialize(staff.Permissions))
        };

        var token = new JwtSecurityToken(
            claims: claims,
            expires: DateTime.UtcNow.AddHours(expiryHours),
            signingCredentials: creds
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }
}
