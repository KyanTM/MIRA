using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;
using Mira.Infrastructure.DbContexts;

namespace Mira.API.Tests;

public sealed class MiraApiFactory : WebApplicationFactory<Program>
{
    private readonly string _databaseName = $"MiraTests-{Guid.NewGuid():N}";
    private readonly string _storageRoot = Path.Combine(
        Path.GetTempPath(),
        $"mira-api-tests-{Guid.NewGuid():N}");

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.UseEnvironment("Development");

        builder.ConfigureAppConfiguration((_, configuration) =>
        {
            configuration.AddInMemoryCollection(
                new Dictionary<string, string?>
                {
                    ["ConnectionStrings:MiraDatabase"] = "Server=unused",
                    ["FrontendOrigin"] = "https://localhost",
                    ["FileStorage:RootPath"] = _storageRoot,
                    ["DocumentUploads:MaxFileSizeBytes"] = "1048576"
                });
        });

        builder.ConfigureServices(services =>
        {
            services.RemoveAll<DbContextOptions<MiraContext>>();
            services.RemoveAll<IDbContextOptionsConfiguration<MiraContext>>();

            services.AddDbContext<MiraContext>(options =>
                options.UseInMemoryDatabase(_databaseName));
        });
    }

    protected override void Dispose(bool disposing)
    {
        base.Dispose(disposing);

        if (!disposing || !Directory.Exists(_storageRoot))
        {
            return;
        }

        var fullStorageRoot = Path.GetFullPath(_storageRoot);
        var tempRoot = Path.GetFullPath(Path.GetTempPath());

        if (fullStorageRoot.StartsWith(
                tempRoot,
                StringComparison.OrdinalIgnoreCase) &&
            Path.GetFileName(fullStorageRoot).StartsWith(
                "mira-api-tests-",
                StringComparison.Ordinal))
        {
            Directory.Delete(fullStorageRoot, recursive: true);
        }
    }
}
