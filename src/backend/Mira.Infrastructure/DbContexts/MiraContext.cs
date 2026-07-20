using Microsoft.EntityFrameworkCore;
using Mira.Domain.Entities;

namespace Mira.Infrastructure.DbContexts;

public class MiraContext(DbContextOptions<MiraContext> options) : DbContext(options)
{
    public DbSet<Item> Items => Set<Item>();
    public DbSet<Asset> Assets => Set<Asset>();
    public DbSet<Document> Documents => Set<Document>();
    public DbSet<Warranty> Warranties => Set<Warranty>();
    public DbSet<Contract> Contracts => Set<Contract>();
    public DbSet<Subscription> Subscriptions => Set<Subscription>();
    public DbSet<ItemDocument> ItemDocuments => Set<ItemDocument>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        ConfigureInheritance(modelBuilder);
        ConfigureValueConversions(modelBuilder);
        ConfigureRelationships(modelBuilder);
        ConfigureIndexes(modelBuilder);
        ConfigureCheckConstraints(modelBuilder);
    }

    private static void ConfigureInheritance(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Item>()
            .UseTptMappingStrategy()
            .ToTable("Items");

        modelBuilder.Entity<Asset>().ToTable("Assets");
        modelBuilder.Entity<Document>().ToTable("Documents");
        modelBuilder.Entity<Warranty>().ToTable("Warranties");
        modelBuilder.Entity<Contract>().ToTable("Contracts");
        modelBuilder.Entity<Subscription>().ToTable("Subscriptions");
    }

    private static void ConfigureValueConversions(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Item>()
            .Property(item => item.Status)
            .HasConversion<string>()
            .HasMaxLength(32);

        modelBuilder.Entity<Document>()
            .Property(document => document.DocumentType)
            .HasConversion<string>()
            .HasMaxLength(50);

        modelBuilder.Entity<Subscription>()
            .Property(subscription => subscription.BillingFrequency)
            .HasConversion<string>()
            .HasMaxLength(32);

        modelBuilder.Entity<Contract>()
            .Property(contract => contract.BillingFrequency)
            .HasConversion<string>()
            .HasMaxLength(32);

        modelBuilder.Entity<ItemDocument>()
            .Property(link => link.Role)
            .HasConversion<string>()
            .HasMaxLength(32);
    }

    private static void ConfigureRelationships(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<ItemDocument>()
            .HasKey(link => new { link.ItemId, link.DocumentId });

        modelBuilder.Entity<ItemDocument>()
            .HasOne(link => link.Item)
            .WithMany(item => item.DocumentLinks)
            .HasForeignKey(link => link.ItemId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<ItemDocument>()
            .HasOne(link => link.Document)
            .WithMany(document => document.ItemLinks)
            .HasForeignKey(link => link.DocumentId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<Warranty>()
            .HasOne(warranty => warranty.Asset)
            .WithMany(asset => asset.Warranties)
            .HasForeignKey(warranty => warranty.AssetId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<Subscription>()
            .HasOne(subscription => subscription.Contract)
            .WithMany(contract => contract.Subscriptions)
            .HasForeignKey(subscription => subscription.ContractId)
            .OnDelete(DeleteBehavior.SetNull);
    }

    private static void ConfigureIndexes(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Item>().HasIndex(item => item.UserId);
        modelBuilder.Entity<Item>().HasIndex(item => new { item.UserId, item.Status });
        modelBuilder.Entity<Asset>().HasIndex(asset => asset.SerialNumber);
        modelBuilder.Entity<Document>().HasIndex(document => document.Checksum);
        modelBuilder.Entity<Document>().HasIndex(document => document.ExpiresOn);
        modelBuilder.Entity<Warranty>().HasIndex(warranty => warranty.EndsOn);
        modelBuilder.Entity<Contract>().HasIndex(contract => contract.EndsOn);
        modelBuilder.Entity<Contract>().HasIndex(contract => contract.CancellationDeadline);
        modelBuilder.Entity<Subscription>().HasIndex(subscription => subscription.NextBillingDate);

        modelBuilder.Entity<ItemDocument>()
            .HasIndex(link => new { link.ItemId, link.Role })
            .IsUnique()
            .HasFilter("[Role] = 'PrimaryImage'");
    }

    private static void ConfigureCheckConstraints(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Asset>()
            .ToTable("Assets", table =>
            {
                table.HasCheckConstraint(
                    "CK_Assets_PurchasePrice_NonNegative",
                    "[PurchasePrice] IS NULL OR [PurchasePrice] >= 0");
                table.HasCheckConstraint(
                    "CK_Assets_CurrentValue_NonNegative",
                    "[CurrentValue] IS NULL OR [CurrentValue] >= 0");
            });

        modelBuilder.Entity<Document>()
            .ToTable("Documents", table =>
                table.HasCheckConstraint(
                    "CK_Documents_FileSizeBytes_Positive",
                    "[FileSizeBytes] > 0"));

        modelBuilder.Entity<Warranty>()
            .ToTable("Warranties", table =>
                table.HasCheckConstraint(
                    "CK_Warranties_DateRange",
                    "[EndsOn] >= [StartsOn]"));

        modelBuilder.Entity<Contract>()
            .ToTable("Contracts", table =>
            {
                table.HasCheckConstraint(
                    "CK_Contracts_Cost_NonNegative",
                    "[Cost] IS NULL OR [Cost] >= 0");
                table.HasCheckConstraint(
                    "CK_Contracts_CancellationNoticeDays_NonNegative",
                    "[CancellationNoticeDays] IS NULL OR [CancellationNoticeDays] >= 0");
                table.HasCheckConstraint(
                    "CK_Contracts_RenewalPeriodMonths_Positive",
                    "[RenewalPeriodMonths] IS NULL OR [RenewalPeriodMonths] > 0");
            });

        modelBuilder.Entity<Subscription>()
            .ToTable("Subscriptions", table =>
            {
                table.HasCheckConstraint(
                    "CK_Subscriptions_Price_NonNegative",
                    "[Price] >= 0");
                table.HasCheckConstraint(
                    "CK_Subscriptions_CancellationNoticeDays_NonNegative",
                    "[CancellationNoticeDays] IS NULL OR [CancellationNoticeDays] >= 0");
            });

        modelBuilder.Entity<ItemDocument>()
            .ToTable("ItemDocuments", table =>
                table.HasCheckConstraint(
                    "CK_ItemDocuments_NoSelfReference",
                    "[ItemId] <> [DocumentId]"));
    }
}
