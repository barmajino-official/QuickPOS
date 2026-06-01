namespace App.DTOs.Customers;

public record CustomerRequest(string Name, string? Phone, string? Email, string? Address);
