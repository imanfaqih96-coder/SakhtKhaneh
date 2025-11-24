using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
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

app.Run();
