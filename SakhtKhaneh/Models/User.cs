using Microsoft.AspNetCore.Identity;

namespace SakhtKhaneh.Models;

public class AppUser : IdentityUser
{
    public string? FirstName { get; set; }
    public string? LastName { get; set; }
    public bool AdministrativeApproval { get; set; }

    /// <summary>
    /// When true, the administrator is only allowed to access profile and password-change endpoints.
    /// Existing users are preserved by the migration with a default value of false.
    /// </summary>
    public bool MustChangePassword { get; set; }

    public DateTime? PasswordChangedAt { get; set; }
    public DateTime? LastLoginAt { get; set; }
}
