namespace Mira.Infrastructure.Storage;

public interface IPrivateFileStorage
{
    Task<StoredFile> SaveAsync(
        Stream source,
        string extension,
        long maxBytes,
        CancellationToken cancellationToken = default);

    Task<Stream?> OpenReadAsync(
        string storageKey,
        CancellationToken cancellationToken = default);

    Task<bool> DeleteAsync(
        string storageKey,
        CancellationToken cancellationToken = default);
}

public sealed record StoredFile(
    string StorageKey,
    long FileSizeBytes,
    string Checksum);
