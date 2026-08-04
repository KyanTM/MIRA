using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Mira.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddDocumentAndDateConstraints : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddCheckConstraint(
                name: "CK_Subscriptions_DateRange",
                table: "Subscriptions",
                sql: "[StartDate] IS NULL OR [EndDate] IS NULL OR [EndDate] >= [StartDate]");

            migrationBuilder.CreateIndex(
                name: "IX_Documents_StorageKey",
                table: "Documents",
                column: "StorageKey",
                unique: true,
                filter: "[StorageKey] IS NOT NULL");

            migrationBuilder.AddCheckConstraint(
                name: "CK_Documents_DateRange",
                table: "Documents",
                sql: "[IssuedOn] IS NULL OR [ExpiresOn] IS NULL OR [ExpiresOn] >= [IssuedOn]");

            migrationBuilder.AddCheckConstraint(
                name: "CK_Contracts_DateRange",
                table: "Contracts",
                sql: "[EndsOn] IS NULL OR [EndsOn] >= [StartsOn]");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropCheckConstraint(
                name: "CK_Subscriptions_DateRange",
                table: "Subscriptions");

            migrationBuilder.DropIndex(
                name: "IX_Documents_StorageKey",
                table: "Documents");

            migrationBuilder.DropCheckConstraint(
                name: "CK_Documents_DateRange",
                table: "Documents");

            migrationBuilder.DropCheckConstraint(
                name: "CK_Contracts_DateRange",
                table: "Contracts");
        }
    }
}
