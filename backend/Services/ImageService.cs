namespace App.Services;

public class ImageService
{
    private readonly string _uploadsPath;
    private readonly long _maxBytes;

    public ImageService(IConfiguration config)
    {
        _uploadsPath = config["Uploads:Path"] ?? "./uploads";
        _maxBytes = config.GetValue<long>("Uploads:MaxBytes", 10_485_760);
        Directory.CreateDirectory(_uploadsPath);
    }

    public async Task<string> SaveAsync(IFormFile file)
    {
        if (file.Length > _maxBytes)
            throw new InvalidOperationException($"File exceeds {_maxBytes / 1_048_576}MB limit");

        var ext = Path.GetExtension(file.FileName).ToLowerInvariant();
        var fileName = $"{Guid.NewGuid()}{ext}";
        var fullPath = Path.Combine(_uploadsPath, fileName);

        await using var stream = File.Create(fullPath);
        await file.CopyToAsync(stream);

        return $"/uploads/{fileName}";
    }

    public void Delete(string? imageUrl)
    {
        if (string.IsNullOrEmpty(imageUrl)) return;
        var fileName = Path.GetFileName(imageUrl);
        var fullPath = Path.Combine(_uploadsPath, fileName);
        if (File.Exists(fullPath)) File.Delete(fullPath);
    }
}
