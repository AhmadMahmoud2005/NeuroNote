using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace NeuroNote.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddSharedPageStatus : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTime>(
                name: "AcceptedAt",
                table: "SharedPages",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "DeclinedAt",
                table: "SharedPages",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Status",
                table: "SharedPages",
                type: "nvarchar(40)",
                maxLength: 40,
                nullable: false,
                defaultValue: "Pending");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "AcceptedAt",
                table: "SharedPages");

            migrationBuilder.DropColumn(
                name: "DeclinedAt",
                table: "SharedPages");

            migrationBuilder.DropColumn(
                name: "Status",
                table: "SharedPages");
        }
    }
}
