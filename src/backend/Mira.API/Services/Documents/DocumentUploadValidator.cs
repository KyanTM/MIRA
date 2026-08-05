using System.IO.Compression;
using Microsoft.Extensions.Options;

namespace Mira.API.Services.Documents;

public sealed class DocumentUploadValidator : IDocumentUploadValidator
{
    private static readonly IReadOnlyDictionary<string, string> MimeTypes =
        new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
        {
            [".pdf"] = "application/pdf",
            [".png"] = "image/png",
            [".jpg"] = "image/jpeg",
            [".jpeg"] = "image/jpeg",
            [".webp"] = "image/webp",
            [".docx"] = "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            [".xlsx"] = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            [".txt"] = "text/plain"
        };

    private readonly DocumentUploadOptions _options;

    public DocumentUploadValidator(IOptions<DocumentUploadOptions> options)
    {
        _options = options.Value;
    }

    public async Task<DocumentUploadValidationResult> ValidateAsync(
        IFormFile file,
        CancellationToken cancellationToken = default)
    {
        if (file.Length <= 0)
        {
            return DocumentUploadValidationResult.Failure(
                "Het bestand is leeg.");
        }

        if (file.Length > _options.MaxFileSizeBytes)
        {
            return DocumentUploadValidationResult.Failure(
                $"Het bestand is groter dan {_options.MaxFileSizeBytes / 1024 / 1024} MB.");
        }

        var originalFileName = SanitizeFileName(file.FileName);

        if (string.IsNullOrWhiteSpace(originalFileName))
        {
            return DocumentUploadValidationResult.Failure(
                "De oorspronkelijke bestandsnaam ontbreekt.");
        }

        var extension = Path.GetExtension(originalFileName).ToLowerInvariant();

        if (!MimeTypes.TryGetValue(extension, out var mimeType))
        {
            return DocumentUploadValidationResult.Failure(
                "Dit bestandstype is niet toegestaan. Gebruik PDF, PNG, JPEG, WebP, DOCX, XLSX of TXT.");
        }

        var contentIsValid = await HasExpectedContentAsync(
            file,
            extension,
            cancellationToken);

        if (!contentIsValid)
        {
            return DocumentUploadValidationResult.Failure(
                "De inhoud van het bestand komt niet overeen met de bestandsextensie.");
        }

        return DocumentUploadValidationResult.Success(
            new ValidatedDocumentUpload(
                originalFileName,
                extension,
                mimeType));
    }

    private static async Task<bool> HasExpectedContentAsync(
        IFormFile file,
        string extension,
        CancellationToken cancellationToken)
    {
        if (extension is ".docx" or ".xlsx")
        {
            return await IsExpectedOpenXmlFileAsync(
                file,
                extension,
                cancellationToken);
        }

        await using var stream = file.OpenReadStream();
        var prefix = new byte[12];
        var bytesRead = await stream.ReadAsync(
            prefix.AsMemory(),
            cancellationToken);

        return extension switch
        {
            ".pdf" => StartsWith(prefix, bytesRead, "%PDF-"u8),
            ".png" => StartsWith(
                prefix,
                bytesRead,
                [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]),
            ".jpg" or ".jpeg" => StartsWith(
                prefix,
                bytesRead,
                [0xFF, 0xD8, 0xFF]),
            ".webp" => bytesRead >= 12 &&
                prefix.AsSpan(0, 4).SequenceEqual("RIFF"u8) &&
                prefix.AsSpan(8, 4).SequenceEqual("WEBP"u8),
            ".txt" => !prefix.AsSpan(0, bytesRead).Contains((byte)0),
            _ => false
        };
    }

    private static async Task<bool> IsExpectedOpenXmlFileAsync(
        IFormFile file,
        string extension,
        CancellationToken cancellationToken)
    {
        await using var stream = file.OpenReadStream();

        try
        {
            using var archive = new ZipArchive(
                stream,
                ZipArchiveMode.Read,
                leaveOpen: false);

            if (archive.Entries.Count is 0 or > 10_000)
            {
                return false;
            }

            cancellationToken.ThrowIfCancellationRequested();

            var hasContentTypes = archive.Entries.Any(entry =>
                entry.FullName.Equals(
                    "[Content_Types].xml",
                    StringComparison.OrdinalIgnoreCase));

            var expectedPrefix = extension == ".docx" ? "word/" : "xl/";
            var hasExpectedPart = archive.Entries.Any(entry =>
                entry.FullName.StartsWith(
                    expectedPrefix,
                    StringComparison.OrdinalIgnoreCase));

            return hasContentTypes && hasExpectedPart;
        }
        catch (InvalidDataException)
        {
            return false;
        }
    }

    private static bool StartsWith(
        byte[] buffer,
        int bytesRead,
        ReadOnlySpan<byte> signature)
    {
        return bytesRead >= signature.Length &&
            buffer.AsSpan(0, signature.Length).SequenceEqual(signature);
    }

    private static string SanitizeFileName(string fileName)
    {
        var normalized = fileName.Replace('\\', '/');
        var lastSegment = normalized[(normalized.LastIndexOf('/') + 1)..].Trim();
        var invalidCharacters = Path.GetInvalidFileNameChars();

        var sanitizedCharacters = lastSegment
            .Select(character =>
                invalidCharacters.Contains(character) || char.IsControl(character)
                    ? '_'
                    : character)
            .ToArray();

        var sanitized = new string(sanitizedCharacters);

        if (sanitized.Length <= 255)
        {
            return sanitized;
        }

        var extension = Path.GetExtension(sanitized);
        var nameLength = Math.Max(1, 255 - extension.Length);

        return sanitized[..nameLength] + extension;
    }
}
