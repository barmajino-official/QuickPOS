namespace App.DTOs.Auth;

public record AuthResponse(string Token, StaffProfile Staff);

public record StaffProfile(
    Guid Id,
    string Name,
    string Email,
    string Role,
    Dictionary<string, bool> Permissions,
    DateTime CreatedAt
);
