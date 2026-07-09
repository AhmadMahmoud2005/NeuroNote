using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace NeuroNote.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddAuthRolesAndSeed : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Use conditional inserts to avoid errors when seed data already exists.
            migrationBuilder.Sql(@"

    IF NOT EXISTS (SELECT 1 FROM [Roles] WHERE [Name] = N'Guest')
        INSERT INTO [Roles] ([CreatedAt], [Description], [Name]) VALUES ('2026-01-01T00:00:00.0000000Z', N'Read-only access', N'Guest');
    IF NOT EXISTS (SELECT 1 FROM [Roles] WHERE [Name] = N'Member')
        INSERT INTO [Roles] ([CreatedAt], [Description], [Name]) VALUES ('2026-01-01T00:00:00.0000000Z', N'Workspace member access', N'Member');
    IF NOT EXISTS (SELECT 1 FROM [Roles] WHERE [Name] = N'Admin')
        INSERT INTO [Roles] ([CreatedAt], [Description], [Name]) VALUES ('2026-01-01T00:00:00.0000000Z', N'Full administrative access', N'Admin');

    IF NOT EXISTS (
        SELECT 1 FROM [UserRoles] ur
        INNER JOIN [Roles] r ON ur.RoleId = r.Id
        WHERE ur.UserId = 1 AND r.Name = N'Admin')
    BEGIN
        INSERT INTO [UserRoles] ([RoleId], [UserId], [AssignedAt])
        SELECT r.Id, 1, '2026-01-01T00:00:00.0000000Z' FROM [Roles] r WHERE r.Name = N'Admin';
    END
");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DeleteData(
                table: "Roles",
                keyColumn: "Id",
                keyValue: 1);

            migrationBuilder.DeleteData(
                table: "Roles",
                keyColumn: "Id",
                keyValue: 2);

            migrationBuilder.DeleteData(
                table: "UserRoles",
                keyColumns: new[] { "RoleId", "UserId" },
                keyValues: new object[] { 3, 1 });

            migrationBuilder.DeleteData(
                table: "Roles",
                keyColumn: "Id",
                keyValue: 3);
        }
    }
}
