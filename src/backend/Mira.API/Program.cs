using Microsoft.EntityFrameworkCore;
using Mira.Infrastructure.DbContexts;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http.Features;
using Microsoft.AspNetCore.Mvc;
using Mira.Infrastructure.Identity;
using Mira.Infrastructure.Repositories;
using Mira.Infrastructure.Storage;
using Mira.API.MappingProfiles;
using Mira.API.Services.Documents;
using Microsoft.OpenApi;

var builder = WebApplication.CreateBuilder(args);

var connectionString = builder.Configuration.GetConnectionString("MiraDatabase")
    ?? throw new InvalidOperationException(
        "Connection string 'MiraDatabase' was not found.");

var frontendOrigin = builder.Configuration["FrontendOrigin"] ?? throw new InvalidOperationException("FrontendOrigin was not configured");

var maxFileSizeBytes = builder.Configuration.GetValue<long?>(
        $"{DocumentUploadOptions.SectionName}:MaxFileSizeBytes")
    ?? 20 * 1024 * 1024;

if (maxFileSizeBytes <= 0)
{
    throw new InvalidOperationException(
        "DocumentUploads:MaxFileSizeBytes must be greater than zero.");
}

var configuredStorageRoot = builder.Configuration["FileStorage:RootPath"]
    ?? "App_Data/uploads";
var storageRoot = Path.IsPathRooted(configuredStorageRoot)
    ? configuredStorageRoot
    : Path.Combine(builder.Environment.ContentRootPath, configuredStorageRoot);

builder.Services.AddDbContext<MiraContext>(options =>
    options.UseSqlServer(connectionString));

builder.Services.AddIdentity<ApplicationUser, IdentityRole<Guid>>(options =>
    {
        options.User.RequireUniqueEmail = true;

        options.Password.RequiredLength = 12;
        options.Password.RequireUppercase = true;
        options.Password.RequireLowercase = true;
        options.Password.RequireDigit = true;
        options.Password.RequireNonAlphanumeric = true;
        options.Password.RequiredUniqueChars = 4;

        options.Lockout.AllowedForNewUsers = true;
        options.Lockout.MaxFailedAccessAttempts = 5;
        options.Lockout.DefaultLockoutTimeSpan = TimeSpan.FromMinutes(15);

        // Zet dit pas op true zodra e-mailbevestiging werkelijk werkt.
        options.SignIn.RequireConfirmedEmail = false;
    })
    .AddEntityFrameworkStores<MiraContext>().AddDefaultTokenProviders();

builder.Services.ConfigureApplicationCookie(options =>
{
    options.Cookie.Name = "Mira.Auth";
    options.Cookie.HttpOnly = true;
    options.Cookie.IsEssential = true;
    options.Cookie.SecurePolicy = CookieSecurePolicy.Always;

    options.Cookie.SameSite = builder.Environment.IsDevelopment()
        ? SameSiteMode.None
        : SameSiteMode.Lax;

    options.ExpireTimeSpan = TimeSpan.FromHours(8);
    options.SlidingExpiration = true;

    options.Events.OnRedirectToLogin = context =>
    {
        context.Response.StatusCode = StatusCodes.Status401Unauthorized;
        return Task.CompletedTask;
    };

    options.Events.OnRedirectToAccessDenied = context =>
    {
        context.Response.StatusCode = StatusCodes.Status403Forbidden;
        return Task.CompletedTask;
    };
});

builder.Services
    .AddAuthorizationBuilder()
    .SetFallbackPolicy(
        new AuthorizationPolicyBuilder().RequireAuthenticatedUser().Build());

builder.Services.AddCors(options =>
{
    options.AddPolicy("Angular", policy =>
    {
        policy
        .WithOrigins(frontendOrigin)
        .AllowAnyHeader()
        .AllowAnyMethod()
        .AllowCredentials();

    });
});

builder.Services.AddAntiforgery(options =>
{
    options.HeaderName = "X-XSRF-TOKEN";
    options.Cookie.Name = "Mira.Xsrf";
    options.Cookie.HttpOnly = true;
    options.Cookie.IsEssential = true;
    options.Cookie.SecurePolicy = CookieSecurePolicy.Always;

    options.Cookie.SameSite = builder.Environment.IsDevelopment() ? SameSiteMode.None : SameSiteMode.Lax;
});


builder.Services.AddControllersWithViews(options =>
{
    options.Filters.Add(new AutoValidateAntiforgeryTokenAttribute());
});

builder.Services.AddProblemDetails(options =>
{
    options.CustomizeProblemDetails = context =>
    {
        context.ProblemDetails.Extensions["traceId"] =
            context.HttpContext.TraceIdentifier;
    };
});

builder.Services.Configure<DocumentUploadOptions>(options =>
{
    options.MaxFileSizeBytes = maxFileSizeBytes;
});

builder.Services.Configure<FormOptions>(options =>
{
    options.MultipartBodyLengthLimit = maxFileSizeBytes + 1024 * 1024;
});

builder.Services.Configure<LocalFileStorageOptions>(options =>
{
    options.RootPath = storageRoot;
});

builder.Services.AddSingleton(TimeProvider.System);
builder.Services.AddScoped<IDocumentUploadValidator, DocumentUploadValidator>();
builder.Services.AddSingleton<IPrivateFileStorage, LocalPrivateFileStorage>();

builder.Services.AddScoped<IAssetRepository, AssetRepository>();

builder.Services.AddScoped<ISubscriptionRepository, SubscriptionRepository>();

builder.Services.AddScoped<IContractRepository, ContractRepository>();

builder.Services.AddScoped<IWarrantyRepository, WarrantyRepository>();

builder.Services.AddScoped<IDocumentRepository, DocumentRepository>();

builder.Services.AddScoped<IDashboardRepository, DashboardRepository>();

builder.Services.AddAutoMapper(configuration =>
{
    var licenseKey = builder.Configuration["AutoMapperKey"];

    if (!string.IsNullOrWhiteSpace(licenseKey))
    {
        configuration.LicenseKey = licenseKey;
    }
}, typeof(AssetProfile).Assembly);

builder.Services.AddSwaggerGen(options =>
{
    const string antiforgeryScheme = "XSRF";

    options.AddSecurityDefinition(antiforgeryScheme, new OpenApiSecurityScheme
    {
        Name = "X-XSRF-TOKEN",
        Type = SecuritySchemeType.ApiKey,
        In = ParameterLocation.Header,
        Description = "Haal eerst een token op via GET /api/security/antiforgery en plak het hier."
    });

    options.AddSecurityRequirement(document => new OpenApiSecurityRequirement
    {
        [new OpenApiSecuritySchemeReference(antiforgeryScheme, document)] = []
    });
});

var app = builder.Build();

app.UseExceptionHandler();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}
else
{
    app.UseHsts();
}

app.UseHttpsRedirection();

app.UseCors("Angular");

app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();

app.Run();

public partial class Program;
