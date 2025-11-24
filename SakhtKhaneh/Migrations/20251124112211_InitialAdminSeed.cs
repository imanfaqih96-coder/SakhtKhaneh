using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SakhtKhaneh.Migrations
{
    /// <inheritdoc />
    public partial class InitialAdminSeed : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "AdministrativeApproval",
                table: "AspNetUsers",
                type: "INTEGER",
                nullable: false,
                defaultValue: false);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "AdministrativeApproval",
                table: "AspNetUsers");
        }
    }
}
