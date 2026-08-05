using System.ComponentModel.DataAnnotations;

namespace Mira.Contracts.Models.Document;

public sealed class UpdateDocumentDto : IValidatableObject
{
    [Required]
    [MaxLength(200)]
    public string Name { get; set; } = string.Empty;

    [MaxLength(2_000)]
    public string? Description { get; set; }

    [Required]
    [MaxLength(50)]
    [AllowedValues(
        "Other",
        "Invoice",
        "Receipt",
        "Contract",
        "WarrantyCertificate",
        "InsurancePolicy",
        "Certificate",
        "IdentityDocument",
        "Manual",
        "MaintenanceReport",
        "Letter",
        "TaxDocument",
        "BankDocument",
        "RegistrationProof",
        "Image")]
    public string DocumentType { get; set; } = "Other";

    public DateOnly? IssuedOn { get; set; }

    public DateOnly? ExpiresOn { get; set; }

    [MaxLength(200)]
    public string? Issuer { get; set; }

    public IEnumerable<ValidationResult> Validate(ValidationContext validationContext)
    {
        if (IssuedOn.HasValue && ExpiresOn < IssuedOn)
        {
            yield return new ValidationResult(
                "ExpiresOn mag niet vóór IssuedOn liggen.",
                [nameof(ExpiresOn)]);
        }
    }
}
