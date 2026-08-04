namespace Mira.API.Services.Documents;

public sealed class DocumentUploadOptions
{
    public const string SectionName = "DocumentUploads";

    public long MaxFileSizeBytes { get; set; } = 20 * 1024 * 1024;
}
