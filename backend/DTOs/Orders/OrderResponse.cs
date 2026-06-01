namespace App.DTOs.Orders;

public record OrderResponse(
    int Id,
    decimal Total,
    string Status,
    int? CustomerId,
    string? CustomerName,
    Guid? StaffId,
    string? StaffName,
    DateTime CreatedAt,
    List<OrderItemResponse>? Items = null
);

public record OrderItemResponse(
    int Id,
    int? ProductId,
    string ProductName,
    int Quantity,
    decimal UnitPrice
);
