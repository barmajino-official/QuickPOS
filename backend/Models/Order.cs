namespace App.Models;

public class Order : EntityBase<int>
{
    public decimal Total { get; set; }
    public string Status { get; set; } = "Completed";
    public int? CustomerId { get; set; }
    public Guid? StaffId { get; set; }
    public Customer? Customer { get; set; }
    public Staff? Staff { get; set; }
    public List<OrderItem> Items { get; set; } = new();
}
