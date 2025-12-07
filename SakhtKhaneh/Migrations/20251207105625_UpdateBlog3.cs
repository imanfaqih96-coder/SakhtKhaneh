using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SakhtKhaneh.Migrations
{
    /// <inheritdoc />
    public partial class UpdateBlog3 : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "EndpointPath",
                table: "BlogPosts",
                type: "TEXT",
                nullable: false,
                defaultValue: "");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "EndpointPath",
                table: "BlogPosts");
        }
    }
}
