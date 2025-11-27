using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using SakhtKhaneh.Data;
using SakhtKhaneh.Models;
using SakhtKhaneh.Models.Dto.Dashboard;
using SakhtKhaneh.Models.Dto.Profile;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;

namespace SakhtKhaneh.Controllers
{
    [Route("[controller]")]
    [ApiController]
    public class ApiController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly UserManager<AppUser> _userManager;
        private readonly SignInManager<AppUser> _signInManager;

        public ApiController(ApplicationDbContext context, UserManager<AppUser> userManager, SignInManager<AppUser> signInManager)
        {
            _context = context;
            _userManager = userManager;
            _signInManager = signInManager;
        }

        [HttpGet("GetProfile")]
        public async Task<IActionResult> GetProfile()
        {
            var user = await _userManager.GetUserAsync(User);
            if (user == null) return Unauthorized();

            return Ok(new
            {
                UserName = user.UserName,
                Email = user.Email,
                FirstName = user.FirstName,
                LastName = user.LastName
            });
        }

        [HttpPost("updateProfile")]
        public async Task<IActionResult> UpdateProfile([FromBody] UpdateProfileDto model)
        {
            var user = await _userManager.GetUserAsync(User);
            if (user == null) return Unauthorized();

            user.FirstName = model.FirstName;
            user.LastName = model.LastName;
            user.Email = model.Email;

            var result = await _userManager.UpdateAsync(user);
            if (!result.Succeeded)
                return BadRequest(result.Errors);

            return Ok();
        }

        [HttpPost("changePassword")]
        public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordDto model)
        {
            var user = await _userManager.GetUserAsync(User);
            if (user == null) return Unauthorized();

            var result = await _userManager.ChangePasswordAsync(user, model.CurrentPassword, model.NewPassword);
            if (!result.Succeeded)
                return BadRequest(result.Errors);

            return Ok();
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
        public async Task<IActionResult> Login([FromBody] AuthRequest request)
        {
            var user = _context.Users.FirstOrDefault(u => u.UserName == request.Username);

            if (user == null || !VerifyPassword(request.Password, user.PasswordHash))
                return Ok(new AuthResponse { Status = "fail", Message = "نام کاربری یا رمز عبور اشتباه است" });

            if (!user.AdministrativeApproval)
                return Ok(new AuthResponse { Status = "pending", Message = "اکانت شما هنوز تایید نشده است" });

            await _signInManager.SignInAsync(user, true);

            return Ok(new AuthResponse
            {
                Status = "success",
                Message = "ورود موفق"
            });
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

        [HttpGet("dashboard/stats")]
        public IActionResult GetDashboardStats()
        {
            var totalVisits = _context.Visits.Count();
            var totalUsers = _context.Visits.Select(v => v.Ip).Distinct().Count();
            var citiesCount = _context.Visits.Select(v => v.City).Distinct().Count();
            var countriesCount = _context.Visits.Select(v => v.Country).Distinct().Count();

            var stats = new
            {
                TotalVisits = totalVisits,
                totalUsers = totalUsers,
                CitiesCount = citiesCount,
                CountriesCount = countriesCount
            };

            return Ok(stats);
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

        [HttpGet("popular-paths")]
        public async Task<ActionResult> GetPopularPaths()
        {
            var popular = await _context.Visits
                .GroupBy(v => new { v.Path, v.PathType, v.PathParam })
                .Select(g => new {
                    path = g.Key.Path,
                    type = g.Key.PathType,
                    param = g.Key.PathParam,
                    count = g.Count(),
                    lastVisit = g.Max(v => v.Time)
                })
                .OrderByDescending(x => x.count)
                .ToListAsync();

            return Ok(popular);
        }


    }
}
