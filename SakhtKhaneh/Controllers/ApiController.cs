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

        public Guid getUniqueIdForVisit()
        {
            Guid id = Guid.NewGuid();
            var dbRelevant = _context.Visits.Where(p => p.Id == id).FirstOrDefault();
            bool isNull = dbRelevant == null;
            if (isNull)
            {
                return id;
            }
            else
            {
                return getUniqueIdForVisit();
            }
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

        [HttpPost("submitVisitRecord")]
        public string submitVisitRecord([FromBody] VisitRecord data)
        {
            string result = "";

            try
            {
                Visit dbData = new Visit
                {
                    Id = getUniqueIdForVisit(),
                    Time = DateTime.Now,
                    Path = data.path,
                    PathType = data.pathType,
                    PathParam = data.pathParam,
                    Ip = data.geolocation.ip,
                    City = data.geolocation.location.city,
                    State = data.geolocation.location.state_prov,
                    StateCode = data.geolocation.location.state_code,
                    Country = data.geolocation.location.country_name,
                    CountryCode = data.geolocation.location.country_code2,
                    Latitude = data.geolocation.location.latitude,
                    Longitude = data.geolocation.location.longitude
                };

                _context.Visits.Add(dbData);
                _context.SaveChanges();

                result = "successful";
            }
            catch (Exception ex)
            {
                var error = ex.Message;
                result = "failed";
            }

            return result;
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
