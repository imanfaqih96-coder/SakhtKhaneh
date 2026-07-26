using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SakhtKhaneh.Migrations
{
    /// <inheritdoc />
    public partial class ProjectSecondMigration : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "EndDate",
                table: "Projects");

            migrationBuilder.RenameColumn(
                name: "StartDate",
                table: "Projects",
                newName: "Time");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "Time",
                table: "Projects",
                newName: "StartDate");

            migrationBuilder.AddColumn<DateTime>(
                name: "EndDate",
                table: "Projects",
                type: "TEXT",
                nullable: true);
        }
    }
}
