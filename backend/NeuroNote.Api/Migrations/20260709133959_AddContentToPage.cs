using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace NeuroNote.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddContentToPage : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "Content",
                table: "Pages",
                type: "nvarchar(max)",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Content",
                table: "Pages");
        }
    }
}
