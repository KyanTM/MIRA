using Microsoft.EntityFrameworkCore;
using Mira.Infrastructure.DbContexts;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Mira.Infrastructure.Identity;
using Mira.Infrastructure.Repositories;
using Mira.API.MappingProfiles;
using Microsoft.OpenApi;

var builder = WebApplication.CreateBuilder(args);

var connectionString = builder.Configuration.GetConnectionString("MiraDatabase")
    ?? throw new InvalidOperationException(
        "Connection string 'MiraDatabase' was not found.");

var frontendOrigin = builder.Configuration["FrontendOrigin"] ?? throw new InvalidOperationException("FrontendOrigin was not configured");

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
    options.Cookie.SecurePolicy = CookieSecurePolicy.Always;

    options.Cookie.SameSite = builder.Environment.IsDevelopment()
        ? SameSiteMode.None
        : SameSiteMode.Lax;

    options.ExpireTimeSpan = TimeSpan.FromHours(8);
    options.SlidingExpiration = true;
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
    options.Cookie.SecurePolicy = CookieSecurePolicy.Always;

    options.Cookie.SameSite = builder.Environment.IsDevelopment() ? SameSiteMode.None : SameSiteMode.Lax;
});


builder.Services.AddControllersWithViews(options =>
{
    options.Filters.Add(new AutoValidateAntiforgeryTokenAttribute());
});

builder.Services.AddScoped<IAssetRepository, AssetRepository>();

builder.Services.AddScoped<ISubscriptionRepository, SubscriptionRepository>();

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

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();

app.UseCors("Angular");

app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();

app.Run();
