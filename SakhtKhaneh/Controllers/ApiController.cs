using System.Security.Claims;
using System.Text.Json;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;
using SakhtKhaneh.Data;
using SakhtKhaneh.Infrastructure;
using SakhtKhaneh.Models;
using SakhtKhaneh.Models.Blog;
using SakhtKhaneh.Models.Dto.Blog;
using SakhtKhaneh.Models.Dto.Journals;
using SakhtKhaneh.Models.Dto.Profile;
using SakhtKhaneh.Models.Dto.Reports;
using SakhtKhaneh.Models.Dto.Users;
using SakhtKhaneh.Models.Journals;
using SakhtKhaneh.Models.Messages;
using SakhtKhaneh.Models.Projects;
using SakhtKhaneh.Models.Services;
using SakhtKhaneh.Models.Template;
using SakhtKhaneh.Services;
using SakhtKhaneh.Services.Files;
using SakhtKhaneh.Services.Security;

namespace SakhtKhaneh.Controllers;

[Route("api")]
[ApiController]
[Authorize(Roles = AdminSeedService.AdministratorRole)]
public class ApiController : ControllerBase
{
    private const string DefaultContentAuthor = "حسین کنعانی";

    private readonly ApplicationDbContext _context;
    private readonly UserManager<AppUser> _userManager;
    private readonly SignInManager<AppUser> _signInManager;
    private readonly ITemplateDataManagementService _templateService;
    private readonly IWebHostEnvironment _environment;
    private readonly IFileStorageService _fileStorage;
    private readonly IHtmlContentSanitizer _htmlSanitizer;
    private readonly ISmsService _smsService;
    private readonly IIpGeolocationService _ipGeolocationService;
    private readonly IConfiguration _configuration;
    private readonly ILogger<ApiController> _logger;

    public sealed class MessageResponse
    {
        public string Status { get; set; } = "success";
        public string Message { get; set; } = string.Empty;
    }

    public ApiController(
        ApplicationDbContext context,
        UserManager<AppUser> userManager,
        SignInManager<AppUser> signInManager,
        ITemplateDataManagementService templateService,
        IWebHostEnvironment environment,
        IFileStorageService fileStorage,
        IHtmlContentSanitizer htmlSanitizer,
        ISmsService smsService,
        IIpGeolocationService ipGeolocationService,
        IConfiguration configuration,
        ILogger<ApiController> logger)
    {
        _context = context;
        _userManager = userManager;
        _signInManager = signInManager;
        _templateService = templateService;
        _environment = environment;
        _fileStorage = fileStorage;
        _htmlSanitizer = htmlSanitizer;
        _smsService = smsService;
        _ipGeolocationService = ipGeolocationService;
        _configuration = configuration;
        _logger = logger;
    }

    #region Authentication and profile

    [AllowAnonymous]
    [EnableRateLimiting("login")]
    [HttpPost("auth/login")]
    public async Task<IActionResult> Login([FromBody] AuthRequest request)
    {
        if (!ModelState.IsValid)
            return BadRequest(new AuthResponse { Status = "fail", Message = "اطلاعات ورود کامل نیست." });

        var normalizedInput = request.Username.Trim();
        var user = await _userManager.FindByNameAsync(normalizedInput)
                   ?? await _userManager.FindByEmailAsync(normalizedInput);

        if (user is null || !user.AdministrativeApproval ||
            !await _userManager.IsInRoleAsync(user, AdminSeedService.AdministratorRole))
        {
            return Unauthorized(new AuthResponse
            {
                Status = "fail",
                Message = "نام کاربری یا رمز عبور اشتباه است."
            });
        }

        var result = await _signInManager.PasswordSignInAsync(
            user,
            request.Password,
            isPersistent: false,
            lockoutOnFailure: true);

        if (result.IsLockedOut)
        {
            return StatusCode(423, new AuthResponse
            {
                Status = "fail",
                Message = "به دلیل ورودهای ناموفق، حساب شما موقتاً قفل شده است."
            });
        }

        if (!result.Succeeded)
        {
            return Unauthorized(new AuthResponse
            {
                Status = "fail",
                Message = "نام کاربری یا رمز عبور اشتباه است."
            });
        }

        user.LastLoginAt = DateTime.UtcNow;
        await _userManager.UpdateAsync(user);

        return Ok(new AuthResponse
        {
            Status = "success",
            Message = user.MustChangePassword
                ? "ورود موفق بود؛ پیش از ادامه رمز عبور پیش‌فرض را تغییر دهید."
                : "ورود موفق بود.",
            MustChangePassword = user.MustChangePassword,
            UserName = user.UserName
        });
    }

    [AllowAnonymous]
    [HttpGet("auth/session")]
    public async Task<IActionResult> Session()
    {
        if (User.Identity?.IsAuthenticated != true)
            return Unauthorized(new { authenticated = false });

        var user = await _userManager.GetUserAsync(User);
        if (user is null || !await _userManager.IsInRoleAsync(user, AdminSeedService.AdministratorRole))
            return Unauthorized(new { authenticated = false });

        return Ok(new
        {
            authenticated = true,
            userName = user.UserName,
            mustChangePassword = user.MustChangePassword
        });
    }

    [HttpPost("auth/logout")]
    public async Task<IActionResult> Logout()
    {
        await _signInManager.SignOutAsync();
        return Ok(new MessageResponse { Message = "از حساب کاربری خارج شدید." });
    }

    [HttpGet("GetProfile")]
    public async Task<IActionResult> GetProfile()
    {
        var user = await _userManager.GetUserAsync(User);
        if (user is null)
            return Unauthorized();

        return Ok(new ProfileDto
        {
            UserName = user.UserName ?? string.Empty,
            Email = user.Email ?? string.Empty,
            FirstName = user.FirstName,
            LastName = user.LastName,
            MustChangePassword = user.MustChangePassword,
            LastLoginAt = user.LastLoginAt,
            PasswordChangedAt = user.PasswordChangedAt
        });
    }

    [HttpPost("updateProfile")]
    public async Task<IActionResult> UpdateProfile([FromBody] UpdateProfileDto model)
    {
        if (!ModelState.IsValid)
            return ValidationProblem(ModelState);

        var user = await _userManager.GetUserAsync(User);
        if (user is null)
            return Unauthorized();

        var emailOwner = await _userManager.FindByEmailAsync(model.Email.Trim());
        if (emailOwner is not null && emailOwner.Id != user.Id)
            return Conflict(new MessageResponse { Status = "fail", Message = "این ایمیل قبلاً استفاده شده است." });

        user.FirstName = model.FirstName?.Trim();
        user.LastName = model.LastName?.Trim();
        user.Email = model.Email.Trim();
        user.NormalizedEmail = _userManager.NormalizeEmail(user.Email);

        var result = await _userManager.UpdateAsync(user);
        if (!result.Succeeded)
            return BadRequest(new MessageResponse
            {
                Status = "fail",
                Message = string.Join(" | ", result.Errors.Select(error => error.Description))
            });

        return Ok(new MessageResponse { Message = "اطلاعات حساب کاربری ذخیره شد." });
    }

    [HttpPost("changePassword")]
    public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordDto model)
    {
        if (!ModelState.IsValid)
            return ValidationProblem(ModelState);

        var user = await _userManager.GetUserAsync(User);
        if (user is null)
            return Unauthorized();

        if (string.Equals(model.CurrentPassword, model.NewPassword, StringComparison.Ordinal))
        {
            return BadRequest(new MessageResponse
            {
                Status = "fail",
                Message = "رمز عبور جدید باید با رمز فعلی متفاوت باشد."
            });
        }

        var result = await _userManager.ChangePasswordAsync(user, model.CurrentPassword, model.NewPassword);
        if (!result.Succeeded)
        {
            return BadRequest(new MessageResponse
            {
                Status = "fail",
                Message = string.Join(" | ", result.Errors.Select(error => TranslateIdentityError(error.Code, error.Description)))
            });
        }

        user.MustChangePassword = false;
        user.PasswordChangedAt = DateTime.UtcNow;
        await _userManager.UpdateAsync(user);
        await _signInManager.RefreshSignInAsync(user);

        return Ok(new MessageResponse { Message = "رمز عبور با موفقیت تغییر کرد." });
    }

    [HttpPost("auth/register")]
    public async Task<IActionResult> Register([FromBody] AuthRequest request)
    {
        if (!ModelState.IsValid)
            return ValidationProblem(ModelState);

        var userName = request.Username.Trim();
        var email = (request.Email ?? userName).Trim();

        if (await _userManager.FindByNameAsync(userName) is not null ||
            await _userManager.FindByEmailAsync(email) is not null)
        {
            return Conflict(new AuthResponse { Status = "fail", Message = "این نام کاربری یا ایمیل قبلاً ثبت شده است." });
        }

        var user = new AppUser
        {
            UserName = userName,
            Email = email,
            FirstName = request.FirstName?.Trim(),
            LastName = request.LastName?.Trim(),
            EmailConfirmed = true,
            AdministrativeApproval = true,
            MustChangePassword = true
        };

        var result = await _userManager.CreateAsync(user, request.Password);
        if (!result.Succeeded)
        {
            return BadRequest(new AuthResponse
            {
                Status = "fail",
                Message = string.Join(" | ", result.Errors.Select(error => TranslateIdentityError(error.Code, error.Description)))
            });
        }

        await _userManager.AddToRoleAsync(user, AdminSeedService.AdministratorRole);

        return Ok(new AuthResponse
        {
            Status = "success",
            Message = "کاربر ایجاد شد و در اولین ورود ملزم به تغییر رمز عبور است."
        });
    }

    [HttpGet("users")]
    public async Task<ActionResult<IReadOnlyList<AdminUserListItemDto>>> Users()
    {
        var users = await _context.Users
            .AsNoTracking()
            .OrderBy(user => user.UserName)
            .Select(user => new AdminUserListItemDto
            {
                Id = user.Id,
                UserName = user.UserName ?? string.Empty,
                Email = user.Email ?? string.Empty,
                FirstName = user.FirstName,
                LastName = user.LastName,
                AdministrativeApproval = user.AdministrativeApproval,
                MustChangePassword = user.MustChangePassword,
                LastLoginAt = user.LastLoginAt
            })
            .ToListAsync();

        return Ok(users);
    }

    #endregion

    #region Analytics and public messages

    [AllowAnonymous]
    [EnableRateLimiting("visit")]
    [HttpPost("submitVisitRecord")]
    public async Task<IActionResult> SubmitVisitRecord([FromBody] VisitRecord data)
    {
        if (data is null || string.IsNullOrWhiteSpace(data.path))
            return BadRequest(new MessageResponse { Status = "fail", Message = "اطلاعات بازدید ناقص است." });

        var remoteIp = HttpContext.Connection.RemoteIpAddress?.ToString();
        var geolocation = data.geolocation ?? await _ipGeolocationService.ResolveAsync(remoteIp, HttpContext.RequestAborted);
        var location = geolocation?.location;

        var visit = new Visit
        {
            Id = Guid.NewGuid(),
            Time = DateTime.UtcNow,
            Path = Truncate(data.path, 1000),
            PathType = data.pathType ?? "unknown",
            PathParam = data.pathParam,
            Ip = geolocation?.ip ?? remoteIp ?? string.Empty,
            City = location?.city ?? string.Empty,
            State = location?.state_prov ?? string.Empty,
            StateCode = location?.state_code ?? string.Empty,
            Country = location?.country_name ?? string.Empty,
            CountryCode = location?.country_code2 ?? string.Empty,
            Latitude = location?.latitude ?? string.Empty,
            Longitude = location?.longitude ?? string.Empty
        };

        _context.Visits.Add(visit);
        await _context.SaveChangesAsync();
        return Ok(new MessageResponse { Message = "visit-recorded" });
    }

    [HttpGet("dashboard/stats")]
    public async Task<ActionResult<DashboardStatsDto>> GetDashboardStats(
        DateTime? from = null,
        DateTime? to = null,
        CancellationToken cancellationToken = default)
    {
        var range = NormalizeAnalyticsRange(from, to);
        var previousFrom = range.From.AddDays(-range.DayCount);
        var previousToExclusive = range.From;

        var visits = _context.Visits.AsNoTracking()
            .Where(item => item.Time >= range.From && item.Time < range.ToExclusive);

        var trendTimes = await visits
            .Select(item => item.Time)
            .ToListAsync(cancellationToken);
        var trendRows = trendTimes
            .GroupBy(item => IranDateTime.ToIranTime(item).Date)
            .ToDictionary(group => group.Key, group => group.Count());

        var total = await visits.CountAsync(cancellationToken);
        var previousTotal = await _context.Visits.AsNoTracking()
            .CountAsync(item => item.Time >= previousFrom && item.Time < previousToExclusive, cancellationToken);

        return Ok(new DashboardStatsDto
        {
            From = range.IranFrom,
            To = range.IranToExclusive.AddTicks(-1),
            TotalVisits = total,
            TotalUsers = await visits.Select(item => item.Ip).Where(value => value != string.Empty).Distinct().CountAsync(cancellationToken),
            CitiesCount = await visits.Select(item => item.City).Where(value => value != string.Empty).Distinct().CountAsync(cancellationToken),
            CountriesCount = await visits.Select(item => item.Country).Where(value => value != string.Empty).Distinct().CountAsync(cancellationToken),
            ChangePercent = CalculateChangePercent(total, previousTotal),
            Trend = FillAnalyticsSeries(range.IranFrom, range.IranToExclusive, trendRows)
        });
    }

    [HttpGet("reports/overview")]
    public async Task<ActionResult<AnalyticsReportDto>> GetAnalyticsReport(
        string metric = "visits",
        DateTime? from = null,
        DateTime? to = null,
        CancellationToken cancellationToken = default)
    {
        var normalizedMetric = metric.Trim().ToLowerInvariant();
        if (normalizedMetric is not ("visits" or "users" or "cities" or "countries"))
            return BadRequest(new MessageResponse { Status = "fail", Message = "موضوع گزارش معتبر نیست." });

        var range = NormalizeAnalyticsRange(from, to, maximumDays: 366);
        var previousFrom = range.From.AddDays(-range.DayCount);
        var previousToExclusive = range.From;

        var currentVisits = _context.Visits.AsNoTracking()
            .Where(item => item.Time >= range.From && item.Time < range.ToExclusive);
        var previousVisits = _context.Visits.AsNoTracking()
            .Where(item => item.Time >= previousFrom && item.Time < previousToExclusive);

        var currentRows = await currentVisits
            .Select(item => new { item.Time, item.Ip, item.City, item.Country, item.Path })
            .ToListAsync(cancellationToken);
        var previousRows = await previousVisits
            .Select(item => new { item.Time, item.Ip, item.City, item.Country })
            .ToListAsync(cancellationToken);

        static string MetricValue(string metricName, string ip, string city, string country) => metricName switch
        {
            "users" => ip,
            "cities" => city,
            "countries" => country,
            _ => string.Empty
        };

        int CountRows<T>(IEnumerable<T> rows, Func<T, string> selector) =>
            normalizedMetric == "visits"
                ? rows.Count()
                : rows.Select(selector).Where(value => !string.IsNullOrWhiteSpace(value)).Distinct(StringComparer.OrdinalIgnoreCase).Count();

        var total = CountRows(currentRows, item => MetricValue(normalizedMetric, item.Ip, item.City, item.Country));
        var previousTotal = CountRows(previousRows, item => MetricValue(normalizedMetric, item.Ip, item.City, item.Country));

        var daily = currentRows
            .GroupBy(item => IranDateTime.ToIranTime(item.Time).Date)
            .ToDictionary(
                group => group.Key,
                group => normalizedMetric == "visits"
                    ? group.Count()
                    : group.Select(item => MetricValue(normalizedMetric, item.Ip, item.City, item.Country))
                        .Where(value => !string.IsNullOrWhiteSpace(value))
                        .Distinct(StringComparer.OrdinalIgnoreCase)
                        .Count());

        IReadOnlyList<AnalyticsBreakdownDto> breakdown = normalizedMetric switch
        {
            "cities" => currentRows.Where(item => !string.IsNullOrWhiteSpace(item.City))
                .GroupBy(item => item.City)
                .Select(group => new AnalyticsBreakdownDto { Label = group.Key, Value = group.Count() })
                .OrderByDescending(item => item.Value).Take(20).ToList(),
            "countries" => currentRows.Where(item => !string.IsNullOrWhiteSpace(item.Country))
                .GroupBy(item => item.Country)
                .Select(group => new AnalyticsBreakdownDto { Label = group.Key, Value = group.Count() })
                .OrderByDescending(item => item.Value).Take(20).ToList(),
            _ => currentRows.Where(item => !string.IsNullOrWhiteSpace(item.Path))
                .GroupBy(item => item.Path)
                .Select(group => new AnalyticsBreakdownDto
                {
                    Label = group.Key,
                    Path = group.Key,
                    Value = normalizedMetric == "visits"
                        ? group.Count()
                        : group.Select(item => item.Ip).Where(value => value != string.Empty).Distinct().Count()
                })
                .OrderByDescending(item => item.Value).Take(20).ToList()
        };

        var title = normalizedMetric switch
        {
            "users" => "بازدیدکنندگان یکتا",
            "cities" => "شهرهای شناسایی‌شده",
            "countries" => "کشورهای شناسایی‌شده",
            _ => "بازدید صفحات"
        };

        return Ok(new AnalyticsReportDto
        {
            Metric = normalizedMetric,
            Title = title,
            From = range.IranFrom,
            To = range.IranToExclusive.AddTicks(-1),
            Total = total,
            ChangePercent = CalculateChangePercent(total, previousTotal),
            Series = FillAnalyticsSeries(range.IranFrom, range.IranToExclusive, daily),
            Breakdown = breakdown
        });
    }

    [HttpGet("popular-paths")]
    public async Task<IActionResult> GetPopularPaths(
        DateTime? from = null,
        DateTime? to = null,
        CancellationToken cancellationToken = default)
    {
        var range = NormalizeAnalyticsRange(from, to);
        var popular = await _context.Visits
            .AsNoTracking()
            .Where(item => item.Time >= range.From && item.Time < range.ToExclusive)
            .GroupBy(v => new { v.Path, v.PathType, v.PathParam })
            .Select(group => new
            {
                path = group.Key.Path,
                type = group.Key.PathType,
                param = group.Key.PathParam,
                count = group.Count(),
                lastVisit = group.Max(v => v.Time)
            })
            .OrderByDescending(item => item.count)
            .Take(100)
            .ToListAsync(cancellationToken);

        return Ok(popular);
    }

    [AllowAnonymous]
    [EnableRateLimiting("contact")]
    [HttpPost("SendMessage")]
    public async Task<IActionResult> SendMessage([FromBody] MessageDto data)
    {
        if (string.IsNullOrWhiteSpace(data.name) ||
            string.IsNullOrWhiteSpace(data.phone) ||
            string.IsNullOrWhiteSpace(data.content))
        {
            return BadRequest(new MessageResponse { Status = "fail", Message = "نام، تلفن و متن پیام الزامی است." });
        }

        if (!System.Text.RegularExpressions.Regex.IsMatch(data.phone.Trim(), @"^09\d{9}$"))
            return BadRequest(new MessageResponse { Status = "fail", Message = "شماره تلفن همراه معتبر نیست." });

        data.name = Truncate(data.name.Trim(), 150);
        data.email = Truncate((data.email ?? string.Empty).Trim(), 200);
        data.phone = data.phone.Trim();
        data.subject = string.IsNullOrWhiteSpace(data.subject) ? null : Truncate(data.subject.Trim(), 250);
        data.content = Truncate(data.content.Trim(), 4000);

        var stored = await _templateService.SendMessageForContacts(data);
        if (!stored)
            return StatusCode(StatusCodes.Status500InternalServerError,
                new MessageResponse { Status = "fail", Message = "ذخیره پیام انجام نشد؛ دوباره تلاش کنید." });

        var target = _configuration["Sms:NotificationTarget"];
        if (!string.IsNullOrWhiteSpace(target))
        {
            _ = await _smsService.SendAsync(target,
                $"پیام جدید سایت ساخت خانه\nنام: {data.name}\nتلفن: {data.phone}\nموضوع: {data.subject}\n{data.content}");
        }

        return Ok(new MessageResponse { Message = "پیام شما با موفقیت ثبت شد." });
    }

    #endregion

    #region File upload

    [EnableRateLimiting("upload")]
    [RequestSizeLimit(10 * 1024 * 1024)]
    [HttpPost("projects/uploadCover")]
    public async Task<IActionResult> UploadCover(IFormFile cover, CancellationToken cancellationToken)
    {
        try
        {
            var url = await _fileStorage.SaveImageAsync(cover, cancellationToken);
            return Ok(new { url });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new MessageResponse { Status = "fail", Message = ex.Message });
        }
    }

    [EnableRateLimiting("upload")]
    [RequestSizeLimit(100 * 1024 * 1024)]
    [HttpPost("projects/uploadGallery")]
    public async Task<IActionResult> UploadGallery(List<IFormFile> gallery, CancellationToken cancellationToken)
    {
        try
        {
            var urls = await _fileStorage.SaveImagesAsync(gallery, cancellationToken);
            return Ok(new { urls });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new MessageResponse { Status = "fail", Message = ex.Message });
        }
    }

    #endregion

    #region Projects

    [HttpGet("getProjects")]
    public async Task<ActionResult<IReadOnlyList<Project>>> GetProjects()
    {
        return Ok(await _context.Projects
            .AsNoTracking()
            .Include(project => project.Gallery)
            .Include(project => project.Category)
            .OrderByDescending(project => project.Time)
            .ToListAsync());
    }

    [HttpGet("projects/get/{projectId:guid}")]
    public async Task<ActionResult<Project>> GetProject(Guid projectId)
    {
        var project = await _context.Projects
            .AsNoTracking()
            .Include(item => item.Gallery)
            .Include(item => item.Category)
            .FirstOrDefaultAsync(item => item.Id == projectId);

        return project is null ? NotFound() : Ok(project);
    }

    [HttpPost("projects/create")]
    public async Task<IActionResult> CreateProject(
        [FromBody] ProjectCoreDto project,
        CancellationToken cancellationToken)
    {
        if (project is null ||
            string.IsNullOrWhiteSpace(project.endpoint_Path) ||
            string.IsNullOrWhiteSpace(project.title) ||
            string.IsNullOrWhiteSpace(project.content))
        {
            return BadRequest(new MessageResponse
            {
                Status = "fail",
                Message = "عنوان، مسیر و محتوای پروژه الزامی است."
            });
        }

        if (!TryNormalizeSlug(project.endpoint_Path, out var slug))
            return BadRequest(new MessageResponse { Status = "fail", Message = "مسیر باید با حروف انگلیسی، عدد و خط تیره نوشته شود." });

        if (await _context.Projects.AnyAsync(
                item => item.Endpoint_Path.ToLower() == slug.ToLower(),
                cancellationToken))
        {
            return Conflict(new MessageResponse { Status = "fail", Message = "path-already-exists" });
        }

        if (project.categoryId.HasValue &&
            !await _context.ProjectCategories.AnyAsync(
                item => item.Id == project.categoryId.Value,
                cancellationToken))
        {
            return BadRequest(new MessageResponse { Status = "fail", Message = "دسته‌بندی انتخاب‌شده معتبر نیست." });
        }

        if (!Enum.IsDefined(typeof(ProjectStatus), project.status))
            return BadRequest(new MessageResponse { Status = "fail", Message = "وضعیت پروژه معتبر نیست." });

        var coverImageUrl = NormalizeAssetUrl(project.coverImageUrl);
        if (string.IsNullOrWhiteSpace(coverImageUrl))
            return BadRequest(new MessageResponse { Status = "fail", Message = "تصویر کاور پروژه باید ابتدا با موفقیت بارگذاری شود." });

        var entity = new Project
        {
            Id = Guid.NewGuid(),
            Endpoint_Path = slug,
            CoverImageUrl = coverImageUrl,
            Title = project.title.Trim(),
            Description = project.description?.Trim(),
            Time = project.time?.Trim(),
            Location = project.location?.Trim(),
            Owner = project.owner?.Trim(),
            Content = _htmlSanitizer.Sanitize(project.content),
            SeoTitle = project.seoTitle?.Trim(),
            MetaDescription = project.metaDescription?.Trim(),
            CoverImageAlt = string.IsNullOrWhiteSpace(project.coverImageAlt)
                ? project.title.Trim()
                : project.coverImageAlt.Trim(),
            CategoryId = project.categoryId,
            Status = project.status
        };

        entity.Gallery = NormalizeProjectGalleryUrls(project.gallery)
            .Select(url => new ProjectGalleryItem
            {
                Id = Guid.NewGuid(),
                ProjectId = entity.Id,
                ImageUrl = url
            })
            .ToList();

        try
        {
            _context.Projects.Add(entity);
            await _context.SaveChangesAsync(cancellationToken);

            return Ok(new MessageResponse
            {
                Message = "پروژه با موفقیت ایجاد شد."
            });
        }
        catch (DbUpdateException exception)
        {
            var reference = HttpContext.TraceIdentifier;
            _logger.LogError(
                exception,
                "Creating project {ProjectTitle} failed. TraceId: {TraceId}",
                entity.Title,
                reference);

            return StatusCode(StatusCodes.Status500InternalServerError, new MessageResponse
            {
                Status = "fail",
                Message = $"ذخیره پروژه در دیتابیس انجام نشد. کد پیگیری: {reference}"
            });
        }
        catch (Exception exception) when (exception is not OperationCanceledException)
        {
            var reference = HttpContext.TraceIdentifier;
            _logger.LogError(
                exception,
                "Unexpected project creation failure for {ProjectTitle}. TraceId: {TraceId}",
                entity.Title,
                reference);

            return StatusCode(StatusCodes.Status500InternalServerError, new MessageResponse
            {
                Status = "fail",
                Message = $"خطای پیش‌بینی‌نشده در ایجاد پروژه رخ داد. کد پیگیری: {reference}"
            });
        }
    }

    [HttpPost("projects/update")]
    public async Task<IActionResult> UpdateProject(
        [FromBody] ProjectCoreDto project,
        CancellationToken cancellationToken)
    {
        if (project?.id is null)
            return BadRequest(new MessageResponse { Status = "fail", Message = "شناسه پروژه نامعتبر است." });

        if (string.IsNullOrWhiteSpace(project.endpoint_Path) ||
            string.IsNullOrWhiteSpace(project.title) ||
            string.IsNullOrWhiteSpace(project.content))
        {
            return BadRequest(new MessageResponse
            {
                Status = "fail",
                Message = "عنوان، مسیر و محتوای پروژه الزامی است."
            });
        }

        var entity = await _context.Projects
            .FirstOrDefaultAsync(item => item.Id == project.id.Value, cancellationToken);

        if (entity is null)
            return NotFound(new MessageResponse { Status = "fail", Message = "پروژه پیدا نشد." });

        if (!TryNormalizeSlug(project.endpoint_Path, out var slug))
            return BadRequest(new MessageResponse { Status = "fail", Message = "مسیر باید با حروف انگلیسی، عدد و خط تیره نوشته شود." });

        if (await _context.Projects.AnyAsync(
                item => item.Id != entity.Id && item.Endpoint_Path.ToLower() == slug.ToLower(),
                cancellationToken))
        {
            return Conflict(new MessageResponse { Status = "fail", Message = "path-already-exists" });
        }

        if (project.categoryId.HasValue &&
            !await _context.ProjectCategories.AnyAsync(
                item => item.Id == project.categoryId.Value,
                cancellationToken))
        {
            return BadRequest(new MessageResponse { Status = "fail", Message = "دسته‌بندی انتخاب‌شده معتبر نیست." });
        }

        if (!Enum.IsDefined(typeof(ProjectStatus), project.status))
            return BadRequest(new MessageResponse { Status = "fail", Message = "وضعیت پروژه معتبر نیست." });

        var normalizedCover = NormalizeAssetUrl(project.coverImageUrl);
        if (string.IsNullOrWhiteSpace(normalizedCover))
            normalizedCover = entity.CoverImageUrl;

        if (string.IsNullOrWhiteSpace(normalizedCover))
            return BadRequest(new MessageResponse { Status = "fail", Message = "تصویر کاور پروژه معتبر نیست." });

        var galleryUrls = NormalizeProjectGalleryUrls(project.gallery);

        try
        {
            entity.Endpoint_Path = slug;
            entity.CoverImageUrl = normalizedCover;
            entity.Title = project.title.Trim();
            entity.Description = project.description?.Trim();
            entity.Time = project.time?.Trim();
            entity.Location = project.location?.Trim();
            entity.Owner = project.owner?.Trim();
            entity.Content = _htmlSanitizer.Sanitize(project.content);
            entity.SeoTitle = project.seoTitle?.Trim();
            entity.MetaDescription = project.metaDescription?.Trim();
            entity.CoverImageAlt = string.IsNullOrWhiteSpace(project.coverImageAlt)
                ? project.title.Trim()
                : project.coverImageAlt.Trim();
            entity.CategoryId = project.categoryId;
            entity.Status = project.status;

            var existingGallery = await _context.GalleryItems
                .Where(item => item.ProjectId == entity.Id)
                .ToListAsync(cancellationToken);

            if (existingGallery.Count > 0)
                _context.GalleryItems.RemoveRange(existingGallery);

            if (galleryUrls.Count > 0)
            {
                await _context.GalleryItems.AddRangeAsync(
                    galleryUrls.Select(url => new ProjectGalleryItem
                    {
                        Id = Guid.NewGuid(),
                        ProjectId = entity.Id,
                        ImageUrl = url
                    }),
                    cancellationToken);
            }

            // Entity and gallery changes are persisted in one SaveChanges call. EF Core
            // wraps this operation in a transaction, so the update remains atomic without
            // holding a separate SQLite transaction open during validation and tracking.
            await _context.SaveChangesAsync(cancellationToken);

            return Ok(new MessageResponse
            {
                Message = "پروژه با موفقیت به‌روزرسانی شد."
            });
        }
        catch (DbUpdateException exception)
        {
            var reference = HttpContext.TraceIdentifier;

            _logger.LogError(
                exception,
                "Updating project {ProjectId} failed. TraceId: {TraceId}",
                entity.Id,
                reference);

            return StatusCode(StatusCodes.Status500InternalServerError, new MessageResponse
            {
                Status = "fail",
                Message = $"به‌روزرسانی پروژه در دیتابیس انجام نشد. کد پیگیری: {reference}"
            });
        }
        catch (Exception exception) when (exception is not OperationCanceledException)
        {
            var reference = HttpContext.TraceIdentifier;

            _logger.LogError(
                exception,
                "Unexpected project update failure for {ProjectId}. TraceId: {TraceId}",
                entity.Id,
                reference);

            return StatusCode(StatusCodes.Status500InternalServerError, new MessageResponse
            {
                Status = "fail",
                Message = $"خطای پیش‌بینی‌نشده در به‌روزرسانی پروژه رخ داد. کد پیگیری: {reference}"
            });
        }
    }

    [HttpDelete("projects/{projectId:guid}")]
    public async Task<IActionResult> DeleteProject(Guid projectId)
    {
        var entity = await _context.Projects.FindAsync(projectId);
        if (entity is null)
            return NotFound();

        _context.Projects.Remove(entity);
        await _context.SaveChangesAsync();
        return Ok(new MessageResponse { Message = "پروژه حذف شد." });
    }

    [HttpGet("project-categories/get")]
    public async Task<ActionResult<IReadOnlyList<ProjectCategoryDto>>> GetProjectCategories()
    {
        var categories = await _context.ProjectCategories
            .AsNoTracking()
            .OrderBy(item => item.SortOrder)
            .ThenBy(item => item.Title)
            .Select(item => new ProjectCategoryDto
            {
                Id = item.Id,
                ParentId = item.ParentId,
                Title = item.Title,
                Slug = item.Slug,
                SortOrder = item.SortOrder,
                IsVisible = item.IsVisible,
                ProjectCount = item.Projects.Count
            })
            .ToListAsync();

        return Ok(BuildProjectCategoryTree(categories));
    }

    [HttpGet("project-categories/flat")]
    public async Task<ActionResult<IReadOnlyList<ProjectCategoryDto>>> GetProjectCategoriesFlat()
    {
        return Ok(await _context.ProjectCategories
            .AsNoTracking()
            .OrderBy(item => item.SortOrder)
            .ThenBy(item => item.Title)
            .Select(item => new ProjectCategoryDto
            {
                Id = item.Id,
                ParentId = item.ParentId,
                Title = item.Title,
                Slug = item.Slug,
                SortOrder = item.SortOrder,
                IsVisible = item.IsVisible,
                ProjectCount = item.Projects.Count
            })
            .ToListAsync());
    }

    [HttpPost("project-categories/create")]
    public async Task<IActionResult> CreateProjectCategory([FromBody] ProjectCategoryDto category)
    {
        var validation = await ValidateProjectCategoryAsync(category, null);
        if (validation is not null) return validation;

        _context.ProjectCategories.Add(new ProjectCategory
        {
            Id = Guid.NewGuid(),
            ParentId = category.ParentId,
            Title = category.Title.Trim(),
            Slug = NormalizeSlug(category.Slug),
            SortOrder = category.SortOrder,
            IsVisible = category.IsVisible
        });
        await _context.SaveChangesAsync();
        return Ok(new MessageResponse { Message = "دسته‌بندی پروژه ایجاد شد." });
    }

    [HttpPost("project-categories/update")]
    public async Task<IActionResult> UpdateProjectCategory([FromBody] ProjectCategoryDto category)
    {
        if (!category.Id.HasValue) return BadRequest();
        var validation = await ValidateProjectCategoryAsync(category, category.Id.Value);
        if (validation is not null) return validation;

        var entity = await _context.ProjectCategories.FindAsync(category.Id.Value);
        if (entity is null) return NotFound();

        entity.ParentId = category.ParentId;
        entity.Title = category.Title.Trim();
        entity.Slug = NormalizeSlug(category.Slug);
        entity.SortOrder = category.SortOrder;
        entity.IsVisible = category.IsVisible;
        await _context.SaveChangesAsync();
        return Ok(new MessageResponse { Message = "دسته‌بندی پروژه ویرایش شد." });
    }

    [HttpDelete("project-categories/{categoryId:guid}")]
    public async Task<IActionResult> DeleteProjectCategory(Guid categoryId)
    {
        if (await _context.ProjectCategories.AnyAsync(item => item.ParentId == categoryId))
            return Conflict(new MessageResponse { Status = "fail", Message = "ابتدا زیرشاخه‌های این دسته‌بندی را منتقل یا حذف کنید." });
        if (await _context.Projects.AnyAsync(item => item.CategoryId == categoryId))
            return Conflict(new MessageResponse { Status = "fail", Message = "ابتدا پروژه‌های این دسته‌بندی را منتقل کنید." });

        var entity = await _context.ProjectCategories.FindAsync(categoryId);
        if (entity is null) return NotFound();
        _context.ProjectCategories.Remove(entity);
        await _context.SaveChangesAsync();
        return Ok(new MessageResponse { Message = "دسته‌بندی پروژه حذف شد." });
    }

    #endregion

    #region Blog

    [HttpGet("blog/categories/get")]
    public async Task<ActionResult<IReadOnlyList<BlogCategoryTreeDto>>> GetBlogCategories()
    {
        var categories = await _context.BlogCategories
            .AsNoTracking()
            .OrderBy(item => item.SortOrder)
            .ThenBy(item => item.Title)
            .Select(item => new BlogCategoryTreeDto
            {
                id = item.Id,
                parentId = item.ParentId,
                title = item.Title,
                slug = item.Slug,
                sortOrder = item.SortOrder,
                isVisible = item.IsVisible,
                postCount = _context.BlogPosts.Count(post => post.CategoryId == item.Id)
            })
            .ToListAsync();

        return Ok(BuildBlogCategoryTree(categories));
    }

    [HttpGet("blog/categories/flat")]
    public async Task<ActionResult<IReadOnlyList<BlogCategoryTreeDto>>> GetBlogCategoriesFlat()
    {
        return Ok(await _context.BlogCategories
            .AsNoTracking()
            .OrderBy(item => item.SortOrder)
            .ThenBy(item => item.Title)
            .Select(item => new BlogCategoryTreeDto
            {
                id = item.Id,
                parentId = item.ParentId,
                title = item.Title,
                slug = item.Slug,
                sortOrder = item.SortOrder,
                isVisible = item.IsVisible,
                postCount = _context.BlogPosts.Count(post => post.CategoryId == item.Id)
            })
            .ToListAsync());
    }

    [HttpPost("blog/categories/create")]
    public async Task<IActionResult> CreateBlogCategory([FromBody] BlogCategoryCoreDto category)
    {
        var validation = await ValidateBlogCategoryAsync(category, null);
        if (validation is not null) return validation;

        _context.BlogCategories.Add(new BlogCategory
        {
            ParentId = category.parentId,
            Title = category.title.Trim(),
            Slug = NormalizeSlug(category.slug),
            SortOrder = category.sortOrder,
            IsVisible = category.isVisible
        });
        await _context.SaveChangesAsync();
        return Ok(new MessageResponse { Message = "دسته‌بندی بلاگ ایجاد شد." });
    }

    [HttpPost("blog/categories/update")]
    public async Task<IActionResult> UpdateBlogCategory([FromBody] BlogCategoryCoreDto category)
    {
        if (category.id is null) return BadRequest();
        var validation = await ValidateBlogCategoryAsync(category, category.id.Value);
        if (validation is not null) return validation;

        var entity = await _context.BlogCategories.FindAsync(category.id.Value);
        if (entity is null) return NotFound(new MessageResponse { Status = "fail", Message = "دسته‌بندی پیدا نشد." });

        entity.ParentId = category.parentId;
        entity.Title = category.title.Trim();
        entity.Slug = NormalizeSlug(category.slug);
        entity.SortOrder = category.sortOrder;
        entity.IsVisible = category.isVisible;
        await _context.SaveChangesAsync();
        return Ok(new MessageResponse { Message = "دسته‌بندی بلاگ ویرایش شد." });
    }

    [HttpPost("blog/categories/delete")]
    public async Task<IActionResult> DeleteBlogCategory([FromBody] BlogCategoryCoreDto category)
    {
        if (category.id is null) return BadRequest();
        if (await _context.BlogCategories.AnyAsync(item => item.ParentId == category.id.Value))
            return Conflict(new MessageResponse { Status = "fail", Message = "ابتدا زیرشاخه‌های این دسته‌بندی را منتقل یا حذف کنید." });
        if (await _context.BlogPosts.AnyAsync(post => post.CategoryId == category.id.Value))
            return Conflict(new MessageResponse { Status = "fail", Message = "ابتدا مطالب این دسته‌بندی را به دسته دیگری منتقل کنید." });

        var entity = await _context.BlogCategories.FindAsync(category.id.Value);
        if (entity is null) return NotFound();
        _context.BlogCategories.Remove(entity);
        await _context.SaveChangesAsync();
        return Ok(new MessageResponse { Message = "دسته‌بندی بلاگ حذف شد." });
    }

    [HttpGet("blog/posts/get")]
    public async Task<ActionResult<IReadOnlyList<BlogPost>>> GetBlogPosts()
    {
        return Ok(await _context.BlogPosts
            .AsNoTracking()
            .Include(item => item.Category)
            .OrderByDescending(item => item.CreationDate)
            .ToListAsync());
    }

    [HttpGet("blog/posts/get/{postId:guid}")]
    public async Task<ActionResult<BlogPost>> GetBlogPost(Guid postId)
    {
        var entity = await _context.BlogPosts
            .AsNoTracking()
            .Include(item => item.Category)
            .FirstOrDefaultAsync(item => item.Id == postId);

        return entity is null ? NotFound() : Ok(entity);
    }

    [HttpPost("blog/posts/create")]
    public async Task<IActionResult> CreateBlogPost([FromBody] BlogPostCoreDto blogPost)
    {
        var validation = await ValidateBlogPostAsync(blogPost, null);
        if (validation is not null)
            return validation;

        var now = DateTime.UtcNow;
        _context.BlogPosts.Add(new BlogPost
        {
            Id = Guid.NewGuid(),
            EndpointPath = NormalizeSlug(blogPost.endpointPath),
            CategoryId = blogPost.categoryId,
            Title = blogPost.title.Trim(),
            Description = blogPost.description.Trim(),
            Author = ContentAuthor,
            ImageUrl = NormalizeAssetUrl(blogPost.imageUrl),
            CreationDate = blogPost.creationDate ?? now,
            LastUpdateDate = null,
            Content = _htmlSanitizer.Sanitize(blogPost.content),
            Tags = NormalizeTags(blogPost.tags),
            SeoTitle = blogPost.seoTitle?.Trim(),
            MetaDescription = blogPost.metaDescription?.Trim(),
            ImageAlt = string.IsNullOrWhiteSpace(blogPost.imageAlt) ? blogPost.title.Trim() : blogPost.imageAlt.Trim()
        });

        await _context.SaveChangesAsync();
        return Ok(new MessageResponse { Message = "created" });
    }

    [HttpPost("blog/posts/update")]
    public async Task<IActionResult> UpdateBlogPost([FromBody] BlogPostCoreDto blogPost)
    {
        if (blogPost.id is null)
            return BadRequest(new MessageResponse { Status = "fail", Message = "شناسه مطلب نامعتبر است." });

        var validation = await ValidateBlogPostAsync(blogPost, blogPost.id.Value);
        if (validation is not null)
            return validation;

        var entity = await _context.BlogPosts.FindAsync(blogPost.id.Value);
        if (entity is null)
            return NotFound(new MessageResponse { Status = "fail", Message = "مطلب پیدا نشد." });

        entity.EndpointPath = NormalizeSlug(blogPost.endpointPath);
        entity.CategoryId = blogPost.categoryId;
        entity.Title = blogPost.title.Trim();
        entity.Description = blogPost.description.Trim();
        entity.Author = ContentAuthor;
        entity.ImageUrl = NormalizeAssetUrl(blogPost.imageUrl);
        entity.Content = _htmlSanitizer.Sanitize(blogPost.content);
        entity.Tags = NormalizeTags(blogPost.tags);
        entity.SeoTitle = blogPost.seoTitle?.Trim();
        entity.MetaDescription = blogPost.metaDescription?.Trim();
        entity.ImageAlt = string.IsNullOrWhiteSpace(blogPost.imageAlt) ? blogPost.title.Trim() : blogPost.imageAlt.Trim();
        entity.LastUpdateDate = DateTime.UtcNow;

        await _context.SaveChangesAsync();
        return Ok(new MessageResponse { Message = "updated" });
    }

    [HttpDelete("blog/posts/{postId:guid}")]
    public async Task<IActionResult> DeleteBlogPost(Guid postId)
    {
        var entity = await _context.BlogPosts.FindAsync(postId);
        if (entity is null)
            return NotFound();

        _context.BlogPosts.Remove(entity);
        await _context.SaveChangesAsync();
        return Ok(new MessageResponse { Message = "مطلب حذف شد." });
    }

    #endregion

    #region Journals

    [HttpGet("journals/get")]
    public async Task<ActionResult<IReadOnlyList<Journal>>> GetJournals(CancellationToken cancellationToken)
    {
        return Ok(await _context.Journals
            .AsNoTracking()
            .Include(item => item.Gallery.OrderBy(image => image.SortOrder))
            .OrderByDescending(item => item.CreationDate)
            .ToListAsync(cancellationToken));
    }

    [HttpGet("journals/get/{journalId:guid}")]
    public async Task<ActionResult<Journal>> GetJournal(Guid journalId, CancellationToken cancellationToken)
    {
        var journal = await _context.Journals
            .AsNoTracking()
            .Include(item => item.Gallery.OrderBy(image => image.SortOrder))
            .FirstOrDefaultAsync(item => item.Id == journalId, cancellationToken);

        return journal is null ? NotFound() : Ok(journal);
    }

    [HttpPost("journals/create")]
    public async Task<IActionResult> CreateJournal([FromBody] JournalCoreDto dto, CancellationToken cancellationToken)
    {
        var validation = await ValidateJournalAsync(dto, null);
        if (validation is not null)
            return validation;

        var journalId = Guid.NewGuid();
        var gallery = NormalizeJournalGallery(dto, journalId);
        var cover = gallery[0];

        _context.Journals.Add(new Journal
        {
            Id = journalId,
            EndpointPath = NormalizeSlug(dto.EndpointPath),
            Title = dto.Title.Trim(),
            Description = _htmlSanitizer.Sanitize(dto.Description),
            ImageUrl = cover.ImageUrl,
            ImageAlt = cover.ImageAlt,
            Tags = NormalizeTags(dto.Tags),
            Author = ContentAuthor,
            CreationDate = DateTime.UtcNow,
            IsPublished = dto.IsPublished,
            Gallery = gallery
        });

        await _context.SaveChangesAsync(cancellationToken);
        return Ok(new MessageResponse { Message = "ژورنال ایجاد شد." });
    }

    [HttpPost("journals/update")]
    public async Task<IActionResult> UpdateJournal([FromBody] JournalCoreDto dto, CancellationToken cancellationToken)
    {
        if (dto.Id is null)
            return BadRequest(new MessageResponse { Status = "fail", Message = "شناسه ژورنال نامعتبر است." });

        var validation = await ValidateJournalAsync(dto, dto.Id.Value);
        if (validation is not null)
            return validation;

        var entity = await _context.Journals
            .Include(item => item.Gallery)
            .FirstOrDefaultAsync(item => item.Id == dto.Id.Value, cancellationToken);

        if (entity is null)
            return NotFound();

        var gallery = NormalizeJournalGallery(dto, entity.Id);
        var cover = gallery[0];

        entity.EndpointPath = NormalizeSlug(dto.EndpointPath);
        entity.Title = dto.Title.Trim();
        entity.Description = _htmlSanitizer.Sanitize(dto.Description);
        entity.ImageUrl = cover.ImageUrl;
        entity.ImageAlt = cover.ImageAlt;
        entity.Tags = NormalizeTags(dto.Tags);
        entity.Author = ContentAuthor;
        entity.IsPublished = dto.IsPublished;
        entity.LastUpdateDate = DateTime.UtcNow;

        _context.JournalGalleryItems.RemoveRange(entity.Gallery);
        entity.Gallery = gallery;

        await _context.SaveChangesAsync(cancellationToken);
        return Ok(new MessageResponse { Message = "ژورنال ویرایش شد." });
    }

    [HttpDelete("journals/{journalId:guid}")]
    public async Task<IActionResult> DeleteJournal(Guid journalId, CancellationToken cancellationToken)
    {
        var entity = await _context.Journals.FindAsync([journalId], cancellationToken);
        if (entity is null)
            return NotFound();

        _context.Journals.Remove(entity);
        await _context.SaveChangesAsync(cancellationToken);
        return Ok(new MessageResponse { Message = "ژورنال حذف شد." });
    }

    #endregion

    #region Template and services

    [HttpPost("template/get")]
    public async Task<IActionResult> GetTemplateRow([FromBody] TemplatesPropertyCoreDto row)
    {
        var data = await _context.TemplatesProperties
            .AsNoTracking()
            .FirstOrDefaultAsync(item => item.Path == row.path && item.Key == row.key);

        return Ok(new MessageResponse
        {
            Message = JsonSerializer.Serialize(data)
        });
    }

    [HttpPost("template/get-multiple")]
    public async Task<IActionResult> GetTemplateRows([FromBody] TemplatesPropertyCoreDto row)
    {
        var data = await _context.TemplatesProperties
            .AsNoTracking()
            .Where(item => item.Path == row.path && item.Key == row.key)
            .ToListAsync();

        return Ok(new MessageResponse { Message = JsonSerializer.Serialize(data) });
    }

    [HttpPost("template/set")]
    public async Task<IActionResult> SetTemplateRow([FromBody] TemplatesPropertyCoreDto row)
    {
        if (row is null || string.IsNullOrWhiteSpace(row.path) || string.IsNullOrWhiteSpace(row.key))
            return BadRequest(new MessageResponse { Status = "fail", Message = "مسیر و کلید قالب الزامی است." });

        await UpsertTemplateRowAsync(row);
        await _context.SaveChangesAsync();
        return Ok(new MessageResponse { Message = "template row has been set" });
    }

    [HttpPost("template/set-multiple")]
    public async Task<IActionResult> SetTemplateRows([FromBody] List<TemplatesPropertyCoreDto> rows)
    {
        if (rows is null || rows.Count == 0 || rows.Any(row => string.IsNullOrWhiteSpace(row.path) || string.IsNullOrWhiteSpace(row.key)))
            return BadRequest(new MessageResponse { Status = "fail", Message = "اطلاعات قالب ناقص است." });

        await using var transaction = await _context.Database.BeginTransactionAsync();
        foreach (var row in rows)
            await UpsertTemplateRowAsync(row);

        await _context.SaveChangesAsync();
        await transaction.CommitAsync();
        return Ok(new MessageResponse { Message = "template rows have been set" });
    }

    [HttpGet("social-links/get")]
    public async Task<ActionResult<IReadOnlyList<SocialLinkDto>>> GetSocialLinks()
    {
        return Ok(await _context.SocialLinks
            .AsNoTracking()
            .OrderBy(item => item.SortOrder)
            .ThenBy(item => item.Title)
            .Select(item => new SocialLinkDto
            {
                Id = item.Id,
                Platform = item.Platform,
                Title = item.Title,
                Url = item.Url,
                Username = item.Username,
                IconName = item.IconName,
                SortOrder = item.SortOrder,
                IsVisible = item.IsVisible
            })
            .ToListAsync());
    }

    [HttpPost("social-links/save")]
    public async Task<IActionResult> SaveSocialLinks([FromBody] List<SocialLinkDto> links)
    {
        links ??= new List<SocialLinkDto>();
        if (links.Where(item => item.Id.HasValue)
                .GroupBy(item => item.Id!.Value)
                .Any(group => group.Count() > 1))
        {
            return BadRequest(new MessageResponse { Status = "fail", Message = "شناسه تکراری در شبکه‌های اجتماعی دریافت شد." });
        }

        var normalized = new List<SocialLinkDto>();
        foreach (var item in links)
        {
            if (string.IsNullOrWhiteSpace(item.Title))
                return BadRequest(new MessageResponse { Status = "fail", Message = "عنوان شبکه اجتماعی الزامی است." });

            var platform = NormalizePlatform(item.Platform);
            var url = NormalizeSocialUrl(platform, item.Url, item.Username);
            if (string.IsNullOrWhiteSpace(url))
                return BadRequest(new MessageResponse { Status = "fail", Message = $"لینک «{item.Title}» معتبر نیست." });

            normalized.Add(new SocialLinkDto
            {
                Id = item.Id,
                Platform = platform,
                Title = item.Title.Trim(),
                Url = url,
                Username = string.IsNullOrWhiteSpace(item.Username) ? null : item.Username.Trim(),
                IconName = string.IsNullOrWhiteSpace(item.IconName) ? null : item.IconName.Trim(),
                SortOrder = item.SortOrder,
                IsVisible = item.IsVisible
            });
        }

        await using var transaction = await _context.Database.BeginTransactionAsync();
        var current = await _context.SocialLinks.ToListAsync();
        var currentById = current.ToDictionary(item => item.Id);
        var retainedIds = new HashSet<Guid>();

        foreach (var item in normalized)
        {
            SocialLink entity;
            if (item.Id.HasValue && currentById.TryGetValue(item.Id.Value, out var existing))
            {
                entity = existing;
                retainedIds.Add(existing.Id);
            }
            else
            {
                entity = new SocialLink { Id = Guid.NewGuid() };
                _context.SocialLinks.Add(entity);
                retainedIds.Add(entity.Id);
            }

            entity.Platform = item.Platform;
            entity.Title = item.Title;
            entity.Url = item.Url;
            entity.Username = item.Username;
            entity.IconName = item.IconName;
            entity.SortOrder = item.SortOrder;
            entity.IsVisible = item.IsVisible;
        }

        _context.SocialLinks.RemoveRange(current.Where(item => !retainedIds.Contains(item.Id)));
        await _context.SaveChangesAsync();
        await transaction.CommitAsync();
        return Ok(new MessageResponse { Message = "شبکه‌های اجتماعی ذخیره شدند." });
    }

    [HttpGet("template/icons/services/get")]
    public IActionResult GetServiceIcons()
    {
        var folder = Path.Combine(_environment.WebRootPath, "assets", "img", "icons", "services");
        if (!Directory.Exists(folder))
            return NotFound(new MessageResponse { Status = "fail", Message = "Icons folder not found." });

        var icons = Directory.GetFiles(folder, "*.png")
            .Select(file => new IconItem
            {
                title = Path.GetFileNameWithoutExtension(file),
                iconUrl = $"/assets/img/icons/services/{Path.GetFileName(file)}"
            })
            .ToList();

        return Ok(icons);
    }

    [HttpPost("template/saveHomeSliderSettings")]
    public async Task<IActionResult> SaveHomeSliderSettings([FromBody] List<string> urls)
    {
        var currentItems = await _context.TemplatesProperties
            .Where(item => item.Path == "home" && item.Key == "slider-item")
            .ToListAsync();

        _context.TemplatesProperties.RemoveRange(currentItems);
        _context.TemplatesProperties.AddRange(urls
            .Where(url => !string.IsNullOrWhiteSpace(url))
            .Select(url => new TemplatesProperty
            {
                Id = Guid.NewGuid(),
                Path = "home",
                Key = "slider-item",
                Value = NormalizeAssetUrl(url),
                CreationDate = DateTime.UtcNow
            }));

        await _context.SaveChangesAsync();
        return Ok(new MessageResponse { Message = "slider setting has been updated" });
    }

    [HttpGet("services/get")]
    public async Task<IActionResult> GetServices()
    {
        var services = await _context.Services
            .AsNoTracking()
            .OrderBy(item => item.CreationDate)
            .Select(item => new ServiceCoreDto
            {
                id = item.Id,
                title = item.Title,
                iconUrl = item.IconUrl,
                description = item.Description,
                creationDate = item.CreationDate,
                lastUpdateDate = item.LastUpdateDate
            })
            .ToListAsync();

        return Ok(new MessageResponse { Message = JsonSerializer.Serialize(services) });
    }

    [HttpPost("services/create")]
    public async Task<IActionResult> CreateService([FromBody] ServiceCoreDto row)
    {
        _context.Services.Add(new Service
        {
            Id = Guid.NewGuid(),
            Title = row.title?.Trim() ?? string.Empty,
            IconUrl = NormalizeAssetUrl(row.iconUrl ?? string.Empty),
            Description = _htmlSanitizer.Sanitize(row.description),
            CreationDate = DateTime.UtcNow
        });

        await _context.SaveChangesAsync();
        return Ok(new MessageResponse { Message = "the service was successfully added" });
    }

    [HttpPost("services/edit")]
    public async Task<IActionResult> UpdateService([FromBody] ServiceCoreDto row)
    {
        if (row.id is null)
            return BadRequest();

        var entity = await _context.Services.FindAsync(row.id.Value);
        if (entity is null)
            return NotFound();

        entity.Title = row.title?.Trim() ?? string.Empty;
        entity.IconUrl = NormalizeAssetUrl(row.iconUrl ?? string.Empty);
        entity.Description = _htmlSanitizer.Sanitize(row.description);
        entity.LastUpdateDate = DateTime.UtcNow;

        await _context.SaveChangesAsync();
        return Ok(new MessageResponse { Message = "the service was successfully edited" });
    }

    [HttpDelete("services/{serviceId:guid}")]
    public async Task<IActionResult> DeleteService(Guid serviceId)
    {
        var entity = await _context.Services.FindAsync(serviceId);
        if (entity is null)
            return NotFound();

        _context.Services.Remove(entity);
        await _context.SaveChangesAsync();
        return Ok(new MessageResponse { Message = "خدمت حذف شد." });
    }

    #endregion

    private async Task<IActionResult?> ValidateProjectCategoryAsync(ProjectCategoryDto category, Guid? currentId)
    {
        if (string.IsNullOrWhiteSpace(category.Title) || string.IsNullOrWhiteSpace(category.Slug))
            return BadRequest(new MessageResponse { Status = "fail", Message = "عنوان و مسیر دسته‌بندی الزامی است." });
        if (!TryNormalizeSlug(category.Slug, out var slug))
            return BadRequest(new MessageResponse { Status = "fail", Message = "مسیر دسته‌بندی باید انگلیسی و شامل عدد یا خط تیره باشد." });
        if (await _context.ProjectCategories.AnyAsync(item => item.Slug.ToLower() == slug.ToLower() && (!currentId.HasValue || item.Id != currentId.Value)))
            return Conflict(new MessageResponse { Status = "fail", Message = "این مسیر قبلاً استفاده شده است." });
        if (category.ParentId.HasValue)
        {
            if (currentId.HasValue && category.ParentId.Value == currentId.Value)
                return BadRequest(new MessageResponse { Status = "fail", Message = "یک دسته‌بندی نمی‌تواند والد خودش باشد." });
            if (!await _context.ProjectCategories.AnyAsync(item => item.Id == category.ParentId.Value))
                return BadRequest(new MessageResponse { Status = "fail", Message = "دسته‌بندی والد معتبر نیست." });
            if (currentId.HasValue && await IsProjectCategoryDescendantAsync(category.ParentId.Value, currentId.Value))
                return BadRequest(new MessageResponse { Status = "fail", Message = "انتخاب یکی از زیرشاخه‌ها به‌عنوان والد باعث حلقه در درخت می‌شود." });
        }
        return null;
    }

    private async Task<bool> IsProjectCategoryDescendantAsync(Guid candidateId, Guid ancestorId)
    {
        var parentMap = await _context.ProjectCategories.AsNoTracking().ToDictionaryAsync(item => item.Id, item => item.ParentId);
        var cursor = (Guid?)candidateId;
        var guard = 0;
        while (cursor.HasValue && guard++ < parentMap.Count + 1)
        {
            if (cursor.Value == ancestorId) return true;
            cursor = parentMap.GetValueOrDefault(cursor.Value);
        }
        return false;
    }

    private static List<ProjectCategoryDto> BuildProjectCategoryTree(List<ProjectCategoryDto> categories)
    {
        var lookup = categories.Where(item => item.Id.HasValue).ToDictionary(item => item.Id!.Value);
        foreach (var item in categories)
            if (item.ParentId.HasValue && lookup.TryGetValue(item.ParentId.Value, out var parent)) parent.Children.Add(item);
        return categories.Where(item => !item.ParentId.HasValue)
            .OrderBy(item => item.SortOrder).ThenBy(item => item.Title).ToList();
    }

    private async Task<IActionResult?> ValidateBlogCategoryAsync(BlogCategoryCoreDto category, int? currentId)
    {
        if (string.IsNullOrWhiteSpace(category.title) || string.IsNullOrWhiteSpace(category.slug))
            return BadRequest(new MessageResponse { Status = "fail", Message = "عنوان و مسیر دسته‌بندی الزامی است." });
        if (!TryNormalizeSlug(category.slug, out var slug))
            return BadRequest(new MessageResponse { Status = "fail", Message = "مسیر دسته‌بندی باید انگلیسی و شامل عدد یا خط تیره باشد." });
        if (await _context.BlogCategories.AnyAsync(item => item.Slug.ToLower() == slug.ToLower() && (!currentId.HasValue || item.Id != currentId.Value)))
            return Conflict(new MessageResponse { Status = "fail", Message = "این مسیر قبلاً استفاده شده است." });
        if (category.parentId.HasValue)
        {
            if (currentId.HasValue && category.parentId.Value == currentId.Value)
                return BadRequest(new MessageResponse { Status = "fail", Message = "یک دسته‌بندی نمی‌تواند والد خودش باشد." });
            if (!await _context.BlogCategories.AnyAsync(item => item.Id == category.parentId.Value))
                return BadRequest(new MessageResponse { Status = "fail", Message = "دسته‌بندی والد معتبر نیست." });
            if (currentId.HasValue && await IsBlogCategoryDescendantAsync(category.parentId.Value, currentId.Value))
                return BadRequest(new MessageResponse { Status = "fail", Message = "انتخاب یکی از زیرشاخه‌ها به‌عنوان والد باعث حلقه در درخت می‌شود." });
        }
        return null;
    }

    private async Task<bool> IsBlogCategoryDescendantAsync(int candidateId, int ancestorId)
    {
        var parentMap = await _context.BlogCategories.AsNoTracking().ToDictionaryAsync(item => item.Id, item => item.ParentId);
        var cursor = (int?)candidateId;
        var guard = 0;
        while (cursor.HasValue && guard++ < parentMap.Count + 1)
        {
            if (cursor.Value == ancestorId) return true;
            cursor = parentMap.GetValueOrDefault(cursor.Value);
        }
        return false;
    }

    private static List<BlogCategoryTreeDto> BuildBlogCategoryTree(List<BlogCategoryTreeDto> categories)
    {
        var lookup = categories.Where(item => item.id.HasValue).ToDictionary(item => item.id!.Value);
        foreach (var item in categories)
            if (item.parentId.HasValue && lookup.TryGetValue(item.parentId.Value, out var parent)) parent.children.Add(item);
        return categories.Where(item => !item.parentId.HasValue)
            .OrderBy(item => item.sortOrder).ThenBy(item => item.title).ToList();
    }

    private static string NormalizePlatform(string? platform)
    {
        var normalized = (platform ?? "custom").Trim().ToLowerInvariant();
        return normalized switch
        {
            "instagram" or "telegram" or "whatsapp" or "linkedin" or "youtube" or "aparat" or "x" or "twitter" or "facebook" or "pinterest" => normalized,
            _ => "custom"
        };
    }

    private static string NormalizeSocialUrl(string? platform, string? url, string? username)
    {
        var raw = string.IsNullOrWhiteSpace(url) ? username?.Trim() ?? string.Empty : url.Trim();
        if (string.IsNullOrWhiteSpace(raw)) return string.Empty;
        if (Uri.TryCreate(raw, UriKind.Absolute, out var absolute) && (absolute.Scheme == Uri.UriSchemeHttp || absolute.Scheme == Uri.UriSchemeHttps))
            return absolute.ToString();

        var value = raw.Trim().TrimStart('@').Replace(" ", string.Empty);
        var normalizedPlatform = NormalizePlatform(platform);
        if (normalizedPlatform == "whatsapp")
        {
            var digits = new string(value.Where(char.IsDigit).ToArray());
            return digits.Length is >= 10 and <= 15 ? $"https://wa.me/{digits}" : string.Empty;
        }

        if (string.IsNullOrWhiteSpace(value.Trim('/')))
            return string.Empty;

        return normalizedPlatform switch
        {
            "instagram" => $"https://www.instagram.com/{value.Trim('/')}",
            "telegram" => $"https://t.me/{value.Trim('/')}",
            "linkedin" => $"https://www.linkedin.com/in/{value.Trim('/')}",
            "youtube" => $"https://www.youtube.com/@{value.Trim('/').TrimStart('@')}",
            "aparat" => $"https://www.aparat.com/{value.Trim('/')}",
            "x" or "twitter" => $"https://x.com/{value.Trim('/')}",
            "facebook" => $"https://www.facebook.com/{value.Trim('/')}",
            "pinterest" => $"https://www.pinterest.com/{value.Trim('/')}",
            _ => string.Empty
        };
    }

    private sealed record AnalyticsRange(
        DateTime From,
        DateTime ToExclusive,
        DateTime IranFrom,
        DateTime IranToExclusive,
        int DayCount);

    private static AnalyticsRange NormalizeAnalyticsRange(
        DateTime? from,
        DateTime? to,
        int maximumDays = 90)
    {
        var todayIran = IranDateTime.IranNow.Date;
        var iranTo = to?.Date ?? todayIran;
        var iranFrom = from?.Date ?? iranTo.AddDays(-29);

        if (iranFrom > iranTo)
            (iranFrom, iranTo) = (iranTo, iranFrom);

        var dayCount = (iranTo - iranFrom).Days + 1;
        if (dayCount > maximumDays)
        {
            iranFrom = iranTo.AddDays(-(maximumDays - 1));
            dayCount = maximumDays;
        }

        var iranToExclusive = iranTo.AddDays(1);
        return new AnalyticsRange(
            IranDateTime.IranLocalDateToUtc(iranFrom),
            IranDateTime.IranLocalDateToUtc(iranToExclusive),
            DateTime.SpecifyKind(iranFrom, DateTimeKind.Unspecified),
            DateTime.SpecifyKind(iranToExclusive, DateTimeKind.Unspecified),
            dayCount);
    }

    private static decimal CalculateChangePercent(int current, int previous)
    {
        if (previous == 0)
            return current == 0 ? 0 : 100;

        return Math.Round(((decimal)current - previous) / previous * 100, 1);
    }

    private static IReadOnlyList<AnalyticsPointDto> FillAnalyticsSeries(
        DateTime from,
        DateTime toExclusive,
        IReadOnlyDictionary<DateTime, int> values)
    {
        var points = new List<AnalyticsPointDto>();
        for (var date = from.Date; date < toExclusive.Date; date = date.AddDays(1))
        {
            points.Add(new AnalyticsPointDto
            {
                Date = date,
                Value = values.GetValueOrDefault(date, 0)
            });
        }

        return points;
    }

    private static List<JournalGalleryItem> NormalizeJournalGallery(JournalCoreDto dto, Guid journalId = default)
    {
        var source = dto.Gallery
            .Where(item => !string.IsNullOrWhiteSpace(item.Url))
            .OrderBy(item => item.SortOrder)
            .ToList();

        if (source.Count == 0 && !string.IsNullOrWhiteSpace(dto.ImageUrl))
        {
            source.Add(new JournalGalleryItemDto
            {
                Url = dto.ImageUrl,
                Alt = dto.ImageAlt,
                SortOrder = 0
            });
        }

        return source
            .Select((item, index) => new JournalGalleryItem
            {
                Id = Guid.NewGuid(),
                JournalId = journalId,
                ImageUrl = NormalizeAssetUrl(item.Url),
                ImageAlt = string.IsNullOrWhiteSpace(item.Alt) ? dto.Title.Trim() : item.Alt.Trim(),
                SortOrder = index
            })
            .ToList();
    }

    private string ContentAuthor => _configuration["Site:ContentAuthor"] ?? DefaultContentAuthor;

    private async Task<IActionResult?> ValidateBlogPostAsync(BlogPostCoreDto dto, Guid? currentId)
    {
        if (string.IsNullOrWhiteSpace(dto.endpointPath) || string.IsNullOrWhiteSpace(dto.title) ||
            string.IsNullOrWhiteSpace(dto.description) || string.IsNullOrWhiteSpace(dto.content))
        {
            return BadRequest(new MessageResponse { Status = "fail", Message = "عنوان، مسیر، توضیح و محتوای مطلب الزامی است." });
        }

        if (!await _context.BlogCategories.AnyAsync(item => item.Id == dto.categoryId))
            return BadRequest(new MessageResponse { Status = "fail", Message = "دسته‌بندی انتخاب‌شده معتبر نیست." });

        if (!TryNormalizeSlug(dto.endpointPath, out var slug))
            return BadRequest(new MessageResponse { Status = "fail", Message = "مسیر باید با حروف انگلیسی، عدد و خط تیره نوشته شود." });

        if (await _context.BlogPosts.AnyAsync(item => item.EndpointPath.ToLower() == slug.ToLower() &&
                                                      (!currentId.HasValue || item.Id != currentId.Value)))
        {
            return Conflict(new MessageResponse { Status = "fail", Message = "path-already-exists" });
        }

        return null;
    }

    private async Task<IActionResult?> ValidateJournalAsync(JournalCoreDto dto, Guid? currentId)
    {
        var hasImage = !string.IsNullOrWhiteSpace(dto.ImageUrl) ||
                       dto.Gallery.Any(item => !string.IsNullOrWhiteSpace(item.Url));

        if (string.IsNullOrWhiteSpace(dto.EndpointPath) || string.IsNullOrWhiteSpace(dto.Title) ||
            string.IsNullOrWhiteSpace(dto.Description) || !hasImage)
        {
            return BadRequest(new MessageResponse { Status = "fail", Message = "عنوان، مسیر، توضیح و حداقل یک تصویر ژورنال الزامی است." });
        }

        if (!TryNormalizeSlug(dto.EndpointPath, out var slug))
            return BadRequest(new MessageResponse { Status = "fail", Message = "مسیر باید با حروف انگلیسی، عدد و خط تیره نوشته شود." });

        if (await _context.Journals.AnyAsync(item => item.EndpointPath.ToLower() == slug.ToLower() &&
                                                     (!currentId.HasValue || item.Id != currentId.Value)))
        {
            return Conflict(new MessageResponse { Status = "fail", Message = "path-already-exists" });
        }

        return null;
    }

    private async Task UpsertTemplateRowAsync(TemplatesPropertyCoreDto row)
    {
        if (string.IsNullOrWhiteSpace(row.path) || string.IsNullOrWhiteSpace(row.key))
            throw new InvalidOperationException("Template path and key are required.");

        var data = await _context.TemplatesProperties
            .FirstOrDefaultAsync(item => item.Path == row.path && item.Key == row.key);

        var sanitizedValue = row.key.Contains("content", StringComparison.OrdinalIgnoreCase)
            ? _htmlSanitizer.Sanitize(row.value)
            : NormalizeAssetUrl(row.value ?? string.Empty);

        if (data is null)
        {
            _context.TemplatesProperties.Add(new TemplatesProperty
            {
                Id = Guid.NewGuid(),
                Path = row.path.Trim(),
                Key = row.key.Trim(),
                Value = sanitizedValue,
                CreationDate = DateTime.UtcNow
            });
            return;
        }

        data.Value = sanitizedValue;
        data.LastUpadteDate = DateTime.UtcNow;
    }

    private static bool TryNormalizeSlug(string? value, out string slug)
    {
        slug = string.Empty;
        if (string.IsNullOrWhiteSpace(value))
            return false;

        slug = value.Trim().Trim('/').ToLowerInvariant();
        slug = System.Text.RegularExpressions.Regex.Replace(slug, @"\s+", "-");
        slug = System.Text.RegularExpressions.Regex.Replace(slug, @"[^a-z0-9\-]", string.Empty);
        slug = System.Text.RegularExpressions.Regex.Replace(slug, @"-{2,}", "-").Trim('-');
        return !string.IsNullOrWhiteSpace(slug);
    }

    private static string NormalizeSlug(string value)
    {
        if (!TryNormalizeSlug(value, out var slug))
            throw new InvalidOperationException("مسیر باید با حروف انگلیسی، عدد و خط تیره نوشته شود.");

        return slug;
    }


    private static List<string> NormalizeProjectGalleryUrls(
        IEnumerable<ProjectGalleryItemDto>? gallery)
    {
        if (gallery is null)
            return new List<string>();

        return gallery
            .Select(item => NormalizeAssetUrl(item.url))
            .Where(url => !string.IsNullOrWhiteSpace(url))
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .Take(100)
            .ToList();
    }

    private static string NormalizeAssetUrl(string value)
    {
        if (string.IsNullOrWhiteSpace(value))
            return string.Empty;

        var url = value.Trim().Replace("http://sakhtekhaneh.ir", "https://sakhtekhaneh.ir", StringComparison.OrdinalIgnoreCase);
        return url;
    }

    private static string? NormalizeTags(string? tags)
    {
        if (string.IsNullOrWhiteSpace(tags))
            return null;

        return string.Join(",",
            tags.Split(new[] { ',', '،', '#', ';' }, StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
                .Select(tag => tag.Trim())
                .Where(tag => tag.Length > 1)
                .Distinct(StringComparer.OrdinalIgnoreCase)
                .Take(20));
    }

    private static string Truncate(string value, int maxLength)
    {
        return value.Length <= maxLength ? value : value[..maxLength];
    }

    private static string TranslateIdentityError(string code, string description)
    {
        return code switch
        {
            "PasswordTooShort" => "رمز عبور باید حداقل ۱۰ کاراکتر باشد.",
            "PasswordRequiresDigit" => "رمز عبور باید حداقل یک عدد داشته باشد.",
            "PasswordRequiresLower" => "رمز عبور باید حداقل یک حرف انگلیسی کوچک داشته باشد.",
            "PasswordRequiresUpper" => "رمز عبور باید حداقل یک حرف انگلیسی بزرگ داشته باشد.",
            "PasswordRequiresNonAlphanumeric" => "رمز عبور باید حداقل یک نماد مانند ! یا @ داشته باشد.",
            "PasswordMismatch" => "رمز عبور فعلی صحیح نیست.",
            _ => description
        };
    }
}
