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
using SakhtKhaneh.Models.Projects;
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

        public class messageResponse
        {
            public string status { get; set; }
            public string message { get; set; }
        }

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

            return Ok(new AppUser
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
                .Select(g => new
                {
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

        [HttpGet("users")]
        public async Task<List<AppUser>?> users()
        {
            return await _context.Users.ToListAsync();
        }

        // Projects 
        [HttpGet("getProjects")]
        public async Task<List<Project>?> getProjects()
        {
            return await _context.Projects.OrderByDescending(p => p.StartDate).ToListAsync();
        }

        [HttpPost("projects/uploadCover")]
        public async Task<IActionResult> UploadCover(IFormFile cover)
        {
            if (cover == null || cover.Length == 0)
                return BadRequest("No file uploaded");

            var rootDirectory = Path.Combine("wwwroot/uploads");

            if (!Path.Exists(rootDirectory))
            {
                Directory.CreateDirectory(rootDirectory);
            }

            var filePath = Path.Combine("wwwroot/uploads", cover.FileName);
            using (var stream = System.IO.File.Create(filePath))
            {
                await cover.CopyToAsync(stream);
            }

            var fileUrl = $"{Request.Scheme}://{Request.Host}/uploads/{cover.FileName}";
            return Ok(new { url = fileUrl }); // ⚠ حتما JSON با key "url"
        }

        [HttpPost("projects/uploadGallery")]
        public async Task<IActionResult> UploadGallery(List<IFormFile> gallery)
        {
            if (gallery == null || gallery.Count == 0)
                return BadRequest("No files uploaded");

            var uploadDir = Path.Combine("wwwroot/uploads/gallery");

            if (!Directory.Exists(uploadDir))
                Directory.CreateDirectory(uploadDir);

            var urls = new List<string>();

            foreach (var file in gallery)
            {
                if (file == null || file.Length == 0)
                    continue;

                var filePath = Path.Combine(uploadDir, file.FileName);

                using (var stream = System.IO.File.Create(filePath))
                {
                    await file.CopyToAsync(stream);
                }

                // ساخت URL عمومی
                var fileUrl = $"{Request.Scheme}://{Request.Host}/uploads/gallery/{file.FileName}";
                urls.Add(fileUrl);
            }

            if (urls.Count == 0)
                return BadRequest("No valid images uploaded");

            return Ok(new { urls }); // ✅ JSON با key: "urls"
        }

        private async Task<Guid> GetNewUniqueProjectId()
        {
            var id = Guid.NewGuid();
            bool isExisted = await _context.Projects.Where(p => p.Id == id).FirstOrDefaultAsync() != null;
            if (!isExisted)
            {
                return id;
            }
            else
            {
                return await GetNewUniqueProjectId();
            }
        }

        private async Task<Guid> GetUniqueIdForProjectGalleryItem()
        {
            var id = Guid.NewGuid();
            bool isExisted = await _context.GalleryItems.Where(p => p.Id == id).FirstOrDefaultAsync() != null;
            if (!isExisted)
            {
                return id;
            }
            else
            {
                return await GetNewUniqueProjectId();
            }
        }

        [HttpPost("projects/create")]
        public async Task<IActionResult> CreateProject([FromBody] ProjectCoreDto project)
        {
            if (project == null)
            {
                return BadRequest();
            }
            else
            {
                bool pathAlreadyExists = _context.Projects.Where(p => p.Endpoint_Path.ToLower() == project.endpoint_Path.ToLower()).FirstOrDefault() != null;

                if (!pathAlreadyExists)
                {
                    try
                    {
                        var dbProject = new Project
                        {
                            Id = await GetNewUniqueProjectId(),
                            CoverImageUrl = project.coverImageUrl,
                            Endpoint_Path = project.endpoint_Path,
                            Title = project.title,
                            Description = project.description,
                            Content = project.content,
                            StartDate = project.startDate,
                            EndDate = project.endDate,
                            Location = project.location,
                            Owner = project.owner,
                            Gallery = null
                        };

                        _context.Projects.Add(dbProject);
                        await _context.SaveChangesAsync();

                        var theAddedProject = _context.Projects.Where(p => p.Endpoint_Path == dbProject.Endpoint_Path).FirstOrDefault();

                        var project_id = theAddedProject.Id;

                        bool hasGallery = project.gallery != null && project.gallery.Count > 0;

                        if (hasGallery)
                        {
                            foreach (var item in project.gallery)
                            {
                                ProjectGalleryItem galleryItem = new ProjectGalleryItem();

                                galleryItem.ProjectId = project_id;
                                galleryItem.Id = await GetUniqueIdForProjectGalleryItem();
                                galleryItem.ImageUrl = item.url;

                                _context.GalleryItems.Add(galleryItem);
                                await _context.SaveChangesAsync();
                            }
                        }

                        return Ok(new messageResponse
                        {
                            status = "success",
                            message = "created"
                        });
                    }
                    catch (Exception ex)
                    {
                        var message = ex.Message;
                        return Ok(new messageResponse
                        {
                            status = "fail",
                            message = "unknown exception occurance: " + message
                        });
                    }
                }
                else
                {
                    return Ok(new messageResponse
                    {
                        status = "fail",
                        message = "path-already-exists"
                    });
                }

            }
        }

        [HttpGet("projects/get/{projectId}")]
        public async Task<Project?> GetProject(Guid projectId)
        {
            var project = await _context.Projects.Where(p => p.Id == projectId).FirstOrDefaultAsync();

            if (project != null)
            {
                var project_id = project.Id;
                var galleryItems = await _context.GalleryItems.Where(p => p.ProjectId == project_id).ToListAsync();
                if (galleryItems != null && galleryItems.Count > 0)
                {
                    project.Gallery = galleryItems;
                }
            }

            return project;
        }

        [HttpPost("projects/update")]
        public async Task<IActionResult> UpdateProject([FromBody] ProjectCoreDto project)
        {
            if (project == null)
            {
                return BadRequest();
            }
            else
            {

                var dbProject = await _context.Projects.Where(p => p.Id == project.id).FirstOrDefaultAsync();

                if (dbProject != null)
                {
                    dbProject.Title = project.title;
                    dbProject.Description = project.description;
                    dbProject.StartDate = project.startDate;
                    dbProject.EndDate = project.endDate;
                    dbProject.Content = project.content;
                    dbProject.CoverImageUrl = project.coverImageUrl;
                    dbProject.Endpoint_Path = project.endpoint_Path;
                    dbProject.Location = project.location;
                    dbProject.Owner = project.owner;

                    await _context.SaveChangesAsync();

                    if (project.gallery != null && project.gallery.Count > 0)
                    {
                        var dbGalleryItems = await _context.GalleryItems.Where(p => p.ProjectId == dbProject.Id).ToListAsync();
                        if (dbGalleryItems.Count > 0)
                        {
                            // remove all galleries
                            foreach (var dbGalleryItem in dbGalleryItems)
                            {
                                _context.GalleryItems.Remove(dbGalleryItem);
                            }
                            await _context.SaveChangesAsync();
                            // add new gallery settings 
                            foreach (var galleryItem in project.gallery)
                            {
                                var dbItem = new ProjectGalleryItem
                                {
                                    Id = await GetUniqueIdForProjectGalleryItem(),
                                    ProjectId = dbProject.Id,
                                    ImageUrl = galleryItem.url
                                };

                                _context.Add(dbItem);
                            }
                            await _context.SaveChangesAsync();
                        }
                    }
                }

                return Ok(new messageResponse { status = "success", message = "updated" });
            }
        }

    }
}
