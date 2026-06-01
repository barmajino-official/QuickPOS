namespace App.Models;

public class AuthUser : EntityBase<Guid>
{
    public string? Email { get; set; }
    public string? EncryptedPassword { get; set; }
    public DateTime? EmailConfirmedAt { get; set; }
    public DateTime? LastSignInAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}
