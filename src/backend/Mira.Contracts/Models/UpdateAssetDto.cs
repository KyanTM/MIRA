using System.ComponentModel.DataAnnotations;

namespace Mira.Contracts.Models
{
    public sealed class UpdateAssetDto
    {
        [Required]
        [MaxLength(200)]
        public string Name { get; set; } = string.Empty;

        [MaxLength(2000)]
        public string? Description { get; set; }

        [MaxLength(100)]
        public string? Brand { get; set; }

        [MaxLength(100)]
        public string? Model { get; set; }

        [MaxLength(100)]
        public string? SerialNumber { get; set; }

        public DateOnly? PurchaseDate { get; set; }

        [Range(0, double.MaxValue)]
        public decimal? PurchasePrice { get; set; }

        [MaxLength(200)]
        public string? Seller { get; set; }

        [MaxLength(200)]
        public string? Location { get; set; }

        [Range(0, double.MaxValue)]
        public decimal? CurrentValue { get; set; }
    }
}
