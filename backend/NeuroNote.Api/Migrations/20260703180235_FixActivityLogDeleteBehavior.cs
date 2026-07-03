using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace NeuroNote.Api.Migrations
{
    /// <inheritdoc />
    public partial class FixActivityLogDeleteBehavior : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Activities_Pages_PageId",
                table: "Activities");

            migrationBuilder.DropForeignKey(
                name: "FK_Activities_Workspaces_WorkspaceId",
                table: "Activities");

            migrationBuilder.AddForeignKey(
                name: "FK_Activities_Pages_PageId",
                table: "Activities",
                column: "PageId",
                principalTable: "Pages",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_Activities_Workspaces_WorkspaceId",
                table: "Activities",
                column: "WorkspaceId",
                principalTable: "Workspaces",
                principalColumn: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Activities_Pages_PageId",
                table: "Activities");

            migrationBuilder.DropForeignKey(
                name: "FK_Activities_Workspaces_WorkspaceId",
                table: "Activities");

            migrationBuilder.AddForeignKey(
                name: "FK_Activities_Pages_PageId",
                table: "Activities",
                column: "PageId",
                principalTable: "Pages",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);

            migrationBuilder.AddForeignKey(
                name: "FK_Activities_Workspaces_WorkspaceId",
                table: "Activities",
                column: "WorkspaceId",
                principalTable: "Workspaces",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);
        }
    }
}
