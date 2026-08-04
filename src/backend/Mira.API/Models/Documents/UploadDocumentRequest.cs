using System.ComponentModel.DataAnnotations;

namespace Mira.API.Models.Documents;

public sealed class UploadDocumentRequest : IValidatableObject
{
    [Required]
    public IFormFile? File { get; set; }

    [MaxLength(200)]
    public string? Name { get; set; }

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

    public Guid? ItemId { get; set; }

    [Required]
    [AllowedValues("Attachment", "PrimaryImage", "GalleryImage")]
    public string Role { get; set; } = "Attachment";

    public IEnumerable<ValidationResult> Validate(ValidationContext validationContext)
    {
        if (IssuedOn.HasValue && ExpiresOn < IssuedOn)
        {
            yield return new ValidationResult(
                "ExpiresOn mag niet vóór IssuedOn liggen.",
                [nameof(ExpiresOn)]);
        }

        if (ItemId == Guid.Empty)
        {
            yield return new ValidationResult(
                "ItemId moet een geldige identifier bevatten.",
                [nameof(ItemId)]);
        }

        if (!ItemId.HasValue && Role != "Attachment")
        {
            yield return new ValidationResult(
                "Een afbeeldingsrol vereist ook een ItemId.",
                [nameof(Role)]);
        }
    }
}
