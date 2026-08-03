using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SakhtKhaneh.Migrations;

public partial class ImproveSecurityAndAddJournals : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.AddColumn<DateTime>(
            name: "LastLoginAt",
            table: "AspNetUsers",
            type: "TEXT",
            nullable: true);

        migrationBuilder.AddColumn<bool>(
            name: "MustChangePassword",
            table: "AspNetUsers",
            type: "INTEGER",
            nullable: false,
            defaultValue: false);

        migrationBuilder.AddColumn<DateTime>(
            name: "PasswordChangedAt",
            table: "AspNetUsers",
            type: "TEXT",
            nullable: true);


        migrationBuilder.AddColumn<string>(
            name: "Tags",
            table: "BlogPosts",
            type: "TEXT",
            nullable: true);

        migrationBuilder.AddColumn<string>(
            name: "SeoTitle",
            table: "BlogPosts",
            type: "TEXT",
            nullable: true);

        migrationBuilder.AddColumn<string>(
            name: "MetaDescription",
            table: "BlogPosts",
            type: "TEXT",
            nullable: true);

        migrationBuilder.AddColumn<string>(
            name: "ImageAlt",
            table: "BlogPosts",
            type: "TEXT",
            nullable: true);

        migrationBuilder.AddColumn<string>(
            name: "SeoTitle",
            table: "Projects",
            type: "TEXT",
            nullable: true);

        migrationBuilder.AddColumn<string>(
            name: "MetaDescription",
            table: "Projects",
            type: "TEXT",
            nullable: true);

        migrationBuilder.AddColumn<string>(
            name: "CoverImageAlt",
            table: "Projects",
            type: "TEXT",
            nullable: true);

        migrationBuilder.CreateTable(
            name: "Journals",
            columns: table => new
            {
                Id = table.Column<Guid>(type: "TEXT", nullable: false),
                EndpointPath = table.Column<string>(type: "TEXT", maxLength: 180, nullable: false),
                Title = table.Column<string>(type: "TEXT", maxLength: 250, nullable: false),
                Description = table.Column<string>(type: "TEXT", nullable: false),
                ImageUrl = table.Column<string>(type: "TEXT", nullable: false),
                ImageAlt = table.Column<string>(type: "TEXT", nullable: false),
                Tags = table.Column<string>(type: "TEXT", nullable: true),
                Author = table.Column<string>(type: "TEXT", maxLength: 150, nullable: false),
                CreationDate = table.Column<DateTime>(type: "TEXT", nullable: false),
                LastUpdateDate = table.Column<DateTime>(type: "TEXT", nullable: true),
                IsPublished = table.Column<bool>(type: "INTEGER", nullable: false, defaultValue: true)
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_Journals", x => x.Id);
            });

        migrationBuilder.CreateIndex(
            name: "IX_BlogPosts_CreationDate",
            table: "BlogPosts",
            column: "CreationDate");

        migrationBuilder.CreateIndex(
            name: "IX_BlogPosts_EndpointPath",
            table: "BlogPosts",
            column: "EndpointPath");

        migrationBuilder.CreateIndex(
            name: "IX_Projects_Endpoint_Path",
            table: "Projects",
            column: "Endpoint_Path");

        migrationBuilder.CreateIndex(
            name: "IX_TemplateProperties_Path_Key",
            table: "TemplateProperties",
            columns: new[] { "Path", "Key" });

        migrationBuilder.CreateIndex(
            name: "IX_Visits_Path",
            table: "Visits",
            column: "Path");

        migrationBuilder.CreateIndex(
            name: "IX_Visits_Time",
            table: "Visits",
            column: "Time");

        migrationBuilder.CreateIndex(
            name: "IX_Journals_EndpointPath",
            table: "Journals",
            column: "EndpointPath",
            unique: true);

        migrationBuilder.CreateIndex(
            name: "IX_Journals_IsPublished_CreationDate",
            table: "Journals",
            columns: new[] { "IsPublished", "CreationDate" });

        // Existing rows remain usable. Only the three newly seeded administrators are forced to change password.
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropTable(name: "Journals");

        migrationBuilder.DropIndex(name: "IX_BlogPosts_CreationDate", table: "BlogPosts");
        migrationBuilder.DropIndex(name: "IX_BlogPosts_EndpointPath", table: "BlogPosts");
        migrationBuilder.DropIndex(name: "IX_Projects_Endpoint_Path", table: "Projects");
        migrationBuilder.DropIndex(name: "IX_TemplateProperties_Path_Key", table: "TemplateProperties");
        migrationBuilder.DropIndex(name: "IX_Visits_Path", table: "Visits");
        migrationBuilder.DropIndex(name: "IX_Visits_Time", table: "Visits");


        migrationBuilder.DropColumn(name: "Tags", table: "BlogPosts");
        migrationBuilder.DropColumn(name: "SeoTitle", table: "BlogPosts");
        migrationBuilder.DropColumn(name: "MetaDescription", table: "BlogPosts");
        migrationBuilder.DropColumn(name: "ImageAlt", table: "BlogPosts");
        migrationBuilder.DropColumn(name: "SeoTitle", table: "Projects");
        migrationBuilder.DropColumn(name: "MetaDescription", table: "Projects");
        migrationBuilder.DropColumn(name: "CoverImageAlt", table: "Projects");

        migrationBuilder.DropColumn(name: "LastLoginAt", table: "AspNetUsers");
        migrationBuilder.DropColumn(name: "MustChangePassword", table: "AspNetUsers");
        migrationBuilder.DropColumn(name: "PasswordChangedAt", table: "AspNetUsers");
    }
}
