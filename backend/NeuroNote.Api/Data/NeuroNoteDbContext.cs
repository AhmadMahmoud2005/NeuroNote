using Microsoft.EntityFrameworkCore;
using NeuroNote.Api.Models;

namespace NeuroNote.Api.Data;

public class NeuroNoteDbContext(DbContextOptions<NeuroNoteDbContext> options) : DbContext(options)
{
    public DbSet<User> Users => Set<User>();
    public DbSet<Role> Roles => Set<Role>();
    public DbSet<UserRole> UserRoles => Set<UserRole>();
    public DbSet<Workspace> Workspaces => Set<Workspace>();
    public DbSet<WorkspaceMember> WorkspaceMembers => Set<WorkspaceMember>();
    public DbSet<Invitation> Invitations => Set<Invitation>();
    public DbSet<Page> Pages => Set<Page>();
    public DbSet<Block> Blocks => Set<Block>();
    public DbSet<Comment> Comments => Set<Comment>();
    public DbSet<ActivityLog> ActivityLogs => Set<ActivityLog>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<User>(entity =>
        {
            entity.ToTable("Users");
            entity.HasKey(user => user.Id);
            entity.HasIndex(user => user.Email).IsUnique();
            entity.Property(user => user.FullName).HasMaxLength(150).IsRequired();
            entity.Property(user => user.Email).HasMaxLength(200).IsRequired();
            entity.Property(user => user.PasswordHash).HasMaxLength(255).IsRequired();
            entity.Property(user => user.Bio).HasMaxLength(1000).IsRequired();
            entity.Property(user => user.AvatarUrl).HasColumnType("nvarchar(max)").IsRequired();
            entity.Property(user => user.CreatedAt).HasDefaultValueSql("SYSUTCDATETIME()");
            entity.Property(user => user.UpdatedAt);

            entity.HasData(new User
            {
                Id = 1,
                FullName = "Alex Rivera",
                Email = "alex.rivera@example.com",
                PasswordHash = "PLACEHOLDER_HASH",
                Bio = "Focused on deep work and cognitive optimization.",
                AvatarUrl = string.Empty,
                CreatedAt = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc),
                UpdatedAt = null
            });
        });

        modelBuilder.Entity<Role>(entity =>
        {
            entity.ToTable("Roles");
            entity.HasKey(role => role.Id);
            entity.HasIndex(role => role.Name).IsUnique();
            entity.Property(role => role.Name).HasMaxLength(100).IsRequired();
            entity.Property(role => role.Description).HasMaxLength(250);
            entity.Property(role => role.CreatedAt).HasDefaultValueSql("SYSUTCDATETIME()");

            entity.HasData(
                new Role { Id = 1, Name = "Guest", Description = "Read-only access", CreatedAt = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc) },
                new Role { Id = 2, Name = "Member", Description = "Workspace member access", CreatedAt = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc) },
                new Role { Id = 3, Name = "Admin", Description = "Full administrative access", CreatedAt = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc) });
        });

        modelBuilder.Entity<UserRole>(entity =>
        {
            entity.ToTable("UserRoles");
            entity.HasKey(userRole => new { userRole.UserId, userRole.RoleId });
            entity.Property(userRole => userRole.AssignedAt).HasDefaultValueSql("SYSUTCDATETIME()");
            entity.HasOne(userRole => userRole.User)
                .WithMany(user => user.UserRoles)
                .HasForeignKey(userRole => userRole.UserId)
                .OnDelete(DeleteBehavior.Cascade);
            entity.HasOne(userRole => userRole.Role)
                .WithMany(role => role.UserRoles)
                .HasForeignKey(userRole => userRole.RoleId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasData(new UserRole
            {
                UserId = 1,
                RoleId = 3,
                AssignedAt = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc)
            });
        });

        modelBuilder.Entity<Workspace>(entity =>
        {
            entity.ToTable("Workspaces");
            entity.HasKey(workspace => workspace.Id);
            entity.HasIndex(workspace => workspace.Slug).IsUnique();
            entity.Property(workspace => workspace.Name).HasMaxLength(150).IsRequired();
            entity.Property(workspace => workspace.Slug).HasMaxLength(180).IsRequired();
            entity.Property(workspace => workspace.Description).HasMaxLength(500);
            entity.Property(workspace => workspace.CreatedAt).HasDefaultValueSql("SYSUTCDATETIME()");
            entity.Property(workspace => workspace.UpdatedAt);
            entity.HasOne(workspace => workspace.OwnerUser)
                .WithMany(user => user.OwnedWorkspaces)
                .HasForeignKey(workspace => workspace.OwnerUserId)
                .OnDelete(DeleteBehavior.NoAction);
        });

        modelBuilder.Entity<WorkspaceMember>(entity =>
        {
            entity.ToTable("WorkspaceMembers");
            entity.HasKey(member => new { member.WorkspaceId, member.UserId });
            entity.Property(member => member.MemberRole).HasMaxLength(80).IsRequired();
            entity.Property(member => member.JoinedAt).HasDefaultValueSql("SYSUTCDATETIME()");
            entity.HasOne(member => member.Workspace)
                .WithMany(workspace => workspace.Members)
                .HasForeignKey(member => member.WorkspaceId)
                .OnDelete(DeleteBehavior.Cascade);
            entity.HasOne(member => member.User)
                .WithMany(user => user.WorkspaceMembers)
                .HasForeignKey(member => member.UserId)
                .OnDelete(DeleteBehavior.NoAction);
        });

        modelBuilder.Entity<Invitation>(entity =>
        {
            entity.ToTable("Invitations");
            entity.HasKey(invitation => invitation.Id);
            entity.HasIndex(invitation => invitation.Token).IsUnique();
            entity.Property(invitation => invitation.Email).HasMaxLength(200).IsRequired();
            entity.Property(invitation => invitation.MemberRole).HasMaxLength(80).IsRequired();
            entity.Property(invitation => invitation.Token).HasMaxLength(200).IsRequired();
            entity.Property(invitation => invitation.Status).HasMaxLength(40).IsRequired();
            entity.Property(invitation => invitation.CreatedAt).HasDefaultValueSql("SYSUTCDATETIME()");
            entity.HasOne(invitation => invitation.Workspace)
                .WithMany(workspace => workspace.Invitations)
                .HasForeignKey(invitation => invitation.WorkspaceId)
                .OnDelete(DeleteBehavior.Cascade);
            entity.HasOne(invitation => invitation.InvitedByUser)
                .WithMany(user => user.InvitationsSent)
                .HasForeignKey(invitation => invitation.InvitedByUserId)
                .OnDelete(DeleteBehavior.NoAction);
        });

        modelBuilder.Entity<Page>(entity =>
        {
            entity.ToTable("Pages");
            entity.HasKey(page => page.Id);
            entity.HasIndex(page => new { page.WorkspaceId, page.Slug }).IsUnique();
            entity.Property(page => page.Title).HasMaxLength(250).IsRequired();
            entity.Property(page => page.Slug).HasMaxLength(250).IsRequired();
            entity.Property(page => page.MetadataJson).HasColumnType("nvarchar(max)");
            entity.Property(page => page.IsArchived).HasDefaultValue(false);
            entity.Property(page => page.SortOrder).HasDefaultValue(0);
            entity.Property(page => page.CreatedAt).HasDefaultValueSql("SYSUTCDATETIME()");
            entity.Property(page => page.UpdatedAt);
            entity.HasOne(page => page.Workspace)
                .WithMany(workspace => workspace.Pages)
                .HasForeignKey(page => page.WorkspaceId)
                .OnDelete(DeleteBehavior.Cascade);
            entity.HasOne(page => page.ParentPage)
                .WithMany(page => page.Children)
                .HasForeignKey(page => page.ParentPageId)
                .OnDelete(DeleteBehavior.NoAction);
            entity.HasOne(page => page.CreatedByUser)
                .WithMany(user => user.PagesCreated)
                .HasForeignKey(page => page.CreatedByUserId)
                .OnDelete(DeleteBehavior.NoAction);
        });

        modelBuilder.Entity<Block>(entity =>
        {
            entity.ToTable("Blocks");
            entity.HasKey(block => block.Id);
            entity.Property(block => block.Type).HasMaxLength(80).IsRequired();
            entity.Property(block => block.Content).HasColumnType("nvarchar(max)");
            entity.Property(block => block.SortOrder).HasDefaultValue(0);
            entity.Property(block => block.CreatedAt).HasDefaultValueSql("SYSUTCDATETIME()");
            entity.Property(block => block.UpdatedAt);
            entity.HasOne(block => block.Page)
                .WithMany(page => page.Blocks)
                .HasForeignKey(block => block.PageId)
                .OnDelete(DeleteBehavior.Cascade);
            entity.HasOne(block => block.ParentBlock)
                .WithMany(block => block.Children)
                .HasForeignKey(block => block.ParentBlockId)
                .OnDelete(DeleteBehavior.NoAction);
        });

        modelBuilder.Entity<Comment>(entity =>
        {
            entity.ToTable("Comments");
            entity.HasKey(comment => comment.Id);
            entity.Property(comment => comment.Content).HasColumnType("nvarchar(max)").IsRequired();
            entity.Property(comment => comment.CreatedAt).HasDefaultValueSql("SYSUTCDATETIME()");
            entity.Property(comment => comment.UpdatedAt);
            entity.HasOne(comment => comment.User)
                .WithMany(user => user.Comments)
                .HasForeignKey(comment => comment.UserId)
                .OnDelete(DeleteBehavior.NoAction);
            entity.HasOne(comment => comment.Page)
                .WithMany(page => page.Comments)
                .HasForeignKey(comment => comment.PageId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<ActivityLog>(entity =>
        {
            entity.ToTable("Activities");
            entity.HasKey(activity => activity.Id);
            entity.Property(activity => activity.ActionType).HasMaxLength(120).IsRequired();
            entity.Property(activity => activity.Description).HasMaxLength(500).IsRequired();
            entity.Property(activity => activity.MetadataJson).HasColumnType("nvarchar(max)");
            entity.Property(activity => activity.CreatedAt).HasDefaultValueSql("SYSUTCDATETIME()");
            entity.HasOne(activity => activity.User)
                .WithMany(user => user.ActivityLogs)
                .HasForeignKey(activity => activity.UserId)
                .OnDelete(DeleteBehavior.NoAction);
            entity.HasOne(activity => activity.Workspace)
                .WithMany(workspace => workspace.ActivityLogs)
                .HasForeignKey(activity => activity.WorkspaceId)
                .OnDelete(DeleteBehavior.NoAction);
            entity.HasOne(activity => activity.Page)
                .WithMany(page => page.ActivityLogs)
                .HasForeignKey(activity => activity.PageId)
                .OnDelete(DeleteBehavior.NoAction);
        });
    }
}
