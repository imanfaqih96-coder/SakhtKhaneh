using System.ComponentModel.DataAnnotations;

namespace SakhtKhaneh.Models.Dto.Profile;

public class UpdateProfileDto
{
    public string? FirstName { get; set; }
    public string? LastName { get; set; }

    [Required, EmailAddress]
    public string Email { get; set; } = string.Empty;
}

public class ChangePasswordDto
{
    [Required]
    public string CurrentPassword { get; set; } = string.Empty;

    [Required, MinLength(10)]
    public string NewPassword { get; set; } = string.Empty;
}

public class ProfileDto
{
    public string UserName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string? FirstName { get; set; }
    public string? LastName { get; set; }
    public bool MustChangePassword { get; set; }
    public DateTime? LastLoginAt { get; set; }
    public DateTime? PasswordChangedAt { get; set; }
}
