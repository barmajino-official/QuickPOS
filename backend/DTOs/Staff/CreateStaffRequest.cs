namespace App.DTOs.Staff;

public record CreateStaffRequest(
    string Name,
    string Email,
    string Password,
    string? Phone,
    string Role,
    Dictionary<string, bool> Permissions
);
