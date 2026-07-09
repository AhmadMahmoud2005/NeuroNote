using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace NeuroNote.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddPlainTextToPage : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "PlainText",
                table: "Pages",
                type: "nvarchar(max)",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "PlainText",
                table: "Pages");
        }
    }
}
