using Microsoft.EntityFrameworkCore;
using Mira.Infrastructure.DbContexts;

var builder = WebApplication.CreateBuilder(args);

var connectionString = builder.Configuration.GetConnectionString("MiraDatabase")
    ?? throw new InvalidOperationException(
        "Connection string 'MiraDatabase' was not found.");

builder.Services.AddDbContext<MiraContext>(options =>
    options.UseSqlServer(connectionString));
builder.Services.AddControllers();
builder.Services.AddSwaggerGen();

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();
app.UseAuthorization();
app.MapControllers();

app.Run();
