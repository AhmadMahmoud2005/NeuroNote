using CloudinaryDotNet;
using CloudinaryDotNet.Actions;

namespace NeuroNote.Api.Services;

public class CloudinaryService
{
    private readonly Cloudinary _cloudinary;

    public CloudinaryService(IConfiguration configuration)
    {
        var cloudName = configuration["CloudinarySettings:CloudName"] ?? throw new InvalidOperationException("CloudinarySettings:CloudName is missing");
        var apiKey    = configuration["CloudinarySettings:ApiKey"]    ?? throw new InvalidOperationException("CloudinarySettings:ApiKey is missing");
        var apiSecret = configuration["CloudinarySettings:ApiSecret"] ?? throw new InvalidOperationException("CloudinarySettings:ApiSecret is missing");

        var account = new Account(cloudName, apiKey, apiSecret);
        _cloudinary = new Cloudinary(account);
        _cloudinary.Api.Secure = true; // always use HTTPS
    }

    /// <summary>
    /// Uploads an avatar image to Cloudinary and returns the secure URL.
    /// The raw bytes are never stored in the database — only this URL is saved.
    /// </summary>
    public async Task<string> UploadAvatarAsync(IFormFile file)
    {
        await using var stream = file.OpenReadStream();

        var uploadParams = new ImageUploadParams
        {
            File           = new FileDescription(file.FileName, stream),
            Folder         = "neuronote/avatars",
            Transformation = new Transformation()
                .Width(256)
                .Height(256)
                .Crop("fill")
                .Gravity("face")
                .Quality("auto")
                .FetchFormat("auto"),
            // Overwrite = false (default) — each upload gets a unique public_id
        };

        var result = await _cloudinary.UploadAsync(uploadParams);

        if (result.Error != null)
            throw new InvalidOperationException($"Cloudinary upload failed: {result.Error.Message}");

        return result.SecureUrl.ToString();
    }

    /// <summary>
    /// Uploads an inline page or cover image to Cloudinary and returns the secure URL.
    /// Does not crop or resize to keep original aspect ratio.
    /// </summary>
    public async Task<string> UploadImageAsync(IFormFile file)
    {
        await using var stream = file.OpenReadStream();

        var uploadParams = new ImageUploadParams
        {
            File           = new FileDescription(file.FileName, stream),
            Folder         = "neuronote/pages",
            Transformation = new Transformation()
                .Quality("auto")
                .FetchFormat("auto")
        };

        var result = await _cloudinary.UploadAsync(uploadParams);

        if (result.Error != null)
            throw new InvalidOperationException($"Cloudinary upload failed: {result.Error.Message}");

        return result.SecureUrl.ToString();
    }
}
