using System.Buffers;
using System.Security.Cryptography;
using Microsoft.Extensions.Options;

namespace Mira.Infrastructure.Storage;

public sealed class LocalPrivateFileStorage : IPrivateFileStorage
{
    private readonly string _rootPath;
    private readonly string _rootPathWithSeparator;
    private readonly TimeProvider _timeProvider;

    public LocalPrivateFileStorage(
        IOptions<LocalFileStorageOptions> options,
        TimeProvider timeProvider)
    {
        _rootPath = Path.GetFullPath(options.Value.RootPath);
        _rootPathWithSeparator = _rootPath.TrimEnd(
            Path.DirectorySeparatorChar,
            Path.AltDirectorySeparatorChar) + Path.DirectorySeparatorChar;
        _timeProvider = timeProvider;

        Directory.CreateDirectory(_rootPath);
    }

    public Task<bool> DeleteAsync(
        string storageKey,
        CancellationToken cancellationToken = default)
    {
        cancellationToken.ThrowIfCancellationRequested();

        var fullPath = ResolveStoragePath(storageKey);

        if (!File.Exists(fullPath))
        {
            return Task.FromResult(false);
        }

        File.Delete(fullPath);
        return Task.FromResult(true);
    }

    public Task<Stream?> OpenReadAsync(
        string storageKey,
        CancellationToken cancellationToken = default)
    {
        cancellationToken.ThrowIfCancellationRequested();

        var fullPath = ResolveStoragePath(storageKey);

        if (!File.Exists(fullPath))
        {
            return Task.FromResult<Stream?>(null);
        }

        Stream stream = new FileStream(
            fullPath,
            FileMode.Open,
            FileAccess.Read,
            FileShare.Read,
            bufferSize: 64 * 1024,
            FileOptions.Asynchronous | FileOptions.SequentialScan);

        return Task.FromResult<Stream?>(stream);
    }

    public async Task<StoredFile> SaveAsync(
        Stream source,
        string extension,
        long maxBytes,
        CancellationToken cancellationToken = default)
    {
        ValidateExtension(extension);

        var now = _timeProvider.GetUtcNow();
        var storageKey = string.Join(
            '/',
            now.Year.ToString("0000"),
            now.Month.ToString("00"),
            $"{Guid.NewGuid():N}{extension.ToLowerInvariant()}");
        var fullPath = ResolveStoragePath(storageKey);
        var directory = Path.GetDirectoryName(fullPath)!;

        Directory.CreateDirectory(directory);

        var buffer = ArrayPool<byte>.Shared.Rent(80 * 1024);
        var totalBytes = 0L;

        try
        {
            using var hash = IncrementalHash.CreateHash(HashAlgorithmName.SHA256);

            await using (var target = new FileStream(
                fullPath,
                FileMode.CreateNew,
                FileAccess.Write,
                FileShare.None,
                bufferSize: 80 * 1024,
                FileOptions.Asynchronous | FileOptions.SequentialScan))
            {
                while (true)
                {
                    var bytesRead = await source.ReadAsync(
                        buffer.AsMemory(0, buffer.Length),
                        cancellationToken);

                    if (bytesRead == 0)
                    {
                        break;
                    }

                    totalBytes += bytesRead;

                    if (totalBytes > maxBytes)
                    {
                        throw new InvalidDataException(
                            "Het bestand overschrijdt de toegestane grootte.");
                    }

                    hash.AppendData(buffer, 0, bytesRead);
                    await target.WriteAsync(
                        buffer.AsMemory(0, bytesRead),
                        cancellationToken);
                }

                await target.FlushAsync(cancellationToken);
            }

            if (totalBytes == 0)
            {
                throw new InvalidDataException("Het bestand is leeg.");
            }

            return new StoredFile(
                storageKey,
                totalBytes,
                Convert.ToHexString(hash.GetHashAndReset()));
        }
        catch
        {
            if (File.Exists(fullPath))
            {
                File.Delete(fullPath);
            }

            throw;
        }
        finally
        {
            ArrayPool<byte>.Shared.Return(buffer);
        }
    }

    private string ResolveStoragePath(string storageKey)
    {
        if (string.IsNullOrWhiteSpace(storageKey) ||
            Path.IsPathRooted(storageKey))
        {
            throw new ArgumentException(
                "De opslagkey is ongeldig.",
                nameof(storageKey));
        }

        var relativePath = storageKey.Replace(
            '/',
            Path.DirectorySeparatorChar);
        var fullPath = Path.GetFullPath(
            Path.Combine(_rootPath, relativePath));

        if (!fullPath.StartsWith(
            _rootPathWithSeparator,
            StringComparison.OrdinalIgnoreCase))
        {
            throw new ArgumentException(
                "De opslagkey verwijst buiten de private opslagmap.",
                nameof(storageKey));
        }

        return fullPath;
    }

    private static void ValidateExtension(string extension)
    {
        if (string.IsNullOrWhiteSpace(extension) ||
            extension.Length > 10 ||
            extension[0] != '.' ||
            extension.Skip(1).Any(character => !char.IsLetterOrDigit(character)))
        {
            throw new ArgumentException(
                "De bestandsextensie is ongeldig.",
                nameof(extension));
        }
    }
}
