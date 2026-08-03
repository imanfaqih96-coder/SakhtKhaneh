using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SakhtKhaneh.Migrations;

public partial class AddTreeTaxonomiesProjectStatusAndSocialLinks : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.AddColumn<bool>(name: "IsVisible", table: "BlogCategories", type: "INTEGER", nullable: false, defaultValue: true);
        migrationBuilder.AddColumn<int>(name: "ParentId", table: "BlogCategories", type: "INTEGER", nullable: true);
        migrationBuilder.AddColumn<string>(name: "Slug", table: "BlogCategories", type: "TEXT", maxLength: 180, nullable: false, defaultValue: "");
        migrationBuilder.AddColumn<int>(name: "SortOrder", table: "BlogCategories", type: "INTEGER", nullable: false, defaultValue: 0);

        migrationBuilder.Sql("""
            UPDATE "BlogCategories"
            SET "Slug" = 'category-' || "Id"
            WHERE trim(coalesce("Slug", '')) = '';
            """);

        migrationBuilder.CreateTable(
            name: "ProjectCategories",
            columns: table => new
            {
                Id = table.Column<Guid>(type: "TEXT", nullable: false),
                ParentId = table.Column<Guid>(type: "TEXT", nullable: true),
                Title = table.Column<string>(type: "TEXT", maxLength: 180, nullable: false),
                Slug = table.Column<string>(type: "TEXT", maxLength: 180, nullable: false),
                SortOrder = table.Column<int>(type: "INTEGER", nullable: false),
                IsVisible = table.Column<bool>(type: "INTEGER", nullable: false, defaultValue: true)
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_ProjectCategories", x => x.Id);
                table.ForeignKey(
                    name: "FK_ProjectCategories_ProjectCategories_ParentId",
                    column: x => x.ParentId,
                    principalTable: "ProjectCategories",
                    principalColumn: "Id",
                    onDelete: ReferentialAction.Restrict);
            });

        migrationBuilder.CreateTable(
            name: "SocialLinks",
            columns: table => new
            {
                Id = table.Column<Guid>(type: "TEXT", nullable: false),
                Platform = table.Column<string>(type: "TEXT", maxLength: 80, nullable: false),
                Title = table.Column<string>(type: "TEXT", maxLength: 120, nullable: false),
                Url = table.Column<string>(type: "TEXT", maxLength: 1000, nullable: false),
                Username = table.Column<string>(type: "TEXT", maxLength: 250, nullable: true),
                IconName = table.Column<string>(type: "TEXT", maxLength: 80, nullable: true),
                SortOrder = table.Column<int>(type: "INTEGER", nullable: false),
                IsVisible = table.Column<bool>(type: "INTEGER", nullable: false, defaultValue: true)
            },
            constraints: table => table.PrimaryKey("PK_SocialLinks", x => x.Id));

        migrationBuilder.AddColumn<Guid>(name: "CategoryId", table: "Projects", type: "TEXT", nullable: true);
        migrationBuilder.AddColumn<int>(name: "Status", table: "Projects", type: "INTEGER", nullable: false, defaultValue: 2);

        migrationBuilder.CreateIndex(name: "IX_BlogCategories_ParentId_SortOrder", table: "BlogCategories", columns: new[] { "ParentId", "SortOrder" });
        migrationBuilder.CreateIndex(name: "IX_BlogCategories_Slug", table: "BlogCategories", column: "Slug", unique: true);
        migrationBuilder.CreateIndex(name: "IX_ProjectCategories_ParentId_SortOrder", table: "ProjectCategories", columns: new[] { "ParentId", "SortOrder" });
        migrationBuilder.CreateIndex(name: "IX_ProjectCategories_Slug", table: "ProjectCategories", column: "Slug", unique: true);
        migrationBuilder.CreateIndex(name: "IX_Projects_CategoryId", table: "Projects", column: "CategoryId");
        migrationBuilder.CreateIndex(name: "IX_SocialLinks_IsVisible_SortOrder", table: "SocialLinks", columns: new[] { "IsVisible", "SortOrder" });

        migrationBuilder.AddForeignKey(
            name: "FK_BlogCategories_BlogCategories_ParentId",
            table: "BlogCategories",
            column: "ParentId",
            principalTable: "BlogCategories",
            principalColumn: "Id",
            onDelete: ReferentialAction.Restrict);

        migrationBuilder.AddForeignKey(
            name: "FK_Projects_ProjectCategories_CategoryId",
            table: "Projects",
            column: "CategoryId",
            principalTable: "ProjectCategories",
            principalColumn: "Id",
            onDelete: ReferentialAction.SetNull);
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropForeignKey(name: "FK_BlogCategories_BlogCategories_ParentId", table: "BlogCategories");
        migrationBuilder.DropForeignKey(name: "FK_Projects_ProjectCategories_CategoryId", table: "Projects");
        migrationBuilder.DropTable(name: "SocialLinks");
        migrationBuilder.DropTable(name: "ProjectCategories");
        migrationBuilder.DropIndex(name: "IX_BlogCategories_ParentId_SortOrder", table: "BlogCategories");
        migrationBuilder.DropIndex(name: "IX_BlogCategories_Slug", table: "BlogCategories");
        migrationBuilder.DropIndex(name: "IX_Projects_CategoryId", table: "Projects");
        migrationBuilder.DropColumn(name: "CategoryId", table: "Projects");
        migrationBuilder.DropColumn(name: "Status", table: "Projects");
        migrationBuilder.DropColumn(name: "IsVisible", table: "BlogCategories");
        migrationBuilder.DropColumn(name: "ParentId", table: "BlogCategories");
        migrationBuilder.DropColumn(name: "Slug", table: "BlogCategories");
        migrationBuilder.DropColumn(name: "SortOrder", table: "BlogCategories");
    }
}
