using Microsoft.AspNetCore.Identity;
using SakhtKhaneh.Models;

namespace SakhtKhaneh.Middleware;

public sealed class PasswordChangeRequiredMiddleware
{
    private static readonly string[] AllowedApiPaths =
    {
        "/api/auth/login",
        "/api/auth/logout",
        "/api/auth/session",
        "/api/getprofile",
        "/api/updateprofile",
        "/api/changepassword",
        "/api/sendmessage",
        "/api/submitvisitrecord"
    };

    private readonly RequestDelegate _next;

    public PasswordChangeRequiredMiddleware(RequestDelegate next)
    {
        _next = next;
    }

    public async Task InvokeAsync(HttpContext context, UserManager<AppUser> userManager)
    {
        if (context.User.Identity?.IsAuthenticated == true &&
            context.Request.Path.StartsWithSegments("/api", StringComparison.OrdinalIgnoreCase) &&
            !AllowedApiPaths.Any(path => context.Request.Path.StartsWithSegments(path, StringComparison.OrdinalIgnoreCase)))
        {
            var user = await userManager.GetUserAsync(context.User);
            if (user?.MustChangePassword == true)
            {
                context.Response.StatusCode = StatusCodes.Status428PreconditionRequired;
                await context.Response.WriteAsJsonAsync(new
                {
                    status = "password-change-required",
                    message = "برای ادامه کار باید رمز عبور پیش‌فرض را تغییر دهید."
                });
                return;
            }
        }

        await _next(context);
    }
}
