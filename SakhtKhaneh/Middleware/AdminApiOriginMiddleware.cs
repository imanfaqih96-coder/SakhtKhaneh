namespace SakhtKhaneh.Middleware;

/// <summary>
/// Same-origin protection for cookie-authenticated state-changing admin requests.
/// Public contact and visit endpoints are intentionally excluded.
/// </summary>
public sealed class AdminApiOriginMiddleware
{
    private static readonly string[] PublicPostPaths =
    {
        "/api/sendmessage",
        "/api/submitvisitrecord"
    };

    private readonly RequestDelegate _next;

    public AdminApiOriginMiddleware(RequestDelegate next)
    {
        _next = next;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        var isUnsafeMethod = HttpMethods.IsPost(context.Request.Method) ||
                             HttpMethods.IsPut(context.Request.Method) ||
                             HttpMethods.IsPatch(context.Request.Method) ||
                             HttpMethods.IsDelete(context.Request.Method);

        if (isUnsafeMethod &&
            context.Request.Path.StartsWithSegments("/api", StringComparison.OrdinalIgnoreCase) &&
            !PublicPostPaths.Any(path => context.Request.Path.StartsWithSegments(path, StringComparison.OrdinalIgnoreCase)))
        {
            var origin = context.Request.Headers.Origin.ToString();
            var referer = context.Request.Headers.Referer.ToString();
            var expectedOrigin = $"{context.Request.Scheme}://{context.Request.Host}";

            var validOrigin = !string.IsNullOrWhiteSpace(origin)
                ? string.Equals(origin.TrimEnd('/'), expectedOrigin, StringComparison.OrdinalIgnoreCase)
                : Uri.TryCreate(referer, UriKind.Absolute, out var refererUri) &&
                  string.Equals(refererUri.GetLeftPart(UriPartial.Authority), expectedOrigin, StringComparison.OrdinalIgnoreCase);

            if (!validOrigin)
            {
                context.Response.StatusCode = StatusCodes.Status403Forbidden;
                await context.Response.WriteAsJsonAsync(new
                {
                    status = "forbidden",
                    message = "درخواست از مبدأ معتبر ارسال نشده است."
                });
                return;
            }
        }

        await _next(context);
    }
}
