using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SakhtKhaneh.Migrations
{
    /// <inheritdoc />
    public partial class UpdateBlog2 : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "Title",
                table: "BlogCategories",
                type: "TEXT",
                nullable: false,
                defaultValue: "");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Title",
                table: "BlogCategories");
        }
    }
}
