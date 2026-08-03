using System.ComponentModel.DataAnnotations;

namespace SakhtKhaneh.Models;

public class AuthRequest
{
    public string? FirstName { get; set; }
    public string? LastName { get; set; }

    [Required]
    public string Username { get; set; } = string.Empty;

    [Required]
    public string Password { get; set; } = string.Empty;

    [EmailAddress]
    public string? Email { get; set; }
}
