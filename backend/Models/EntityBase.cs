namespace App.Models;

public abstract class EntityBase<TKey>
{
    public TKey Id { get; set; } = default!;
    public DateTime CreatedAt { get; set; }
}
