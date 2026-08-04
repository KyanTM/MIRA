using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text;
using System.Text.Json;
using Microsoft.AspNetCore.Mvc.Testing;
using Xunit;

namespace Mira.API.Tests;

public sealed class BackendSecurityFlowTests : IClassFixture<MiraApiFactory>
{
    private readonly MiraApiFactory _factory;

    public BackendSecurityFlowTests(MiraApiFactory factory)
    {
        _factory = factory;
    }

    [Fact]
    public async Task UnsafeEndpointWithoutAntiforgeryTokenReturnsBadRequest()
    {
        using var client = CreateClient();

        var response = await client.PostAsJsonAsync(
            "/api/auth/register",
            new
            {
                email = $"no-xsrf-{Guid.NewGuid():N}@example.com",
                password = "Strong!Pass1234"
            });

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task UsersCannotReadEachOthersAssets()
    {
        using var firstClient = CreateClient();
        using var secondClient = CreateClient();

        var firstToken = await RegisterAsync(firstClient, "first");
        await RegisterAsync(secondClient, "second");

        using var createRequest = CreateJsonRequest(
            HttpMethod.Post,
            "/api/assets",
            new
            {
                name = "Privé laptop",
                brand = "Framework",
                model = "Laptop 13"
            },
            firstToken);

        var createResponse = await firstClient.SendAsync(createRequest);
        Assert.Equal(HttpStatusCode.Created, createResponse.StatusCode);

        using var createdDocument = JsonDocument.Parse(
            await createResponse.Content.ReadAsStringAsync());
        var assetId = createdDocument.RootElement
            .GetProperty("id")
            .GetGuid();

        var ownerResponse = await firstClient.GetAsync($"/api/assets/{assetId}");
        var otherUserResponse = await secondClient.GetAsync($"/api/assets/{assetId}");

        Assert.Equal(HttpStatusCode.OK, ownerResponse.StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, otherUserResponse.StatusCode);
    }

    [Fact]
    public async Task AuthenticatedUserCanUploadLinkAndDownloadPrivateDocument()
    {
        using var client = CreateClient();
        var antiforgeryToken = await RegisterAsync(client, "documents");

        using var createAssetRequest = CreateJsonRequest(
            HttpMethod.Post,
            "/api/assets",
            new { name = "Testtoestel" },
            antiforgeryToken);
        var createAssetResponse = await client.SendAsync(createAssetRequest);
        Assert.Equal(HttpStatusCode.Created, createAssetResponse.StatusCode);

        using var assetJson = JsonDocument.Parse(
            await createAssetResponse.Content.ReadAsStringAsync());
        var assetId = assetJson.RootElement.GetProperty("id").GetGuid();

        var expectedBytes = Encoding.UTF8.GetBytes(
            "MIRA private document integration test");
        using var multipart = new MultipartFormDataContent();
        using var fileContent = new ByteArrayContent(expectedBytes);
        fileContent.Headers.ContentType = new MediaTypeHeaderValue("text/plain");

        multipart.Add(fileContent, "File", "bewijs.txt");
        multipart.Add(new StringContent("Aankoopbewijs"), "Name");
        multipart.Add(new StringContent("Receipt"), "DocumentType");
        multipart.Add(new StringContent(assetId.ToString()), "ItemId");
        multipart.Add(new StringContent("Attachment"), "Role");

        using var uploadRequest = new HttpRequestMessage(
            HttpMethod.Post,
            "/api/documents")
        {
            Content = multipart
        };
        uploadRequest.Headers.Add("X-XSRF-TOKEN", antiforgeryToken);

        var uploadResponse = await client.SendAsync(uploadRequest);
        Assert.Equal(HttpStatusCode.Created, uploadResponse.StatusCode);

        using var uploadJson = JsonDocument.Parse(
            await uploadResponse.Content.ReadAsStringAsync());
        var documentId = uploadJson.RootElement.GetProperty("id").GetGuid();
        var links = uploadJson.RootElement.GetProperty("links");

        Assert.Single(links.EnumerateArray());
        Assert.Equal(
            assetId,
            links[0].GetProperty("itemId").GetGuid());

        var downloadResponse = await client.GetAsync(
            $"/api/documents/{documentId}/download");

        Assert.Equal(HttpStatusCode.OK, downloadResponse.StatusCode);
        Assert.Equal(
            expectedBytes,
            await downloadResponse.Content.ReadAsByteArrayAsync());
        Assert.Equal(
            "attachment",
            downloadResponse.Content.Headers.ContentDisposition?.DispositionType);

        var dashboardResponse = await client.GetAsync("/api/dashboard");
        Assert.Equal(HttpStatusCode.OK, dashboardResponse.StatusCode);

        using var dashboardJson = JsonDocument.Parse(
            await dashboardResponse.Content.ReadAsStringAsync());
        var counts = dashboardJson.RootElement.GetProperty("counts");

        Assert.Equal(1, counts.GetProperty("assets").GetInt32());
        Assert.Equal(1, counts.GetProperty("documents").GetInt32());
    }

    [Fact]
    public async Task WarrantyWithEndDateBeforeStartDateReturnsValidationProblem()
    {
        using var client = CreateClient();
        var antiforgeryToken = await RegisterAsync(client, "warranty-date");

        using var createAssetRequest = CreateJsonRequest(
            HttpMethod.Post,
            "/api/assets",
            new { name = "Toestel met garantie" },
            antiforgeryToken);
        var createAssetResponse = await client.SendAsync(createAssetRequest);
        Assert.Equal(HttpStatusCode.Created, createAssetResponse.StatusCode);

        using var assetJson = JsonDocument.Parse(
            await createAssetResponse.Content.ReadAsStringAsync());
        var assetId = assetJson.RootElement.GetProperty("id").GetGuid();

        using var warrantyRequest = CreateJsonRequest(
            HttpMethod.Post,
            "/api/warranties",
            new
            {
                name = "Ongeldige garantie",
                provider = "Testleverancier",
                startsOn = "2026-08-10",
                endsOn = "2026-08-01",
                assetId
            },
            antiforgeryToken);

        var response = await client.SendAsync(warrantyRequest);

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        Assert.Equal(
            "application/problem+json",
            response.Content.Headers.ContentType?.MediaType);
    }

    private HttpClient CreateClient()
    {
        return _factory.CreateClient(
            new WebApplicationFactoryClientOptions
            {
                BaseAddress = new Uri("https://localhost"),
                AllowAutoRedirect = false,
                HandleCookies = true
            });
    }

    private static async Task<string> RegisterAsync(
        HttpClient client,
        string emailPrefix)
    {
        var anonymousToken = await GetAntiforgeryTokenAsync(client);
        using var registerRequest = CreateJsonRequest(
            HttpMethod.Post,
            "/api/auth/register",
            new
            {
                email = $"{emailPrefix}-{Guid.NewGuid():N}@example.com",
                password = "Strong!Pass1234"
            },
            anonymousToken);

        var registerResponse = await client.SendAsync(registerRequest);
        Assert.Equal(HttpStatusCode.OK, registerResponse.StatusCode);

        // The identity changed from anonymous to authenticated, so the
        // request token must be refreshed for subsequent unsafe requests.
        return await GetAntiforgeryTokenAsync(client);
    }

    private static async Task<string> GetAntiforgeryTokenAsync(HttpClient client)
    {
        var response = await client.GetAsync("/api/security/antiforgery");
        response.EnsureSuccessStatusCode();

        using var json = JsonDocument.Parse(
            await response.Content.ReadAsStringAsync());

        return json.RootElement.GetProperty("token").GetString()!;
    }

    private static HttpRequestMessage CreateJsonRequest<T>(
        HttpMethod method,
        string path,
        T body,
        string antiforgeryToken)
    {
        var request = new HttpRequestMessage(method, path)
        {
            Content = JsonContent.Create(body)
        };

        request.Headers.Add("X-XSRF-TOKEN", antiforgeryToken);
        return request;
    }
}
