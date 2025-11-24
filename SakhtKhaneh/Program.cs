using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.FileProviders;
using SakhtKhaneh.Data;
using SakhtKhaneh.Models;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();       // API
builder.Services.AddControllersWithViews(); // MVC Views

builder.Services.AddDbContext<ApplicationDbContext>(options =>
{
    options.UseSqlite(builder.Configuration.GetConnectionString("DefaultConnection"));
});

// Identity
builder.Services.AddIdentity<AppUser, IdentityRole>()
    .AddEntityFrameworkStores<ApplicationDbContext>()
    .AddDefaultTokenProviders();

var app = builder.Build();

app.UseStaticFiles();

app.MapControllers();            // /api
app.MapDefaultControllerRoute(); // /public

// Serve Angular app on /admin
app.Map("/admin", angular =>
{
    angular.UseStaticFiles(new StaticFileOptions
    {
        FileProvider = new PhysicalFileProvider(
            Path.Combine(app.Environment.WebRootPath, "admin")
        ),
        RequestPath = "" // leave as empty
    });

    angular.Run(async context =>
    {
        context.Response.ContentType = "text/html";
        await context.Response.SendFileAsync(
            Path.Combine(app.Environment.WebRootPath, "admin", "index.html")
        );
    });
});

app.Run();
