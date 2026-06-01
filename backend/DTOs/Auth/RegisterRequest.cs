namespace App.DTOs.Auth;

public record RegisterRequest(string Name, string Email, string Password, string? Phone = null);
