namespace SakhtKhaneh.Models
{
    public class AuthResponse
    {
        public string Status { get; set; } // success, fail, pending
        public string Message { get; set; } = "";
        public string? Token { get; internal set; }
    }
}
