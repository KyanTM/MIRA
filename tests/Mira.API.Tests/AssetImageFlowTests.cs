using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text;
using System.Text.Json;
using Microsoft.AspNetCore.Mvc.Testing;
using Xunit;

namespace Mira.API.Tests;

public sealed class AssetImageFlowTests : IClassFixture<MiraApiFactory>
{
    // A generated, transparent 1x1 RGBA PNG, including valid chunk checksums.
    private static readonly byte[] ImageBytes = Convert.FromBase64String(
        "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAC0lEQVR4nGNgAAIAAAUAAXpeqz8AAAAASUVORK5CYII=");

    private readonly MiraApiFactory _factory;

    public AssetImageFlowTests(MiraApiFactory factory)
    {
        _factory = factory;
    }

    [Fact]
    public async Task AssetImagesRemainPrivateAndUnlinkingPreservesTheOriginalFile()
    {
        using var ownerClient = CreateClient();
        using var otherClient = CreateClient();
        var ownerToken = await RegisterAsync(ownerClient, "image-owner");
        var otherToken = await RegisterAsync(otherClient, "image-other");
        var assetId = await CreateAssetAsync(ownerClient, ownerToken);

        using var uploadRequest = CreateUploadRequest(
            assetId,
            ownerToken,
            "PrimaryImage");
        using var uploadResponse = await ownerClient.SendAsync(uploadRequest);
        Assert.Equal(HttpStatusCode.Created, uploadResponse.StatusCode);

        using var uploadJson = JsonDocument.Parse(
            await uploadResponse.Content.ReadAsStringAsync());
        var documentId = uploadJson.RootElement.GetProperty("id").GetGuid();
        AssertImageLink(uploadJson.RootElement, assetId, "PrimaryImage");

        using var detailResponse = await ownerClient.GetAsync($"/api/documents/{documentId}");
        Assert.Equal(HttpStatusCode.OK, detailResponse.StatusCode);
        using var detailJson = JsonDocument.Parse(
            await detailResponse.Content.ReadAsStringAsync());
        AssertImageLink(detailJson.RootElement, assetId, "PrimaryImage");

        using var listResponse = await ownerClient.GetAsync(
            $"/api/documents?itemId={assetId}&includeArchived=true");
        Assert.Equal(HttpStatusCode.OK, listResponse.StatusCode);
        using var listJson = JsonDocument.Parse(
            await listResponse.Content.ReadAsStringAsync());
        var imageSummary = Assert.Single(listJson.RootElement.EnumerateArray());
        Assert.Equal(documentId, imageSummary.GetProperty("id").GetGuid());
        Assert.Equal("image/png", imageSummary.GetProperty("mimeType").GetString());
        Assert.Equal(ImageBytes.Length, imageSummary.GetProperty("fileSizeBytes").GetInt32());

        using var downloadResponse = await ownerClient.GetAsync(
            $"/api/documents/{documentId}/download");
        Assert.Equal(HttpStatusCode.OK, downloadResponse.StatusCode);
        Assert.Equal("image/png", downloadResponse.Content.Headers.ContentType?.MediaType);
        Assert.Equal(ImageBytes, await downloadResponse.Content.ReadAsByteArrayAsync());
        Assert.Equal("attachment", downloadResponse.Content.Headers.ContentDisposition?.DispositionType);
        Assert.True(downloadResponse.Headers.CacheControl?.Private);
        Assert.True(downloadResponse.Headers.CacheControl?.NoStore);
        Assert.Contains("nosniff", downloadResponse.Headers.GetValues("X-Content-Type-Options"));

        using var otherDetailResponse = await otherClient.GetAsync($"/api/documents/{documentId}");
        using var otherDownloadResponse = await otherClient.GetAsync(
            $"/api/documents/{documentId}/download");
        using var otherLinkRequest = CreateJsonRequest(
            HttpMethod.Put,
            $"/api/documents/{documentId}/links/{assetId}",
            new { role = "GalleryImage" },
            otherToken);
        using var otherLinkResponse = await otherClient.SendAsync(otherLinkRequest);
        using var otherUnlinkRequest = CreateAntiforgeryRequest(
            HttpMethod.Delete,
            $"/api/documents/{documentId}/links/{assetId}",
            otherToken);
        using var otherUnlinkResponse = await otherClient.SendAsync(otherUnlinkRequest);

        Assert.Equal(HttpStatusCode.NotFound, otherDetailResponse.StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, otherDownloadResponse.StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, otherLinkResponse.StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, otherUnlinkResponse.StatusCode);

        using var otherListResponse = await otherClient.GetAsync(
            $"/api/documents?itemId={assetId}&includeArchived=true");
        Assert.Equal(HttpStatusCode.OK, otherListResponse.StatusCode);
        using var otherListJson = JsonDocument.Parse(
            await otherListResponse.Content.ReadAsStringAsync());
        Assert.Empty(otherListJson.RootElement.EnumerateArray());

        using var duplicatePrimaryRequest = CreateUploadRequest(
            assetId,
            ownerToken,
            "PrimaryImage");
        using var duplicatePrimaryResponse = await ownerClient.SendAsync(duplicatePrimaryRequest);
        Assert.Equal(HttpStatusCode.Conflict, duplicatePrimaryResponse.StatusCode);

        using var galleryRequest = CreateUploadRequest(assetId, ownerToken, "GalleryImage");
        using var galleryResponse = await ownerClient.SendAsync(galleryRequest);
        Assert.Equal(HttpStatusCode.Created, galleryResponse.StatusCode);
        using var galleryJson = JsonDocument.Parse(
            await galleryResponse.Content.ReadAsStringAsync());
        var galleryId = galleryJson.RootElement.GetProperty("id").GetGuid();
        AssertImageLink(galleryJson.RootElement, assetId, "GalleryImage");

        using var unlinkRequest = CreateAntiforgeryRequest(
            HttpMethod.Delete,
            $"/api/documents/{documentId}/links/{assetId}",
            ownerToken);
        using var unlinkResponse = await ownerClient.SendAsync(unlinkRequest);
        Assert.Equal(HttpStatusCode.NoContent, unlinkResponse.StatusCode);

        using var unlinkedDetailResponse = await ownerClient.GetAsync($"/api/documents/{documentId}");
        Assert.Equal(HttpStatusCode.OK, unlinkedDetailResponse.StatusCode);
        using var unlinkedDetailJson = JsonDocument.Parse(
            await unlinkedDetailResponse.Content.ReadAsStringAsync());
        Assert.Empty(unlinkedDetailJson.RootElement.GetProperty("links").EnumerateArray());

        using var preservedDownloadResponse = await ownerClient.GetAsync(
            $"/api/documents/{documentId}/download");
        Assert.Equal(HttpStatusCode.OK, preservedDownloadResponse.StatusCode);
        Assert.Equal(ImageBytes, await preservedDownloadResponse.Content.ReadAsByteArrayAsync());

        using var remainingImagesResponse = await ownerClient.GetAsync(
            $"/api/documents?itemId={assetId}&includeArchived=true");
        Assert.Equal(HttpStatusCode.OK, remainingImagesResponse.StatusCode);
        using var remainingImagesJson = JsonDocument.Parse(
            await remainingImagesResponse.Content.ReadAsStringAsync());
        var remainingImage = Assert.Single(remainingImagesJson.RootElement.EnumerateArray());
        Assert.Equal(galleryId, remainingImage.GetProperty("id").GetGuid());

        // Unlinking the previous primary also makes its slot available again.
        using var promoteRequest = CreateJsonRequest(
            HttpMethod.Put,
            $"/api/documents/{galleryId}/links/{assetId}",
            new { role = "PrimaryImage" },
            ownerToken);
        using var promoteResponse = await ownerClient.SendAsync(promoteRequest);
        Assert.Equal(HttpStatusCode.OK, promoteResponse.StatusCode);
        using var promotedLinkJson = JsonDocument.Parse(
            await promoteResponse.Content.ReadAsStringAsync());
        Assert.Equal("PrimaryImage", promotedLinkJson.RootElement.GetProperty("role").GetString());
    }

    [Theory]
    [InlineData("not-an-image.png", "image/png")]
    [InlineData("not-an-image.jpg", "image/jpeg")]
    public async Task ImageWithMismatchedContentReturnsFileValidationError(
        string fileName,
        string mimeType)
    {
        using var client = CreateClient();
        var antiforgeryToken = await RegisterAsync(client, "invalid-image");
        var assetId = await CreateAssetAsync(client, antiforgeryToken);
        using var uploadRequest = CreateUploadRequest(
            assetId,
            antiforgeryToken,
            "PrimaryImage",
            fileName,
            mimeType,
            Encoding.UTF8.GetBytes("This is plain text, not an image."));

        using var response = await client.SendAsync(uploadRequest);

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        Assert.Equal("application/problem+json", response.Content.Headers.ContentType?.MediaType);
        using var validationJson = JsonDocument.Parse(await response.Content.ReadAsStringAsync());
        var fileErrors = validationJson.RootElement.GetProperty("errors").GetProperty("File");
        Assert.NotEmpty(fileErrors.EnumerateArray());

        using var listResponse = await client.GetAsync($"/api/documents?itemId={assetId}");
        Assert.Equal(HttpStatusCode.OK, listResponse.StatusCode);
        using var listJson = JsonDocument.Parse(await listResponse.Content.ReadAsStringAsync());
        Assert.Empty(listJson.RootElement.EnumerateArray());
    }

    private HttpClient CreateClient()
    {
        return _factory.CreateClient(new WebApplicationFactoryClientOptions
        {
            BaseAddress = new Uri("https://localhost"),
            AllowAutoRedirect = false,
            HandleCookies = true
        });
    }

    private static void AssertImageLink(JsonElement document, Guid assetId, string role)
    {
        Assert.Equal("Image", document.GetProperty("documentType").GetString());
        Assert.Equal("image/png", document.GetProperty("mimeType").GetString());
        var link = Assert.Single(document.GetProperty("links").EnumerateArray());
        Assert.Equal(assetId, link.GetProperty("itemId").GetGuid());
        Assert.Equal(role, link.GetProperty("role").GetString());
    }

    private static async Task<Guid> CreateAssetAsync(HttpClient client, string antiforgeryToken)
    {
        using var request = CreateJsonRequest(
            HttpMethod.Post,
            "/api/assets",
            new { name = "Toestel met privé-afbeeldingen" },
            antiforgeryToken);
        using var response = await client.SendAsync(request);
        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        using var json = JsonDocument.Parse(await response.Content.ReadAsStringAsync());
        return json.RootElement.GetProperty("id").GetGuid();
    }

    private static async Task<string> RegisterAsync(HttpClient client, string emailPrefix)
    {
        var anonymousToken = await GetAntiforgeryTokenAsync(client);
        using var request = CreateJsonRequest(
            HttpMethod.Post,
            "/api/auth/register",
            new
            {
                email = $"{emailPrefix}-{Guid.NewGuid():N}@example.com",
                password = "Strong!Pass1234"
            },
            anonymousToken);
        using var response = await client.SendAsync(request);
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        // Authentication changes the identity bound to the antiforgery token.
        return await GetAntiforgeryTokenAsync(client);
    }

    private static async Task<string> GetAntiforgeryTokenAsync(HttpClient client)
    {
        using var response = await client.GetAsync("/api/security/antiforgery");
        response.EnsureSuccessStatusCode();
        using var json = JsonDocument.Parse(await response.Content.ReadAsStringAsync());
        return json.RootElement.GetProperty("token").GetString()!;
    }

    private static HttpRequestMessage CreateUploadRequest(
        Guid assetId,
        string antiforgeryToken,
        string role,
        string fileName = "asset-photo.png",
        string mimeType = "image/png",
        byte[]? bytes = null)
    {
        var multipart = new MultipartFormDataContent();
        var fileContent = new ByteArrayContent(bytes ?? ImageBytes);
        fileContent.Headers.ContentType = new MediaTypeHeaderValue(mimeType);
        multipart.Add(fileContent, "File", fileName);
        multipart.Add(new StringContent("Image"), "DocumentType");
        multipart.Add(new StringContent(assetId.ToString()), "ItemId");
        multipart.Add(new StringContent(role), "Role");

        var request = CreateAntiforgeryRequest(HttpMethod.Post, "/api/documents", antiforgeryToken);
        request.Content = multipart;
        return request;
    }

    private static HttpRequestMessage CreateJsonRequest<T>(
        HttpMethod method,
        string path,
        T body,
        string antiforgeryToken)
    {
        var request = CreateAntiforgeryRequest(method, path, antiforgeryToken);
        request.Content = JsonContent.Create(body);
        return request;
    }

    private static HttpRequestMessage CreateAntiforgeryRequest(
        HttpMethod method,
        string path,
        string antiforgeryToken)
    {
        var request = new HttpRequestMessage(method, path);
        request.Headers.Add("X-XSRF-TOKEN", antiforgeryToken);
        return request;
    }
}
