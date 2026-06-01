namespace App.DTOs.Staff;

public record UpdateStaffRequest(
    string Name,
    string? Phone,
    string Role,
    Dictionary<string, bool> Permissions
);
