using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Mira.Domain.Entities;

public class Asset : Item
{
    [MaxLength(100)]
    public string? Brand { get; set; }

    [MaxLength(100)]
    public string? Model { get; set; }

    [MaxLength(100)]
    public string? SerialNumber { get; set; }

    public DateOnly? PurchaseDate { get; set; }

    [Column(TypeName = "decimal(18,2)")]
    public decimal? PurchasePrice { get; set; }

    [MaxLength(200)]
    public string? Seller { get; set; }

    [MaxLength(200)]
    public string? Location { get; set; }

    [Column(TypeName = "decimal(18,2)")]
    public decimal? CurrentValue { get; set; }

    public ICollection<Warranty> Warranties { get; set; } = [];
}
