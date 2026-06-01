namespace App.Models;

public class Staff : EntityBase<Guid>
{
    public string Name { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string? Phone { get; set; }
    public string Role { get; set; } = "Cashier";
    public Dictionary<string, bool> Permissions { get; set; } = new();
}
