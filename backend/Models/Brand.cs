namespace App.Models;

public class Brand : EntityBase<int>
{
    public string Name { get; set; } = string.Empty;
    public string? Phone { get; set; }
    public string? Email { get; set; }
    public string? Link { get; set; }
    public string? ImageUrl { get; set; }
}
