namespace SakhtKhaneh.Models;

public class AuthResponse
{
    public string Status { get; set; } = "fail";
    public string Message { get; set; } = string.Empty;
    public bool MustChangePassword { get; set; }
    public string? UserName { get; set; }
}
