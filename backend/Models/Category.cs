namespace App.Models;

public class Category : EntityBase<int>
{
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
}
