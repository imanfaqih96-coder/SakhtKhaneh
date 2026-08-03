using Microsoft.AspNetCore.Identity;
using SakhtKhaneh.Models;

namespace SakhtKhaneh.Services;

public sealed class AdminSeedService
{
    public const string AdministratorRole = "Administrator";
    private const string DefaultPassword = "DefaultPassword";

    private static readonly string[] AdminUserNames =
    {
        "faghih@sakhtekhaneh.ir",
        "kanani@sakhtekhaneh.ir",
        "dadfar@sakhtekhaneh.ir"
    };

    private readonly UserManager<AppUser> _userManager;
    private readonly RoleManager<IdentityRole> _roleManager;
    private readonly IPasswordHasher<AppUser> _passwordHasher;
    private readonly ILogger<AdminSeedService> _logger;

    public AdminSeedService(
        UserManager<AppUser> userManager,
        RoleManager<IdentityRole> roleManager,
        IPasswordHasher<AppUser> passwordHasher,
        ILogger<AdminSeedService> logger)
    {
        _userManager = userManager;
        _roleManager = roleManager;
        _passwordHasher = passwordHasher;
        _logger = logger;
    }

    public async Task SeedAsync()
    {
        if (!await _roleManager.RoleExistsAsync(AdministratorRole))
        {
            var roleResult = await _roleManager.CreateAsync(new IdentityRole(AdministratorRole));
            if (!roleResult.Succeeded)
                throw new InvalidOperationException(string.Join(" | ", roleResult.Errors.Select(e => e.Description)));
        }

        foreach (var userName in AdminUserNames)
        {
            var user = await _userManager.FindByNameAsync(userName)
                       ?? await _userManager.FindByEmailAsync(userName);

            if (user is null)
            {
                user = new AppUser
                {
                    UserName = userName,
                    Email = userName,
                    EmailConfirmed = true,
                    AdministrativeApproval = true,
                    MustChangePassword = true,
                    SecurityStamp = Guid.NewGuid().ToString("N")
                };

                // The requested temporary password intentionally bypasses the normal password policy.
                // It is immediately blocked from all management features until changed.
                user.PasswordHash = _passwordHasher.HashPassword(user, DefaultPassword);

                var createResult = await _userManager.CreateAsync(user);
                if (!createResult.Succeeded)
                    throw new InvalidOperationException(string.Join(" | ", createResult.Errors.Select(e => e.Description)));
            }
            else
            {
                user.UserName = userName;
                user.NormalizedUserName = _userManager.NormalizeName(userName);
                user.Email = userName;
                user.NormalizedEmail = _userManager.NormalizeEmail(userName);
                user.EmailConfirmed = true;
                user.AdministrativeApproval = true;

                // On the first upgraded run, normalize existing predefined accounts to the
                // requested temporary password. PasswordChangedAt prevents future resets.
                if (user.PasswordChangedAt is null && !user.MustChangePassword)
                {
                    user.PasswordHash = _passwordHasher.HashPassword(user, DefaultPassword);
                    user.MustChangePassword = true;
                    user.SecurityStamp = Guid.NewGuid().ToString("N");
                }

                await _userManager.UpdateAsync(user);
            }

            if (!await _userManager.IsInRoleAsync(user, AdministratorRole))
            {
                var roleResult = await _userManager.AddToRoleAsync(user, AdministratorRole);
                if (!roleResult.Succeeded)
                    throw new InvalidOperationException(string.Join(" | ", roleResult.Errors.Select(e => e.Description)));
            }
        }

        _logger.LogInformation("Three predefined administrator accounts are available.");
    }
}
