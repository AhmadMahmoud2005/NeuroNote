using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using NeuroNote.Api.Data;
using NeuroNote.Api.Dtos;
using NeuroNote.Api.Models;

namespace NeuroNote.Api.Services;

public class AuthService : IAuthService
{
    private const string MemberRoleName = "Member";

    private readonly NeuroNoteDbContext dbContext;
    private readonly IConfiguration configuration;
    private readonly IPasswordHasher<User> passwordHasher;
    private readonly IActivityLogService activityLogService;

    public AuthService(
        NeuroNoteDbContext dbContext,
        IConfiguration configuration,
        IPasswordHasher<User> passwordHasher,
        IActivityLogService activityLogService)
    {
        this.dbContext = dbContext;
        this.configuration = configuration;
        this.passwordHasher = passwordHasher;
        this.activityLogService = activityLogService;
    }

    public async Task<AuthResponse?> LoginAsync(AuthLoginRequest request, CancellationToken cancellationToken = default)
    {
        var user = await dbContext.Users
            .Include(candidate => candidate.UserRoles)
                .ThenInclude(userRole => userRole.Role)
            .FirstOrDefaultAsync(candidate => candidate.Email == NormalizeEmail(request.Email), cancellationToken);

        if (user is null)
        {
            return null;
        }

        var passwordVerification = passwordHasher.VerifyHashedPassword(user, user.PasswordHash, request.Password);
        if (passwordVerification == PasswordVerificationResult.Failed)
        {
            return null;
        }

        await activityLogService.RecordAsync(user.Id, "UserLoggedIn", $"{user.FullName} signed in.", cancellationToken: cancellationToken);

        return BuildAuthResponse(user);
    }

    public async Task<AuthResponse?> RegisterAsync(AuthRegisterRequest request, CancellationToken cancellationToken = default)
    {
        var email = NormalizeEmail(request.Email);
        var emailExists = await dbContext.Users.AnyAsync(candidate => candidate.Email == email, cancellationToken);

        if (emailExists)
        {
            return null;
        }

        var memberRole = await EnsureRoleAsync(MemberRoleName, cancellationToken);

        var user = new User
        {
            FullName = request.FullName.Trim(),
            Email = email,
            Bio = string.Empty,
            AvatarUrl = string.Empty,
            PasswordHash = string.Empty,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = null
        };

        user.PasswordHash = passwordHasher.HashPassword(user, request.Password);

        dbContext.Users.Add(user);
        await dbContext.SaveChangesAsync(cancellationToken);

        dbContext.UserRoles.Add(new UserRole
        {
            UserId = user.Id,
            RoleId = memberRole.Id,
            AssignedAt = DateTime.UtcNow
        });

        await dbContext.SaveChangesAsync(cancellationToken);

        await dbContext.Entry(user).Collection(candidate => candidate.UserRoles).Query().Include(userRole => userRole.Role).LoadAsync(cancellationToken);

        await activityLogService.RecordAsync(user.Id, "UserRegistered", $"{user.FullName} registered an account.", cancellationToken: cancellationToken);

        return BuildAuthResponse(user);
    }

    private async Task<Role> EnsureRoleAsync(string roleName, CancellationToken cancellationToken)
    {
        var role = await dbContext.Roles.FirstOrDefaultAsync(candidate => candidate.Name == roleName, cancellationToken);
        if (role is not null)
        {
            return role;
        }

        role = new Role
        {
            Name = roleName,
            Description = null,
            CreatedAt = DateTime.UtcNow
        };

        dbContext.Roles.Add(role);
        await dbContext.SaveChangesAsync(cancellationToken);

        return role;
    }

    private AuthResponse BuildAuthResponse(User user)
    {
        var roles = user.UserRoles
            .Select(userRole => userRole.Role.Name)
            .Where(roleName => !string.IsNullOrWhiteSpace(roleName))
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToArray();

        var expiresAt = DateTime.UtcNow.AddMinutes(GetExpiryMinutes());
        var tokenHandler = new JwtSecurityTokenHandler();
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(GetJwtKey()));

        var claims = new List<Claim>
        {
            new(ClaimTypes.NameIdentifier, user.Id.ToString()),
            new(ClaimTypes.Name, user.FullName),
            new(ClaimTypes.Email, user.Email)
        };

        claims.AddRange(roles.Select(role => new Claim(ClaimTypes.Role, role)));

        var token = tokenHandler.CreateJwtSecurityToken(
            issuer: GetJwtIssuer(),
            audience: GetJwtAudience(),
            subject: new ClaimsIdentity(claims),
            notBefore: DateTime.UtcNow,
            expires: expiresAt,
            signingCredentials: new SigningCredentials(key, SecurityAlgorithms.HmacSha256));

        return new AuthResponse
        {
            Token = tokenHandler.WriteToken(token),
            ExpiresAt = expiresAt,
            User = new AuthUserDto
            {
                Id = user.Id,
                FullName = user.FullName,
                Email = user.Email,
                Roles = roles
            }
        };
    }

    private string NormalizeEmail(string email) => email.Trim().ToLowerInvariant();

    private string GetJwtIssuer() => configuration["Jwt:Issuer"] ?? throw new InvalidOperationException("Jwt:Issuer is not configured.");

    private string GetJwtAudience() => configuration["Jwt:Audience"] ?? throw new InvalidOperationException("Jwt:Audience is not configured.");

    private string GetJwtKey() => configuration["Jwt:Key"] ?? throw new InvalidOperationException("Jwt:Key is not configured.");

    private int GetExpiryMinutes() => int.TryParse(configuration["Jwt:ExpiryMinutes"], out var expiryMinutes) ? expiryMinutes : 120;
}
