using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SakhtKhaneh.Data;
using SakhtKhaneh.Models;

namespace SakhtKhaneh.Controllers
{
    [Route("[controller]")]
    [ApiController]
    public class ApiController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public ApiController(ApplicationDbContext context)
        {
            _context = context;
        }

        [HttpPost("auth/login")]
        public IActionResult Login([FromBody] AuthRequest request)
        {
            var user = _context.Users
                .FirstOrDefault(u => u.UserName == request.Username);

            if (user == null)
                return Ok(new AuthResponse { Status = "fail", Message = "نام کاربری یا رمز عبور اشتباه است" });

            // بررسی رمز عبور - فرض کنید از هش استفاده می‌کنید
            if (!VerifyPassword(request.Password, user.PasswordHash))
                return Ok(new AuthResponse { Status = "fail", Message = "نام کاربری یا رمز عبور اشتباه است" });

            if (!user.AdministrativeApproval)
                return Ok(new AuthResponse { Status = "pending", Message = "اکانت شما هنوز تایید نشده است" });

            return Ok(new AuthResponse { Status = "success", Message = "ورود موفق" });
        }

        // نمونه تابع بررسی پسورد (باید هش واقعی داشته باشید)

        private bool VerifyPassword(string password, string hash)
        {
            var hasher = new PasswordHasher<AppUser>();
            var result = hasher.VerifyHashedPassword(null, hash, password);
            bool verificationResult = result == PasswordVerificationResult.Success;
            return verificationResult;
        }

        [HttpPost("auth/register")]
        public IActionResult Register([FromBody] AuthRequest request)
        {
            if (_context.Users.Any(u => u.UserName == request.Username))
                return Ok(new AuthResponse { Status = "fail", Message = "این نام کاربری قبلا ثبت شده است" });

            var newUser = new AppUser
            {
                UserName = request.Username,
                PasswordHash = HashPassword(request.Password), // حتما هش واقعی
                Email = request.Email,
                AdministrativeApproval = false
            };

            _context.Users.Add(newUser);
            _context.SaveChanges();

            return Ok(new AuthResponse { Status = "success", Message = "ثبت‌نام موفق، منتظر تایید ادمین باشید" });
        }

        // نمونه تابع هش
        private string HashPassword(string password)
        {
            var hasher = new PasswordHasher<AppUser>();
            var user = new AppUser(); // می‌تونی خالی بسازی
            return hasher.HashPassword(user, password);
        }

    }
}
