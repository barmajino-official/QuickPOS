namespace App.DTOs.Orders;

public record CreateOrderRequest(
    decimal Total,
    string Status,
    int? CustomerId,
    Guid StaffId,
    List<CreateOrderItemRequest> Items
);

public record CreateOrderItemRequest(
    int? ProductId,
    string ProductName,
    int Quantity,
    decimal UnitPrice
);
