using Microsoft.AspNetCore.Http;

namespace Mira.API.Services.Documents;

public interface IDocumentUploadValidator
{
    Task<DocumentUploadValidationResult> ValidateAsync(
        IFormFile file,
        CancellationToken cancellationToken = default);
}

public sealed record ValidatedDocumentUpload(
    string OriginalFileName,
    string Extension,
    string MimeType);

public sealed record DocumentUploadValidationResult(
    ValidatedDocumentUpload? Upload,
    string? Error)
{
    public bool IsValid => Upload is not null;

    public static DocumentUploadValidationResult Success(
        ValidatedDocumentUpload upload) => new(upload, null);

    public static DocumentUploadValidationResult Failure(
        string error) => new(null, error);
}
