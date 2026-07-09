using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using NeuroNote.Api.Data;
using NeuroNote.Api.DTOs.Auth;
using NeuroNote.Api.Models;

namespace NeuroNote.Api.Services;

public class AuthService
{
    private readonly NeuroNoteDbContext _context;
    private readonly IConfiguration _configuration;

    public AuthService(NeuroNoteDbContext context, IConfiguration configuration)
    {
        _context = context;
        _configuration = configuration;
    }

    public async Task<AuthResponseDto?> RegisterAsync(RegisterDto dto)
    {
        dto.Username = dto.Username.ToLowerInvariant().Trim();

        // Check if email already exists
        if (await _context.Users.AnyAsync(u => u.Email == dto.Email))
            return null;

        // Check if username already exists
        if (await _context.Users.AnyAsync(u => u.Username == dto.Username))
            return null;

        var user = new User
        {
            Username = dto.Username,
            FullName = dto.FullName,
            Email = dto.Email,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.Password)
        };

        _context.Users.Add(user);
        await _context.SaveChangesAsync();

        // Create a default workspace for this user
        var workspace = new Workspace
        {
            Name = "Personal Workspace",
            Slug = $"{user.Username}-personal",
            OwnerUserId = user.Id,
            CreatedAt = DateTime.UtcNow
        };
        _context.Workspaces.Add(workspace);
        await _context.SaveChangesAsync();

        var token = GenerateJwtToken(user);

        return new AuthResponseDto
        {
            Token = token,
            UserId = user.Id,
            Username = user.Username,
            FullName = user.FullName,
            Email = user.Email,
            DefaultWorkspaceId = workspace.Id
        };
    }

    public async Task<AuthResponseDto?> LoginAsync(LoginDto dto)
    {
        var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == dto.Email);

        if (user == null || !BCrypt.Net.BCrypt.Verify(dto.Password, user.PasswordHash))
            return null;

        // Ensure user has at least one workspace in the database
        var workspace = await _context.Workspaces.FirstOrDefaultAsync(w => w.OwnerUserId == user.Id);
        if (workspace == null)
        {
            workspace = new Workspace
            {
                Name = "Personal Workspace",
                Slug = $"{user.Username}-personal",
                OwnerUserId = user.Id,
                CreatedAt = DateTime.UtcNow
            };
            _context.Workspaces.Add(workspace);
            await _context.SaveChangesAsync();
        }

        var token = GenerateJwtToken(user);

        return new AuthResponseDto
        {
            Token = token,
            UserId = user.Id,
            Username = user.Username,
            FullName = user.FullName,
            Email = user.Email,
            DefaultWorkspaceId = workspace.Id
        };
    }

    public async Task<User?> GetUserByIdAsync(int userId)
    {
        return await _context.Users.FindAsync(userId);
    }

    private string GenerateJwtToken(User user)
    {
        var jwtSettings = _configuration.GetSection("Jwt");
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSettings["Key"]!));
        var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var claims = new[]
        {
            new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
            new Claim(ClaimTypes.Name, user.Username),
            new Claim(ClaimTypes.Email, user.Email),
            new Claim("fullName", user.FullName)
        };

        var token = new JwtSecurityToken(
            issuer: jwtSettings["Issuer"],
            audience: jwtSettings["Audience"],
            claims: claims,
            expires: DateTime.UtcNow.AddMinutes(double.Parse(jwtSettings["ExpireMinutes"]!)),
            signingCredentials: credentials
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }
}
